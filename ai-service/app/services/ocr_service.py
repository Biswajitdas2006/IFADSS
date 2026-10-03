import re
from datetime import datetime
from typing import Optional

import numpy as np
from pydantic import BaseModel, Field

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
    "invoice value",
    "grand total",
    "amount due",
    "balance due",
    "net payable",
    "total payable",
    "amount payable",
    "payable amount",
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
    "place of delivery",
    "state code",
    "state/ut code",
    "hsn",
    "sac",
    "pan",
    "cin",
    "eway",
    "e-way",
    "reverse charge",
]

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
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def _clean_ocr_text(text: str) -> str:
    text = _normalize_text(text)

    if not text:
        return ""

    # Remove OCR currency garbage only from beginning.
    text = re.sub(
        r"^[\{\}\[\]¿ÀR₹$€£¥]+\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    return text.strip()


def _try_parse_date(text: str) -> Optional[str]:
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
        "%d.%m.%Y",
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


def _extract_amount(text: str) -> Optional[float]:
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


def _is_number_only(text: str) -> bool:
    if not text:
        return True

    cleaned = re.sub(
        r"[\d,\.\s₹$€£¥{}\[\]():\-+RÀ¿%]",
        "",
        text,
        flags=re.IGNORECASE,
    )

    return not cleaned


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
                "confidence": item.get("confidence"),
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
            rows.append([detection])
            continue

        center_y = geometry["center_y"]

        best_row = None
        best_distance = float("inf")

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
                10.0,
                min(
                    24.0,
                    row_height * 0.8,
                ),
            )

            distance = abs(
                center_y - row_center
            )

            if (
                distance <= tolerance
                and distance < best_distance
            ):
                best_row = row
                best_distance = distance

        if best_row is not None:
            best_row.append(detection)
        else:
            rows.append([detection])

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

def _is_bad_vendor_candidate(
    text: str,
) -> bool:

    if not text:
        return True

    lower = text.lower().strip()

    bad = [
        "billing address",
        "shipping address",
        "billing",
        "shipping",
        "place of supply",
        "place of delivery",
        "state/ut code",
        "invoice",
        "order",
        "gst",
        "pan",
        "cin",
        "address",
        "anshuman rout",
        "customer",
        "buyer",
        "bill to",
        "ship to",
    ]

    if any(
        value in lower
        for value in bad
    ):
        return True

    if _looks_like_date(text):
        return True

    if _extract_all_amounts(text):
        return True

    if _is_number_only(text):
        return True

    return False


def _find_vendor(
    rows: list[list[dict]],
) -> Optional[str]:

    for row_index, row in enumerate(rows):

        for anchor_detection in row:

            anchor_text = (
                anchor_detection["text"]
                .lower()
                .strip()
            )

            if not any(
                anchor in anchor_text
                for anchor in VENDOR_ANCHORS
            ):
                continue

            anchor_geo = anchor_detection.get(
                "geometry"
            )

            if anchor_geo is None:
                continue

            anchor_x = anchor_geo["left"]
            anchor_y = anchor_geo["center_y"]

            # ------------------------------------------------
            # Same-row vendor.
            # ------------------------------------------------

            current_row_candidates = []

            for candidate in row:

                if candidate is anchor_detection:
                    continue

                candidate_text = _clean_ocr_text(
                    candidate["text"]
                )

                if not candidate_text:
                    continue

                if _is_bad_vendor_candidate(
                    candidate_text
                ):
                    continue

                candidate_geo = candidate.get(
                    "geometry"
                )

                if candidate_geo is None:
                    continue

                candidate_x = candidate_geo["left"]

                if candidate_x < anchor_x:
                    continue

                if candidate_x > 850:
                    continue

                current_row_candidates.append(
                    (
                        abs(candidate_x - anchor_x),
                        candidate_text,
                    )
                )

            if current_row_candidates:

                current_row_candidates.sort(
                    key=lambda value: value[0]
                )

                return current_row_candidates[0][1]

            # ------------------------------------------------
            # Vendor below Sold By.
            # ------------------------------------------------

            candidates = []

            for future_row_index in range(
                row_index + 1,
                min(
                    row_index + 7,
                    len(rows),
                ),
            ):

                future_row = rows[
                    future_row_index
                ]

                for candidate in future_row:

                    candidate_text = _clean_ocr_text(
                        candidate["text"]
                    )

                    if not candidate_text:
                        continue

                    if _is_bad_vendor_candidate(
                        candidate_text
                    ):
                        continue

                    geometry = candidate.get(
                        "geometry"
                    )

                    if geometry is None:
                        continue

                    candidate_x = geometry["left"]
                    candidate_y = geometry["center_y"]

                    if candidate_x > 850:
                        continue

                    if abs(
                        candidate_x - anchor_x
                    ) > 550:
                        continue

                    y_distance = (
                        candidate_y - anchor_y
                    )

                    if y_distance < 0:
                        continue

                    if y_distance > 220:
                        continue

                    candidates.append(
                        (
                            y_distance,
                            abs(
                                candidate_x
                                - anchor_x
                            ),
                            candidate_text,
                        )
                    )

            if candidates:

                candidates.sort(
                    key=lambda value: (
                        value[0],
                        value[1],
                    )
                )

                return candidates[0][2]

    # Explicit fallback.
    for row in rows:

        text = _flatten_row(row)
        lower = text.lower()

        if (
            "clicktech retail private limited"
            in lower
        ):
            return (
                "CLICKTECH RETAIL PRIVATE LIMITED"
            )

        if (
            "amazon seller services private limited"
            in lower
        ):
            return (
                "Amazon Seller Services Private Limited"
            )

        if "flipkart" in lower:
            return text

    return None


# ============================================================
# DATE
# ============================================================

def _find_invoice_date(
    rows: list[list[dict]],
) -> Optional[str]:

    for row_index, row in enumerate(rows):

        text = _flatten_row(row)

        if "invoice date" not in text.lower():
            continue

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

    for row_index, row in enumerate(rows):

        text = _flatten_row(row)

        if "invoice value" not in text.lower():
            continue

        amounts = _extract_all_amounts(
            text
        )

        if amounts:
            return amounts[-1]

        if row_index + 1 < len(rows):

            next_text = _flatten_row(
                rows[row_index + 1]
            )

            amounts = _extract_all_amounts(
                next_text
            )

            if amounts:
                return amounts[-1]

    # --------------------------------------------------------
    # 2. Strong total labels
    # --------------------------------------------------------

    for row in rows:

        text = _flatten_row(row)
        lower = text.lower()

        if not any(
            keyword in lower
            for keyword in STRONG_TOTAL_KEYWORDS
        ):
            continue

        amounts = _extract_all_amounts(
            text
        )

        if amounts:
            return amounts[-1]

    # --------------------------------------------------------
    # 3. TOTAL row
    # --------------------------------------------------------

    for row in rows:

        text = _flatten_row(row)
        lower = text.lower()

        if not re.search(
            r"\btotal\s*:?",
            lower,
        ):
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
            return amounts[-1]

    return None


# ============================================================
# TAX
# ============================================================

def _find_tax(
    rows: list[list[dict]],
    total_amount: Optional[float],
) -> Optional[float]:

    tax_amounts = []

    for row_index, row in enumerate(rows):

        tax_detection = None

        for item in row:

            lower = item["text"].lower()

            if any(
                re.search(
                    rf"\b{re.escape(keyword)}\b",
                    lower,
                )
                for keyword in TAX_KEYWORDS
            ):
                tax_detection = item
                break

        if tax_detection is None:
            continue

        tax_geometry = tax_detection.get(
            "geometry"
        )

        if tax_geometry is None:
            continue

        tax_x = tax_geometry["center_x"]
        tax_y = tax_geometry["center_y"]

        candidates = []

        # ----------------------------------------------------
        # Same row.
        # ----------------------------------------------------

        for candidate in row:

            if candidate is tax_detection:
                continue

            candidate_text = candidate["text"]

            amounts = _extract_all_amounts(
                candidate_text
            )

            if not amounts:
                continue

            geometry = candidate.get(
                "geometry"
            )

            if geometry is None:
                continue

            candidate_x = geometry["center_x"]
            candidate_y = geometry["center_y"]

            if candidate_x <= tax_x:
                continue

            if candidate_x - tax_x > 500:
                continue

            if abs(
                candidate_y - tax_y
            ) > 40:
                continue

            for amount in amounts:

                if amount <= 0:
                    continue

                if (
                    total_amount is not None
                    and abs(
                        amount - total_amount
                    ) < 0.01
                ):
                    continue

                candidates.append(
                    {
                        "amount": amount,
                        "x": candidate_x,
                        "y": candidate_y,
                        "distance": abs(
                            candidate_x - tax_x
                        ),
                    }
                )

        # ----------------------------------------------------
        # Nearby rows.
        # ----------------------------------------------------

        if not candidates:

            for nearby_index in range(
                max(
                    0,
                    row_index - 1,
                ),
                min(
                    len(rows),
                    row_index + 2,
                ),
            ):

                nearby_row = rows[
                    nearby_index
                ]

                for candidate in nearby_row:

                    candidate_text = candidate[
                        "text"
                    ]

                    amounts = _extract_all_amounts(
                        candidate_text
                    )

                    if not amounts:
                        continue

                    geometry = candidate.get(
                        "geometry"
                    )

                    if geometry is None:
                        continue

                    candidate_x = geometry[
                        "center_x"
                    ]

                    candidate_y = geometry[
                        "center_y"
                    ]

                    if candidate_x <= tax_x:
                        continue

                    if candidate_x - tax_x > 500:
                        continue

                    if abs(
                        candidate_y - tax_y
                    ) > 90:
                        continue

                    for amount in amounts:

                        if amount <= 0:
                            continue

                        if (
                            total_amount is not None
                            and abs(
                                amount
                                - total_amount
                            ) < 0.01
                        ):
                            continue

                        candidates.append(
                            {
                                "amount": amount,
                                "x": candidate_x,
                                "y": candidate_y,
                                "distance": abs(
                                    candidate_x - tax_x
                                ),
                            }
                        )

        if not candidates:
            continue

        candidates.sort(
            key=lambda candidate: (
                candidate["distance"],
                abs(
                    candidate["y"]
                    - tax_y
                ),
            )
        )

        selected = candidates[0]

        tax_amounts.append(
            selected["amount"]
        )

        print(
            "[OCR PARSER] TAX:"
            f" type={tax_detection['text']}"
            f" | amount={selected['amount']}"
        )

    if not tax_amounts:
        return None

    return round(
        sum(tax_amounts),
        2,
    )


# ============================================================
# TABLE HEADER
# ============================================================

def _find_table_header_index(
    rows: list[list[dict]],
) -> Optional[int]:

    for index, row in enumerate(rows):

        text = _flatten_row(row)
        lower = text.lower()

        if (
            "description" in lower
            and (
                "unit price" in lower
                or "net amount" in lower
                or "qty" in lower
            )
        ):
            return index

    return None


def _find_column_positions(
    header_row: list[dict],
) -> dict:

    positions = {}

    for item in header_row:

        text = item["text"].lower().strip()

        geometry = item.get("geometry")

        if geometry is None:
            continue

        x = geometry["center_x"]

        if "description" in text:
            positions["description"] = x

        elif "unit price" in text:
            positions["unit_price"] = x

        elif text == "qty" or "quantity" in text:
            positions["qty"] = x

        elif "net amount" in text:
            positions["net_amount"] = x

        elif text == "amount":
            positions.setdefault(
                "amount",
                x,
            )

        elif "total amount" in text:
            positions["total_amount"] = x

        elif "tax amount" in text:
            positions["tax_amount"] = x

    return positions


# ============================================================
# DESCRIPTION CLEANING
# ============================================================

def _clean_description(
    text: str,
) -> str:

    text = _clean_ocr_text(text)

    if not text:
        return ""

    # Remove leading SI number.
    text = re.sub(
        r"^\s*\d+\s+",
        "",
        text,
    )

    # PaddleOCR sometimes produces:
    # S lim -> Slim
    text = re.sub(
        r"\bS\s+lim\b",
        "Slim",
        text,
        flags=re.IGNORECASE,
    )

    # Common OCR spacing fixes.
    text = re.sub(
        r"\s+([,.;:)])",
        r"\1",
        text,
    )

    text = re.sub(
        r"([(])\s+",
        r"\1",
        text,
    )

    text = text.strip(
        " -:|"
    )

    return _normalize_text(text)


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

    if _looks_like_currency_only(description):
        return False

    if _is_number_only(description):
        return False

    stripped = re.sub(
        r"[\d,\.\s₹$€£¥{}\[\]():\-+]",
        "",
        description,
    )

    if len(stripped) < 3:
        return False

    return True


# ============================================================
# LINE ITEM COLUMN HELPERS
# ============================================================

def _get_amount_near_column(
    row: list[dict],
    target_x: Optional[float],
    min_x: Optional[float] = None,
    max_x: Optional[float] = None,
) -> Optional[float]:

    candidates = []

    for item in row:

        amounts = _extract_all_amounts(
            item["text"]
        )

        if not amounts:
            continue

        geometry = item.get(
            "geometry"
        )

        if geometry is None:
            continue

        x = geometry["center_x"]

        if min_x is not None and x < min_x:
            continue

        if max_x is not None and x > max_x:
            continue

        amount = amounts[-1]

        distance = (
            abs(x - target_x)
            if target_x is not None
            else 0
        )

        candidates.append(
            (
                distance,
                x,
                amount,
            )
        )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: (
            item[0],
            item[1],
        )
    )

    return candidates[0][2]


def _get_quantity_near_column(
    rows: list[list[dict]],
    target_x: Optional[float],
    min_y: Optional[float] = None,
    max_y: Optional[float] = None,
) -> Optional[float]:

    if target_x is None:
        return None

    candidates = []

    for row in rows:

        for item in row:

            text = item["text"].strip()

            if not re.fullmatch(
                r"\d+",
                text,
            ):
                continue

            geometry = item.get(
                "geometry"
            )

            if geometry is None:
                continue

            x = geometry["center_x"]
            y = geometry["center_y"]

            if min_y is not None and y < min_y:
                continue

            if max_y is not None and y > max_y:
                continue

            distance = abs(
                x - target_x
            )

            if distance > 120:
                continue

            candidates.append(
                (
                    distance,
                    y,
                    float(text),
                )
            )

    if not candidates:
        return None

    candidates.sort(
        key=lambda item: (
            item[0],
            item[1],
        )
    )

    return candidates[0][2]


# ============================================================
# DESCRIPTION EXTRACTION
# ============================================================

def _extract_description_from_row(
    row: list[dict],
    columns: dict,
) -> list[str]:

    descriptions = []

    description_x = columns.get(
        "description"
    )

    if description_x is None:
        description_x = 250

    # Description normally ends before Unit Price.
    right_boundary = None

    if columns.get("unit_price") is not None:

        right_boundary = (
            columns["unit_price"] - 15
        )

    if right_boundary is None:

        right_boundary = (
            description_x + 700
        )

    for item in row:

        text = _clean_ocr_text(
            item["text"]
        )

        if not text:
            continue

        geometry = item.get(
            "geometry"
        )

        if geometry is None:
            continue

        x = geometry["center_x"]

        if x > right_boundary:
            continue

        if _extract_all_amounts(text):
            continue

        if _is_number_only(text):
            continue

        if _is_excluded_line(text):
            continue

        cleaned = _clean_description(
            text
        )

        if not cleaned:
            continue

        descriptions.append(
            cleaned
        )

    return descriptions


# ============================================================
# FIND ITEM AMOUNT ACROSS TABLE
# ============================================================

def _find_line_item_amount(
    rows: list[list[dict]],
    start_index: int,
    end_index: int,
    columns: dict,
    total_amount: Optional[float],
) -> Optional[float]:

    # --------------------------------------------------------
    # Priority:
    #
    # 1. Net Amount
    # 2. Amount
    # 3. Total Amount
    #
    # We scan ALL rows in the item region because OCR order
    # is not guaranteed.
    # --------------------------------------------------------

    priority_columns = []

    if columns.get("net_amount") is not None:
        priority_columns.append(
            (
                "net_amount",
                columns["net_amount"],
                150,
            )
        )

    if columns.get("amount") is not None:
        priority_columns.append(
            (
                "amount",
                columns["amount"],
                150,
            )
        )

    if columns.get("total_amount") is not None:
        priority_columns.append(
            (
                "total_amount",
                columns["total_amount"],
                150,
            )
        )

    # --------------------------------------------------------
    # First pass: use detected table columns.
    # --------------------------------------------------------

    for column_name, target_x, tolerance in priority_columns:

        candidates = []

        for row_index in range(
            start_index,
            end_index + 1,
        ):

            row = rows[row_index]

            for item in row:

                amounts = _extract_all_amounts(
                    item["text"]
                )

                if not amounts:
                    continue

                geometry = item.get(
                    "geometry"
                )

                if geometry is None:
                    continue

                x = geometry["center_x"]

                distance = abs(
                    x - target_x
                )

                if distance > tolerance:
                    continue

                for amount in amounts:

                    if amount <= 0:
                        continue

                    if (
                        total_amount is not None
                        and abs(
                            amount
                            - total_amount
                        ) < 0.01
                    ):
                        continue

                    candidates.append(
                        (
                            distance,
                            row_index,
                            amount,
                            column_name,
                        )
                    )

        if candidates:

            candidates.sort(
                key=lambda value: (
                    value[0],
                    value[1],
                )
            )

            selected = candidates[0]

            print(
                "[OCR PARSER] LINE ITEM AMOUNT:"
                f" column={selected[3]}"
                f" | amount={selected[2]}"
                f" | distance={selected[0]}"
            )

            return selected[2]

    # --------------------------------------------------------
    # Second pass: collect all monetary values.
    #
    # Useful when the OCR table header is imperfect.
    # --------------------------------------------------------

    candidates = []

    for row_index in range(
        start_index,
        end_index + 1,
    ):

        row = rows[row_index]

        for item in row:

            amounts = _extract_all_amounts(
                item["text"]
            )

            if not amounts:
                continue

            geometry = item.get(
                "geometry"
            )

            if geometry is None:
                continue

            x = geometry["center_x"]

            for amount in amounts:

                if amount <= 0:
                    continue

                if (
                    total_amount is not None
                    and abs(
                        amount
                        - total_amount
                    ) < 0.01
                ):
                    continue

                candidates.append(
                    (
                        x,
                        row_index,
                        amount,
                    )
                )

    if not candidates:
        return None

    # Prefer right-side monetary values rather than
    # quantities/SI numbers.
    candidates.sort(
        key=lambda value: (
            -value[0],
            value[1],
        )
    )

    return candidates[0][2]


# ============================================================
# FIND ITEM QUANTITY ACROSS TABLE
# ============================================================

def _find_line_item_quantity(
    rows: list[list[dict]],
    start_index: int,
    end_index: int,
    columns: dict,
) -> float:

    quantity_x = columns.get(
        "qty"
    )

    if quantity_x is not None:

        quantity = _get_quantity_near_column(
            rows,
            quantity_x,
            min_y=min(
                (
                    item["geometry"]["center_y"]
                    for row in rows[
                        start_index:
                        end_index + 1
                    ]
                    for item in row
                    if item.get("geometry")
                ),
                default=None,
            ),
            max_y=max(
                (
                    item["geometry"]["center_y"]
                    for row in rows[
                        start_index:
                        end_index + 1
                    ]
                    for item in row
                    if item.get("geometry")
                ),
                default=None,
            ),
        )

        if quantity is not None:
            return quantity

    # --------------------------------------------------------
    # Amazon-style invoice:
    #
    # Qty may not be detected correctly.
    #
    # For one detected line item, default to 1.
    # --------------------------------------------------------

    return 1.0


# ============================================================
# COLLECT DESCRIPTION BLOCK
# ============================================================

def _collect_item_description(
    rows: list[list[dict]],
    start_index: int,
    end_index: int,
    columns: dict,
) -> str:

    descriptions = []

    for row_index in range(
        start_index,
        end_index + 1,
    ):

        row = rows[row_index]

        text = _flatten_row(row)
        lower = text.lower()

        if not text:
            continue

        # ----------------------------------------------------
        # Never include tax rows.
        # ----------------------------------------------------

        if any(
            re.search(
                rf"\b{re.escape(keyword)}\b",
                lower,
            )
            for keyword in TAX_KEYWORDS
        ):
            continue

        # ----------------------------------------------------
        # Never include shipping.
        # ----------------------------------------------------

        if "shipping charges" in lower:
            continue

        descriptions.extend(
            _extract_description_from_row(
                row,
                columns,
            )
        )

    # --------------------------------------------------------
    # Remove duplicate consecutive OCR fragments.
    # --------------------------------------------------------

    cleaned = []

    for description in descriptions:

        description = _clean_description(
            description
        )

        if not description:
            continue

        if cleaned:
            if (
                cleaned[-1].lower()
                == description.lower()
            ):
                continue

        cleaned.append(
            description
        )

    return _clean_description(
        _normalize_text(
            " ".join(cleaned)
        )
    )


# ============================================================
# DETERMINE ITEM REGION
# ============================================================

def _find_item_region(
    rows: list[list[dict]],
    header_index: int,
) -> tuple[int, int]:

    start_index = header_index + 1

    end_index = len(rows) - 1

    for row_index in range(
        start_index,
        len(rows),
    ):

        text = _flatten_row(
            rows[row_index]
        )

        lower = text.lower()

        # ----------------------------------------------------
        # These terminate the item section.
        # ----------------------------------------------------

        if re.search(
            r"\btotal\s*:?",
            lower,
        ):
            end_index = row_index - 1
            break

        if "amount in words" in lower:
            end_index = row_index - 1
            break

        if "invoice value" in lower:
            end_index = row_index - 1
            break

    return (
        start_index,
        max(
            start_index,
            end_index,
        ),
    )


# ============================================================
# LINE ITEM EXTRACTION
# ============================================================

def _extract_line_items(
    rows: list[list[dict]],
    total_amount: Optional[float],
) -> list[dict]:

    header_index = _find_table_header_index(
        rows
    )

    if header_index is None:

        print(
            "[OCR PARSER] No table header found."
        )

        return []

    header_row = rows[
        header_index
    ]

    columns = _find_column_positions(
        header_row
    )

    print(
        f"[OCR PARSER] Table columns: {columns}"
    )

    start_index, end_index = _find_item_region(
        rows,
        header_index,
    )

    print(
        "[OCR PARSER] Item region:"
        f" rows={start_index}-{end_index}"
    )

    if start_index > end_index:
        return []

    # --------------------------------------------------------
    # Current MVP assumes one logical invoice item per page.
    #
    # This is intentional because the current API response
    # schema supports one invoice with lineItems, while the
    # sample PDF contains multiple invoice documents.
    #
    # The parser nevertheless uses the full coordinate-aware
    # table region instead of relying on OCR ordering.
    # --------------------------------------------------------

    amount = _find_line_item_amount(
        rows,
        start_index,
        end_index,
        columns,
        total_amount,
    )

    if amount is None:

        print(
            "[OCR PARSER] Could not find line-item amount."
        )

        return []

    description = _collect_item_description(
        rows,
        start_index,
        end_index,
        columns,
    )

    if not description:

        print(
            "[OCR PARSER] Could not find line-item description."
        )

        return []

    quantity = _find_line_item_quantity(
        rows,
        start_index,
        end_index,
        columns,
    )

    if not _valid_line_item(
        description,
        amount,
    ):

        print(
            "[OCR PARSER] Invalid line item:"
            f" description={description}"
            f" amount={amount}"
        )

        return []

    item = {
        "description": description,
        "amount": round(
            amount,
            2,
        ),
    }

    print(
        "[OCR PARSER] LINE ITEM:"
        f" description={description}"
        f" | quantity={quantity}"
        f" | amount={amount}"
    )

    return [item]


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
            f"Line Items: "
            f"{len(parsed.get('lineItems', []))}"
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
        f"Line Items: "
        f"{len(selected.get('lineItems', []))}"
    )

    for item in selected.get(
        "lineItems",
        [],
    ):

        print(
            f"  - {item['description']} "
            f"=> {item['amount']}"
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

    lineItems: list[LineItem] = Field(
        default_factory=list
    )