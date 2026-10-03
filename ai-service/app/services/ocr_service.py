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


# Strong invoice total labels.
STRONG_TOTAL_KEYWORDS = [
    "invoice value",
    "grand total",
    "amount due",
    "balance due",
    "net payable",
    "total payable",
    "amount payable",
    "payable amount",
]


WEAK_TOTAL_KEYWORDS = [
    "total:",
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
]


# These should never become product descriptions.
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
    "invoice no",
    "invoice number",
    "order no",
    "order number",
    "payment",
    "shipping",
    "delivery",
    "discount",
    "invoice value",
    "amount in words",
    "reverse charge",
    "service accounting code",
    "hsn",
    "sac",
]


METADATA_KEYWORDS = [
    "invoice",
    "order",
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
    "reverse charge",
]


# Amounts such as:
#
# 58,465.26
# 69068.00
# ₹69,068.00
# {58,465.26
# R58,465.26
#
AMOUNT_PATTERN = re.compile(
    r"""
    (?:
        [₹$€£¥RÀ¿{]+
        \s*
    )?
    (
        \d{1,3}(?:,\d{2,3})+
        |
        \d+
    )
    \.
    (\d{2})
    """,
    re.VERBOSE | re.IGNORECASE,
)


# ============================================================
# BASIC HELPERS
# ============================================================

def _normalize_text(text: str) -> str:

    if not text:
        return ""

    text = str(text)

    text = text.replace("\n", " ")

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text.strip()


def _clean_ocr_text(text: str) -> str:

    text = _normalize_text(text)

    if not text:
        return ""

    # Common PaddleOCR garbage around currency.
    text = re.sub(
        r"^[\{\}\[\]¿ÀR₹$€£¥]+\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    return text.strip()


def _try_parse_date(text: str):

    if not text:
        return None

    text = text.strip()

    formats = [
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%Y-%m-%d",
        "%Y.%m.%d",
        "%Y-%d-%m",
        "%B %d, %Y",
        "%b %d, %Y",
    ]

    for fmt in formats:

        try:

            return datetime.strptime(
                text,
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


def _extract_all_amounts(text: str) -> list[float]:

    if not text:
        return []

    text = _normalize_text(text)

    if not text:
        return []

    # Do not treat date values as money.
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


def _extract_amount(text: str):

    amounts = _extract_all_amounts(text)

    if not amounts:
        return None

    return amounts[-1]


def _looks_like_currency_only(text: str) -> bool:

    if not text:
        return True

    cleaned = text.strip()

    cleaned = re.sub(
        r"[₹$€£¥,\.\d\s{}\[\]():\-+]",
        "",
        cleaned,
    )

    cleaned = cleaned.replace(
        "R",
        "",
    )

    cleaned = cleaned.replace(
        "À",
        "",
    )

    cleaned = cleaned.replace(
        "¿",
        "",
    )

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


# ============================================================
# GEOMETRY
# ============================================================

def _box_geometry(box):

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
            "height": max(
                bottom - top,
                1,
            ),
        }

    except Exception:
        return None


def _prepare_detections(
    ocr_lines: list[dict],
) -> list[dict]:

    detections = []

    for index, item in enumerate(ocr_lines):

        text = _clean_ocr_text(
            item.get(
                "text",
                "",
            )
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


# ============================================================
# ROW GROUPING
# ============================================================

def _group_into_rows(
    detections: list[dict],
) -> list[list[dict]]:

    if not detections:
        return []

    if not any(
        item["geometry"]
        for item in detections
    ):
        return [
            [item]
            for item in detections
        ]

    sorted_detections = sorted(
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

    for detection in sorted_detections:

        geometry = detection["geometry"]

        if geometry is None:

            rows.append(
                [detection]
            )

            continue

        center_y = geometry["center_y"]

        placed = False

        for row in rows:

            geometries = [
                item["geometry"]
                for item in row
                if item["geometry"]
            ]

            if not geometries:
                continue

            row_center = sum(
                item["center_y"]
                for item in geometries
            ) / len(geometries)

            row_height = max(
                item["height"]
                for item in geometries
            )

            tolerance = max(
                8.0,
                min(
                    20.0,
                    row_height * 0.75,
                ),
            )

            if abs(
                center_y - row_center
            ) <= tolerance:

                row.append(
                    detection
                )

                placed = True

                break

        if not placed:

            rows.append(
                [detection]
            )

    for row in rows:

        row.sort(
            key=lambda item: (
                item["geometry"]["left"]
                if item["geometry"]
                else 0
            )
        )

    rows.sort(
        key=lambda row: min(
            (
                item["geometry"]["center_y"]
                for item in row
                if item["geometry"]
            ),
            default=0,
        )
    )

    return rows


def _flatten_row(
    row: list[dict],
) -> str:

    return _normalize_text(
        " ".join(
            item["text"]
            for item in row
        )
    )


# ============================================================
# VENDOR
# ============================================================

def _find_vendor(
    rows: list[list[dict]],
) -> Optional[str]:

    for row_index, row in enumerate(rows):

        text = _flatten_row(row)

        lower = text.lower()

        # Case 1:
        # Sold By : CLICKTECH RETAIL...
        for anchor in VENDOR_ANCHORS:

            if anchor in lower:

                after = re.split(
                    re.escape(anchor),
                    text,
                    maxsplit=1,
                    flags=re.IGNORECASE,
                )[-1].strip(
                    " :-"
                )

                if (
                    after
                    and after.lower()
                    not in VENDOR_ANCHORS
                ):

                    return after

                # Case 2:
                # Sold By :
                #
                # Next OCR row is vendor.
                if row_index + 1 < len(rows):

                    next_text = _flatten_row(
                        rows[row_index + 1]
                    )

                    if (
                        next_text
                        and len(next_text) > 2
                        and not _looks_like_metadata(
                            next_text
                        )
                        and not _looks_like_date(
                            next_text
                        )
                    ):

                        return next_text

    # Fallback: look for known company-like text
    # near top of page.
    for row in rows[:12]:

        text = _flatten_row(row)

        lower = text.lower()

        if not text:
            continue

        if (
            "amazon seller services" in lower
            or "clicktech retail" in lower
            or "flipkart" in lower
        ):

            return text

    return None


# ============================================================
# DATE
# ============================================================

def _find_invoice_date(
    rows: list[list[dict]],
) -> Optional[str]:

    # Prefer explicit Invoice Date.
    for row_index, row in enumerate(rows):

        text = _flatten_row(row)

        lower = text.lower()

        if "invoice date" not in lower:
            continue

        matches = []

        for pattern in DATE_PATTERNS:

            matches.extend(
                re.findall(
                    pattern,
                    text,
                    flags=re.IGNORECASE,
                )
            )

        for match in matches:

            parsed = _try_parse_date(
                match
            )

            if parsed:
                return parsed

        # Date may be in next row.
        if row_index + 1 < len(rows):

            next_text = _flatten_row(
                rows[row_index + 1]
            )

            for pattern in DATE_PATTERNS:

                matches = re.findall(
                    pattern,
                    next_text,
                    flags=re.IGNORECASE,
                )

                for match in matches:

                    parsed = _try_parse_date(
                        match
                    )

                    if parsed:
                        return parsed

    # Fallback.
    for row in rows:

        text = _flatten_row(row)

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
                    return parsed

    return None


# ============================================================
# TOTAL
# ============================================================

def _find_total(
    rows: list[list[dict]],
) -> Optional[float]:

    # --------------------------------------------------------
    # 1. Invoice Value
    # --------------------------------------------------------

    candidates = []

    for row_index, row in enumerate(rows):

        text = _flatten_row(row)

        lower = text.lower()

        if "invoice value" not in lower:
            continue

        amounts = _extract_all_amounts(
            text
        )

        if amounts:

            candidates.append(
                amounts[-1]
            )

        # Value may be next row.
        if row_index + 1 < len(rows):

            next_text = _flatten_row(
                rows[row_index + 1]
            )

            amounts = _extract_all_amounts(
                next_text
            )

            if amounts:

                candidates.append(
                    amounts[-1]
                )

    if candidates:

        return max(candidates)

    # --------------------------------------------------------
    # 2. Grand total / amount payable
    # --------------------------------------------------------

    for row in rows:

        text = _flatten_row(row)

        lower = text.lower()

        if any(
            keyword in lower
            for keyword in STRONG_TOTAL_KEYWORDS
        ):

            amounts = _extract_all_amounts(
                text
            )

            if amounts:

                return max(amounts)

    # --------------------------------------------------------
    # 3. TOTAL row
    # --------------------------------------------------------

    for row in rows:

        text = _flatten_row(row)

        lower = text.lower()

        if "total" not in lower:
            continue

        if any(
            keyword in lower
            for keyword in [
                "tax total",
                "total tax",
                "cgst total",
                "sgst total",
                "igst total",
                "subtotal",
            ]
        ):
            continue

        amounts = _extract_all_amounts(
            text
        )

        if amounts:

            # Usually final amount in a TOTAL row.
            return max(amounts)

    return None


# ============================================================
# TAX
# ============================================================

def _find_tax(
    rows: list[list[dict]],
    total_amount: Optional[float],
) -> Optional[float]:

    tax_amounts = []

    for row in rows:

        text = _flatten_row(row)

        lower = text.lower()

        if not any(
            keyword in lower
            for keyword in TAX_KEYWORDS
        ):
            continue

        # Extract values only from rows where
        # the tax type itself appears.
        amounts = _extract_all_amounts(
            text
        )

        if not amounts:
            continue

        # IMPORTANT:
        #
        # A row can contain:
        #
        # 9% CGST 5,261.87
        #
        # We want 5,261.87,
        # not 9.
        #
        # Since percentages are not captured by
        # AMOUNT_PATTERN, the final amount is safe.
        amount = amounts[-1]

        if amount <= 0:
            continue

        # Never count the invoice total as tax.
        if (
            total_amount is not None
            and abs(
                amount - total_amount
            ) < 0.01
        ):
            continue

        tax_amounts.append(
            amount
        )

    if not tax_amounts:
        return None

    # Remove obvious duplicates.
    unique = []

    for value in tax_amounts:

        if not any(
            abs(
                value - existing
            ) < 0.01
            for existing in unique
        ):

            unique.append(value)

    if not unique:
        return None

    return round(
        sum(unique),
        2,
    )


# ============================================================
# LINE ITEM
# ============================================================

def _valid_line_item(
    description: str,
    amount: Optional[float],
) -> bool:

    if not description:
        return False

    if amount is None:
        return False

    if amount <= 0:
        return False

    if _looks_like_date(description):
        return False

    if _is_excluded_line(description):
        return False

    if _looks_like_metadata(description):
        return False

    if _looks_like_currency_only(description):
        return False

    stripped = re.sub(
        r"[\d,\.\s₹$€£¥{}\[\]():\-+]",
        "",
        description,
    )

    if len(stripped) < 3:
        return False

    return True


def _extract_line_items(
    rows: list[list[dict]],
    total_amount: Optional[float],
) -> list[dict]:

    line_items = []

    seen = set()

    # Locate the table header first.
    table_started = False

    for row in rows:

        text = _flatten_row(row)

        lower = text.lower()

        if (
            "description" in lower
            and (
                "unit price" in lower
                or "amount" in lower
                or "qty" in lower
            )
        ):

            table_started = True
            continue

        if not table_started:
            continue

        # Stop after TOTAL.
        if re.search(
            r"\btotal\s*:?",
            lower,
        ):

            break

        if _is_excluded_line(text):
            continue

        if _looks_like_metadata(text):
            continue

        # ----------------------------------------------------
        # Important:
        #
        # For table rows, PaddleOCR often produces:
        #
        # Description fragments
        # Amount
        #
        # as separate OCR detections.
        #
        # Therefore inspect individual detections.
        # ----------------------------------------------------

        amounts = []

        description_parts = []

        for item in row:

            item_text = item["text"]

            item_amounts = _extract_all_amounts(
                item_text
            )

            if item_amounts:

                amounts.extend(
                    item_amounts
                )

            else:

                cleaned = _clean_ocr_text(
                    item_text
                )

                if cleaned:
                    description_parts.append(
                        cleaned
                    )

        if not amounts:
            continue

        # For an invoice table, the final monetary
        # value in the row is normally total amount.
        amount = amounts[-1]

        if (
            total_amount is not None
            and abs(
                amount - total_amount
            ) < 0.01
        ):
            continue

        description = _normalize_text(
            " ".join(
                description_parts
            )
        )

        # Remove leading row numbering.
        description = re.sub(
            r"^\d+\s+",
            "",
            description,
        )

        description = description.strip(
            " -:|"
        )

        if not _valid_line_item(
            description,
            amount,
        ):
            continue

        key = (
            description.lower(),
            round(amount, 2),
        )

        if key in seen:
            continue

        seen.add(key)

        line_items.append(
            {
                "description": description,
                "amount": round(
                    amount,
                    2,
                ),
            }
        )

    return line_items


# ============================================================
# PAGE PARSER
# ============================================================

def parse_page(
    ocr_lines: list[dict],
) -> dict:

    detections = _prepare_detections(
        ocr_lines
    )

    rows = _group_into_rows(
        detections
    )

    vendor_name = _find_vendor(
        rows
    )

    invoice_date = _find_invoice_date(
        rows
    )

    total_amount = _find_total(
        rows
    )

    tax_amount = _find_tax(
        rows,
        total_amount,
    )

    line_items = _extract_line_items(
        rows,
        total_amount,
    )

    return {
        "vendorName": vendor_name,
        "invoiceDate": invoice_date,
        "totalAmount": total_amount,
        "taxAmount": tax_amount,
        "lineItems": line_items,
    }


# ============================================================
# DOCUMENT SELECTION
# ============================================================

def _score_page(
    page_result: dict,
) -> int:

    score = 0

    if page_result.get(
        "vendorName"
    ):
        score += 3

    if page_result.get(
        "invoiceDate"
    ):
        score += 2

    if page_result.get(
        "totalAmount"
    ):
        score += 4

    if page_result.get(
        "taxAmount"
    ):
        score += 2

    score += min(
        len(
            page_result.get(
                "lineItems",
                [],
            )
        ),
        3,
    )

    return score


def _select_primary_page(
    page_results: list[dict],
) -> Optional[dict]:

    if not page_results:
        return None

    valid = [
        result
        for result in page_results
        if (
            result.get("vendorName")
            or result.get("totalAmount")
            or result.get("invoiceDate")
        )
    ]

    if not valid:
        return None

    return max(
        valid,
        key=_score_page,
    )


# ============================================================
# OCR PIPELINE
# ============================================================

def run_ocr_extraction(
    file_path: str,
) -> dict:

    images = converter.pdf_to_images(
        file_path
    )

    page_results = []

    print(
        "\n===================================================="
    )

    print(
        "OCR DOCUMENT START"
    )

    print(
        f"PDF pages detected: {len(images)}"
    )

    print(
        "===================================================="
    )

    for page_number, image in enumerate(
        images,
        start=1,
    ):

        image_array = np.array(
            image
        )

        extracted = extractor.extract_text(
            image_array
        )

        print(
            "\n===================================================="
        )

        print(
            f"RAW OCR PAGE {page_number}"
        )

        print(
            "===================================================="
        )

        for index, item in enumerate(
            extracted
        ):

            print(
                f"[P{page_number}:{index}] "
                f"{item.get('text')} "
                f"| confidence={item.get('confidence')} "
                f"| box={item.get('box')}"
            )

        print(
            f"========== END RAW OCR PAGE {page_number} =========="
        )

        parsed = parse_page(
            extracted
        )

        print(
            "\n---------- PAGE PARSED RESULT ----------"
        )

        print(
            f"Page: {page_number}"
        )

        print(
            f"Vendor: {parsed.get('vendorName')}"
        )

        print(
            f"Invoice Date: {parsed.get('invoiceDate')}"
        )

        print(
            f"Total: {parsed.get('totalAmount')}"
        )

        print(
            f"Tax: {parsed.get('taxAmount')}"
        )

        print(
            f"Line Items: {len(parsed.get('lineItems', []))}"
        )

        for item in parsed.get(
            "lineItems",
            [],
        ):

            print(
                f"  - {item['description']} "
                f"=> {item['amount']}"
            )

        print(
            "----------------------------------------"
        )

        page_results.append(
            parsed
        )

    # ========================================================
    # PRIMARY PAGE
    # ========================================================

    selected = _select_primary_page(
        page_results
    )

    if selected is None:

        return {
            "vendorName": None,
            "invoiceDate": None,
            "totalAmount": None,
            "taxAmount": None,
            "lineItems": [],
        }

    print(
        "\n===================================================="
    )

    print(
        "PRIMARY INVOICE PAGE SELECTED"
    )

    print(
        "===================================================="
    )

    print(
        f"Vendor: {selected.get('vendorName')}"
    )

    print(
        f"Invoice Date: {selected.get('invoiceDate')}"
    )

    print(
        f"Total: {selected.get('totalAmount')}"
    )

    print(
        f"Tax: {selected.get('taxAmount')}"
    )

    print(
        f"Line Items: {len(selected.get('lineItems', []))}"
    )

    print(
        "====================================================\n"
    )

    return selected


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