import re
from datetime import datetime
from typing import Optional

import numpy as np
from pydantic import BaseModel

from app.ocr import converter, extractor


# ============================================================
# CONFIG
# ============================================================

DATE_PATTERNS = [
    r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
    r"\d{4}[.-]\d{1,2}[.-]\d{1,2}",
    r"[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}",
]

DATE_LIKE_PATTERN = re.compile(
    r"\b\d{1,4}[/-]\d{1,2}[/-]\d{1,4}\b"
)

STRONG_TOTAL_KEYWORDS = [
    "grand total",
    "amount due",
    "balance due",
    "net payable",
    "total payable",
    "amount payable",
    "net amount",
    "payable amount",
]

WEAK_TOTAL_KEYWORDS = [
    "total",
]

TAX_KEYWORDS = [
    "sgst",
    "cgst",
    "igst",
    "vat",
]

VENDOR_ANCHORS = [
    "sold by",
    "seller",
    "from:",
    "billed by",
    "sold to",
]

LINE_ITEM_EXCLUDED_KEYWORDS = [
    "invoice date",
    "order date",
    "delivery date",
    "date:",
    "gstin",
    "gst no",
    "gst number",
    "cgst",
    "sgst",
    "igst",
    "vat",
    "tax",
    "subtotal",
    "sub total",
    "grand total",
    "amount due",
    "balance due",
    "total payable",
    "net payable",
    "amount payable",
    "net amount",
    "invoice no",
    "invoice number",
    "order no",
    "order number",
    "payment",
    "shipping",
    "delivery",
    "discount",
]

METADATA_KEYWORDS = [
    "invoice",
    "order",
    "date",
    "gstin",
    "gst no",
    "gst number",
    "phone",
    "mobile",
    "email",
    "address",
    "www.",
    "http://",
    "https://",
    "pincode",
    "pin code",
    "place of supply",
    "state code",
    "hsn",
    "sac",
    "pan",
    "cin",
    "eway",
    "e-way",
]

AMOUNT_PATTERN = re.compile(
    r"""
    (?:
        [₹$€£¥]\s*
    )?
    (
        \d{1,3}(?:,\d{2,3})*
        |
        \d+
    )
    \.
    (\d{2})
    """,
    re.VERBOSE,
)


# ============================================================
# BASIC HELPERS
# ============================================================

def _try_parse_date(text: str):
    for fmt in (
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%Y-%m-%d",
        "%Y.%m.%d",
        "%Y-%d-%m",
        "%B %d, %Y",
        "%b %d, %Y",
    ):
        try:
            return datetime.strptime(
                text.strip(),
                fmt,
            ).date().isoformat()
        except ValueError:
            continue

    return None


def _looks_like_date(text: str) -> bool:
    if not text:
        return False

    return bool(
        DATE_LIKE_PATTERN.search(text)
    )


def _normalize_text(text: str) -> str:
    if not text:
        return ""

    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def _extract_amount(text: str):
    if not text:
        return None

    text = _normalize_text(text)

    # Never extract amounts from dates.
    if _looks_like_date(text):
        return None

    matches = AMOUNT_PATTERN.findall(text)

    if not matches:
        return None

    # Use the last amount on the line.
    integer_part, decimal_part = matches[-1]

    try:
        return float(
            integer_part.replace(",", "")
            + "."
            + decimal_part
        )
    except ValueError:
        return None


def _extract_all_amounts(text: str) -> list[float]:
    if not text:
        return []

    if _looks_like_date(text):
        return []

    values = []

    for integer_part, decimal_part in AMOUNT_PATTERN.findall(text):

        try:
            value = float(
                integer_part.replace(",", "")
                + "."
                + decimal_part
            )

            values.append(value)

        except ValueError:
            continue

    return values


def _looks_like_currency_only(text: str) -> bool:
    if not text:
        return True

    cleaned = text.strip()

    # Remove common currency/number/OCR garbage characters.
    cleaned = re.sub(
        r"[₹$€£¥,\.\d\s{}\[\]():\-+]",
        "",
        cleaned,
    )

    cleaned = cleaned.replace("R", "")
    cleaned = cleaned.replace("À", "")
    cleaned = cleaned.replace("¿", "")

    return not cleaned


def _is_excluded_line(text: str) -> bool:
    if not text:
        return True

    lower = text.lower().strip()

    return any(
        keyword in lower
        for keyword in LINE_ITEM_EXCLUDED_KEYWORDS
    )


def _looks_like_metadata(text: str) -> bool:
    if not text:
        return True

    lower = text.lower().strip()

    return any(
        keyword in lower
        for keyword in METADATA_KEYWORDS
    )


def _clean_amount_prefix(text: str) -> str:
    """
    Removes OCR garbage before an amount.

    Examples:
        "{58,465.26" -> "58,465.26"
        "R58,465.26" -> "58,465.26"
        "₹99.00"      -> "99.00"
    """

    if not text:
        return text

    text = re.sub(
        r"^[\{\}\[\]¿ÀR₹$€£¥]+\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    return text.strip()


# ============================================================
# BOUNDING BOX / ROW GROUPING
# ============================================================

def _box_geometry(box):
    """
    PaddleOCR polygon:

        [[x1,y1],
         [x2,y2],
         [x3,y3],
         [x4,y4]]

    Returns:
        center_x, center_y, left, right, top, bottom
    """

    if not box or len(box) < 4:
        return None

    try:
        xs = [
            float(point[0])
            for point in box
        ]

        ys = [
            float(point[1])
            for point in box
        ]

        left = min(xs)
        right = max(xs)
        top = min(ys)
        bottom = max(ys)

        return {
            "center_x": (left + right) / 2,
            "center_y": (top + bottom) / 2,
            "left": left,
            "right": right,
            "top": top,
            "bottom": bottom,
            "height": bottom - top,
        }

    except Exception:
        return None


def _prepare_detections(
    ocr_lines: list[dict],
) -> list[dict]:

    detections = []

    for index, item in enumerate(ocr_lines):

        text = _normalize_text(
            item.get("text", "")
        )

        if not text:
            continue

        geometry = _box_geometry(
            item.get("box")
        )

        detections.append(
            {
                "index": index,
                "text": text,
                "confidence": item.get(
                    "confidence"
                ),
                "box": item.get("box"),
                "geometry": geometry,
            }
        )

    return detections


def _group_into_rows(
    detections: list[dict],
) -> list[list[dict]]:

    if not detections:
        return []

    # If bounding boxes are unavailable,
    # preserve original OCR ordering.
    if not any(
        item["geometry"]
        for item in detections
    ):
        return [
            [item]
            for item in detections
        ]

    detections = sorted(
        detections,
        key=lambda item: (
            item["geometry"]["center_y"]
            if item["geometry"]
            else 0,
            item["geometry"]["left"]
            if item["geometry"]
            else 0,
        ),
    )

    rows = []

    for detection in detections:

        geometry = detection["geometry"]

        if geometry is None:
            rows.append([detection])
            continue

        center_y = geometry["center_y"]
        height = max(
            geometry["height"],
            1,
        )

        placed = False

        for row in rows:

            row_centers = [
                item["geometry"]["center_y"]
                for item in row
                if item["geometry"]
            ]

            if not row_centers:
                continue

            row_center_y = sum(
                row_centers
            ) / len(row_centers)

            # Adaptive vertical tolerance.
            tolerance = max(
                12.0,
                height * 0.65,
            )

            if abs(
                center_y - row_center_y
            ) <= tolerance:

                row.append(detection)
                placed = True
                break

        if not placed:
            rows.append(
                [detection]
            )

    # Left-to-right within each row.
    for row in rows:
        row.sort(
            key=lambda item: (
                item["geometry"]["left"]
                if item["geometry"]
                else 0
            )
        )

    # Top-to-bottom rows.
    rows.sort(
        key=lambda row: (
            sum(
                item["geometry"]["center_y"]
                for item in row
                if item["geometry"]
            )
            / max(
                len(
                    [
                        item
                        for item in row
                        if item["geometry"]
                    ]
                ),
                1,
            )
        )
    )

    return rows


def _flatten_row(row: list[dict]) -> str:
    return _normalize_text(
        " ".join(
            item["text"]
            for item in row
        )
    )


# ============================================================
# AMOUNT NEAR LINE
# ============================================================

def _find_amount_near(
    ocr_lines: list[dict],
    index: int,
    lookahead: int = 3,
):

    amount = _extract_amount(
        ocr_lines[index]["text"]
    )

    if amount is not None:
        return amount

    for offset in range(
        1,
        lookahead + 1,
    ):

        next_index = index + offset

        if next_index >= len(
            ocr_lines
        ):
            break

        amount = _extract_amount(
            ocr_lines[next_index]["text"]
        )

        if amount is not None:
            return amount

    return None


# ============================================================
# LINE ITEM VALIDATION
# ============================================================

def _valid_line_item(
    text: str,
    amount: Optional[float],
) -> bool:

    if not text:
        return False

    if amount is None:
        return False

    # Ignore zero/negative OCR garbage.
    if amount <= 0:
        return False

    if _looks_like_date(text):
        return False

    if _is_excluded_line(text):
        return False

    if _looks_like_metadata(text):
        return False

    if _looks_like_currency_only(text):
        return False

    # A line that is basically just a number is not
    # a meaningful product/service description.
    stripped = re.sub(
        r"[\d,\.\s₹$€£¥{}\[\]():\-+]",
        "",
        text,
    )

    if len(stripped) < 2:
        return False

    return True


# ============================================================
# MAIN PARSER
# ============================================================

def parse_fields(
    ocr_lines: list[dict],
) -> dict:

    detections = _prepare_detections(
        ocr_lines
    )

    rows = _group_into_rows(
        detections
    )

    # Flatten rows back into OCR line objects
    # while preserving row information.
    grouped_lines = []

    for row in rows:

        text = _flatten_row(row)

        if not text:
            continue

        grouped_lines.append(
            {
                "text": text,
                "items": row,
            }
        )

    vendor_name = None
    invoice_date = None
    total_amount = None
    tax_amount = None

    consumed_indices = set()

    # ========================================================
    # VENDOR
    # ========================================================

    for row in grouped_lines:

        text = row["text"]
        lower = text.lower()

        if any(
            anchor in lower
            for anchor in VENDOR_ANCHORS
        ):

            cleaned = re.split(
                r"sold by|seller|from:|billed by|sold to",
                text,
                flags=re.IGNORECASE,
            )[-1]

            cleaned = cleaned.strip(
                " :,.-"
            )

            if cleaned:

                vendor_name = cleaned

                for item in row["items"]:
                    consumed_indices.add(
                        item["index"]
                    )

                break

    # Fallback vendor:
    # first useful text near top of document.
    if vendor_name is None:

        for row in grouped_lines[:8]:

            text = row["text"].strip()

            if (
                len(text) > 3
                and not _looks_like_metadata(text)
                and not _looks_like_date(text)
                and not _looks_like_currency_only(text)
            ):

                vendor_name = text

                for item in row["items"]:
                    consumed_indices.add(
                        item["index"]
                    )

                break

    # ========================================================
    # INVOICE DATE
    # ========================================================

    for row in grouped_lines:

        if invoice_date is not None:
            break

        text = row["text"]

        for pattern in DATE_PATTERNS:

            matches = re.findall(
                pattern,
                text,
                flags=re.IGNORECASE,
            )

            for match in matches:

                parsed = _try_parse_date(
                    match
                )

                if parsed:

                    invoice_date = parsed

                    for item in row["items"]:
                        consumed_indices.add(
                            item["index"]
                        )

                    break

            if invoice_date:
                break

    # ========================================================
    # TAX
    # ========================================================

    tax_amounts_found = []

    for row in grouped_lines:

        text = row["text"]
        lower = text.lower()

        if not any(
            keyword in lower
            for keyword in TAX_KEYWORDS
        ):
            continue

        amounts = _extract_all_amounts(
            text
        )

        if not amounts:

            # Look at individual OCR detections
            # in the row.
            for item in row["items"]:

                amount = _extract_amount(
                    item["text"]
                )

                if amount is not None:
                    amounts.append(
                        amount
                    )

        if amounts:

            # Usually the final amount on the
            # tax row is the tax amount.
            tax_amounts_found.append(
                amounts[-1]
            )

            for item in row["items"]:
                consumed_indices.add(
                    item["index"]
                )

    if tax_amounts_found:

        tax_amount = round(
            sum(tax_amounts_found),
            2,
        )

    # ========================================================
    # STRONG TOTAL
    # ========================================================

    strong_totals = []

    for row in grouped_lines:

        text = row["text"]
        lower = text.lower()

        if not any(
            keyword in lower
            for keyword in STRONG_TOTAL_KEYWORDS
        ):
            continue

        amounts = _extract_all_amounts(
            text
        )

        if not amounts:
            continue

        amount = amounts[-1]

        if amount > 0:

            strong_totals.append(
                amount
            )

            for item in row["items"]:
                consumed_indices.add(
                    item["index"]
                )

    if strong_totals:

        total_amount = max(
            strong_totals
        )

    # ========================================================
    # WEAK TOTAL
    # ========================================================

    if total_amount is None:

        weak_totals = []

        for row in grouped_lines:

            text = row["text"]
            lower = text.lower()

            if "total" not in lower:
                continue

            if any(
                keyword in lower
                for keyword in [
                    "tax",
                    "cgst",
                    "sgst",
                    "igst",
                    "subtotal",
                    "sub total",
                ]
            ):
                continue

            amounts = _extract_all_amounts(
                text
            )

            if not amounts:
                continue

            amount = amounts[-1]

            if amount > 0:

                weak_totals.append(
                    amount
                )

                for item in row["items"]:
                    consumed_indices.add(
                        item["index"]
                    )

        if weak_totals:

            total_amount = max(
                weak_totals
            )

    # ========================================================
    # LINE ITEMS
    # ========================================================

    line_items = []

    seen_items = set()

    for row in grouped_lines:

        row_items = row["items"]

        # Skip rows already consumed.
        if all(
            item["index"]
            in consumed_indices
            for item in row_items
        ):
            continue

        text = row["text"].strip()

        if not text:
            continue

        if _is_excluded_line(text):
            continue

        if _looks_like_metadata(text):
            continue

        if _looks_like_date(text):
            continue

        # Extract all amounts from the row.
        amounts = _extract_all_amounts(
            text
        )

        if not amounts:
            continue

        amount = amounts[-1]

        # Description = row text with amount removed.
        description = AMOUNT_PATTERN.sub(
            "",
            text,
        ).strip()

        description = _clean_amount_prefix(
            description
        )

        description = re.sub(
            r"\s+",
            " ",
            description,
        ).strip(
            " -:|"
        )

        if not _valid_line_item(
            description,
            amount,
        ):
            continue

        # Ignore suspiciously huge OCR numbers
        # that are likely totals/metadata.
        if total_amount is not None:
            if (
                amount == total_amount
                and amount > 0
            ):
                continue

        key = (
            description.lower(),
            round(amount, 2),
        )

        if key in seen_items:
            continue

        seen_items.add(key)

        line_items.append(
            {
                "description": description,
                "amount": round(
                    amount,
                    2,
                ),
            }
        )

    # ========================================================
    # FINAL VALIDATION
    # ========================================================

    if total_amount is not None:
        total_amount = round(
            total_amount,
            2,
        )

    if tax_amount is not None:
        tax_amount = round(
            tax_amount,
            2,
        )

    return {
        "vendorName": vendor_name,
        "invoiceDate": invoice_date,
        "totalAmount": total_amount,
        "taxAmount": tax_amount,
        "lineItems": line_items,
    }


# ============================================================
# OCR PIPELINE
# ============================================================
def run_ocr_extraction(
    file_path: str,
) -> dict:

    images = converter.pdf_to_images(
        file_path
    )

    all_lines = []

    for image in images:

        image_array = np.array(image)

        extracted = extractor.extract_text(
            image_array
        )

        all_lines.extend(extracted)

    print("\n========== RAW OCR ==========")

    for i, item in enumerate(all_lines):
        print(
            f"[{i}] "
            f"{item.get('text')} "
            f"| confidence={item.get('confidence')} "
            f"| box={item.get('box')}"
        )

    print("========== END RAW OCR ==========\n")

    return parse_fields(all_lines)

# ============================================================
# API MODELS
# ============================================================

class LineItem(BaseModel):

    description: str

    amount: float


class OcrExtractResponse(BaseModel):

    vendorName: Optional[str] = None

    invoiceDate: Optional[str] = None

    totalAmount: Optional[float] = None

    taxAmount: Optional[float] = None

    lineItems: list[LineItem] = []