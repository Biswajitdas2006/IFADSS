import re
from datetime import datetime
from typing import Optional

import numpy as np
from pydantic import BaseModel

from app.ocr import converter, extractor


DATE_PATTERNS = [
    r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",
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
    "invoice no",
    "invoice number",
    "order no",
    "order number",
]

AMOUNT_PATTERN = r"[₹$]?\s*([\d,]+\.\d{2})"


def _try_parse_date(text: str):
    for fmt in (
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%m-%d-%Y",
        "%Y-%m-%d",
        "%Y.%m.%d",
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


def _extract_amount(text: str):
    """
    Extract a monetary amount only when the text itself
    contains a valid currency-like decimal value.

    Dates such as:
        25.09.2025
        2025.09.25

    are explicitly rejected.
    """

    if not text:
        return None

    if DATE_LIKE_PATTERN.search(text):
        return None

    matches = re.findall(
        AMOUNT_PATTERN,
        text,
    )

    if not matches:
        return None

    # Use the last monetary value on the OCR line.
    value = matches[-1]

    try:
        return float(
            value.replace(",", "")
        )
    except ValueError:
        return None


def _find_amount_near(
    ocr_lines: list[dict],
    index: int,
    lookahead: int = 3,
):
    """
    Find an amount on the current OCR line or
    within the next few OCR lines.
    """

    amt = _extract_amount(
        ocr_lines[index]["text"]
    )

    if amt is not None:
        return amt

    for offset in range(1, lookahead + 1):

        next_idx = index + offset

        if next_idx >= len(ocr_lines):
            break

        amt = _extract_amount(
            ocr_lines[next_idx]["text"]
        )

        if amt is not None:
            return amt

    return None


def _is_excluded_line(text: str) -> bool:
    """
    Determines whether an OCR line belongs to invoice
    metadata/summary rather than an actual item.
    """

    if not text:
        return True

    lower = text.lower().strip()

    return any(
        keyword in lower
        for keyword in LINE_ITEM_EXCLUDED_KEYWORDS
    )


def _looks_like_date(text: str) -> bool:
    if not text:
        return False

    return bool(
        DATE_LIKE_PATTERN.search(text)
    )


def _looks_like_metadata(text: str) -> bool:
    """
    Reject common invoice metadata that OCR can mistake
    for transaction line items.
    """

    if not text:
        return True

    lower = text.lower().strip()

    metadata_keywords = [
        "invoice",
        "order",
        "date",
        "gstin",
        "gst no",
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
    ]

    return any(
        keyword in lower
        for keyword in metadata_keywords
    )


def _looks_like_currency_only(text: str) -> bool:
    """
    Reject OCR lines containing only a number/currency value.

    Example:
        {68,989.00
        R58,465.26
        ₹99.00
    """

    if not text:
        return True

    cleaned = text.strip()

    cleaned = re.sub(
        r"[₹$€£¥,\.\d\s]",
        "",
        cleaned,
    )

    # Remove common OCR garbage around currencies.
    cleaned = cleaned.replace(
        "{", ""
    ).replace(
        "}", ""
    ).replace(
        "R", ""
    ).replace(
        "À", ""
    ).replace(
        "¿", ""
    )

    return not cleaned


def _valid_line_item(
    text: str,
    amount: Optional[float],
) -> bool:

    if not text:
        return False

    if amount is None:
        return False

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

    return True


def parse_fields(
    ocr_lines: list[dict],
) -> dict:

    vendor_name = None
    invoice_date = None
    total_amount = None
    tax_amount = None

    tax_amounts_found = []

    consumed_indices = set()

    # ============================================================
    # VENDOR
    # ============================================================

    for i, line in enumerate(ocr_lines):

        text = line["text"]
        lower = text.lower()

        if any(
            anchor in lower
            for anchor in VENDOR_ANCHORS
        ):

            cleaned = re.split(
                r"sold by|seller|from:|billed by",
                text,
                flags=re.IGNORECASE,
            )[-1]

            cleaned = cleaned.strip(
                " :,.-"
            )

            if cleaned:
                vendor_name = cleaned
                consumed_indices.add(i)

            break

    # Only use first lines as vendor fallback if
    # they do not obviously look like invoice metadata.
    if vendor_name is None:

        for i, line in enumerate(
            ocr_lines[:5]
        ):

            text = line["text"].strip()

            if (
                len(text) > 3
                and not _looks_like_metadata(text)
                and not _looks_like_date(text)
            ):

                vendor_name = text
                consumed_indices.add(i)
                break

    # ============================================================
    # INVOICE DATE
    # ============================================================

    for i, line in enumerate(ocr_lines):

        if invoice_date is not None:
            break

        text = line["text"]

        for pattern in DATE_PATTERNS:

            matches = re.findall(
                pattern,
                text,
            )

            for match in matches:

                parsed = _try_parse_date(
                    match
                )

                if parsed:

                    invoice_date = parsed
                    consumed_indices.add(i)

                    break

            if invoice_date:
                break

    # ============================================================
    # TAX
    # ============================================================

    for i, line in enumerate(ocr_lines):

        text = line["text"]
        lower = text.lower()

        if not any(
            keyword in lower
            for keyword in TAX_KEYWORDS
        ):
            continue

        amt = _find_amount_near(
            ocr_lines,
            i,
            lookahead=2,
        )

        if amt is not None:

            tax_amounts_found.append(
                amt
            )

            consumed_indices.add(i)

    if tax_amounts_found:

        tax_amount = round(
            sum(tax_amounts_found),
            2,
        )

    # ============================================================
    # TOTAL
    # ============================================================

    strong_totals = []

    for i, line in enumerate(ocr_lines):

        text = line["text"]
        lower = text.lower()

        if not any(
            keyword in lower
            for keyword in STRONG_TOTAL_KEYWORDS
        ):
            continue

        amt = _find_amount_near(
            ocr_lines,
            i,
            lookahead=3,
        )

        if amt is not None:

            strong_totals.append(
                amt
            )

            consumed_indices.add(i)

    if strong_totals:

        total_amount = max(
            strong_totals
        )

    # Fallback to weak "total"
    if total_amount is None:

        weak_totals = []

        for i, line in enumerate(ocr_lines):

            lower = line["text"].lower()

            if "total" not in lower:
                continue

            # Don't use tax/subtotal lines as final total.
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

            amt = _find_amount_near(
                ocr_lines,
                i,
                lookahead=3,
            )

            if amt is not None:

                weak_totals.append(
                    amt
                )

                consumed_indices.add(i)

        if weak_totals:

            total_amount = max(
                weak_totals
            )

    # ============================================================
    # LINE ITEMS
    # ============================================================

    line_items = []

    seen_items = set()

    for i, line in enumerate(ocr_lines):

        if i in consumed_indices:
            continue

        text = line["text"].strip()

        if not text:
            continue

        if _is_excluded_line(text):
            continue

        if _looks_like_metadata(text):
            continue

        if _looks_like_date(text):
            continue

        amt = _extract_amount(text)

        if not _valid_line_item(
            text,
            amt,
        ):
            continue

        # Normalize description.
        normalized_description = re.sub(
            r"\s+",
            " ",
            text,
        ).strip()

        # Remove OCR garbage around amount.
        normalized_description = re.sub(
            r"^[\{\}\¿ÀR₹$]+\s*",
            "",
            normalized_description,
        ).strip()

        if not normalized_description:
            continue

        # Prevent exact duplicate OCR boxes.
        key = (
            normalized_description.lower(),
            round(amt, 2),
        )

        if key in seen_items:
            continue

        seen_items.add(key)

        line_items.append(
            {
                "description": normalized_description,
                "amount": round(amt, 2),
            }
        )

    return {
        "vendorName": vendor_name,
        "invoiceDate": invoice_date,
        "totalAmount": total_amount,
        "taxAmount": tax_amount,
        "lineItems": line_items,
    }


def run_ocr_extraction(
    file_path: str,
) -> dict:

    images = converter.pdf_to_images(
        file_path
    )

    all_lines = []

    for img in images:

        img_array = np.array(img)

        all_lines.extend(
            extractor.extract_text(
                img_array
            )
        )

    return parse_fields(
        all_lines
    )


class LineItem(BaseModel):

    description: str

    amount: float


class OcrExtractResponse(BaseModel):

    vendorName: Optional[str] = None

    invoiceDate: Optional[str] = None

    totalAmount: Optional[float] = None

    taxAmount: Optional[float] = None

    lineItems: list[LineItem] = []