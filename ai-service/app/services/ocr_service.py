import re
from datetime import datetime

from app.ocr import converter, preprocess, extractor

DATE_PATTERNS = [r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", r"[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}"]
STRONG_TOTAL_KEYWORDS = ["grand total", "amount due", "balance due"]
WEAK_TOTAL_KEYWORDS = ["total"]
TAX_KEYWORDS = ["sgst", "cgst", "vat"]  # bare "gst"/"tax" removed — was false-matching inside "GSTIN"
VENDOR_ANCHORS = ["sold by", "seller", "from:", "billed by"]

# Amounts formatted as ₹748.00, $748.00, 748.00, or 1,234.56
AMOUNT_PATTERN = r"[₹$]?\s*([\d,]+\.\d{2})"


def _try_parse_date(text: str):
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _extract_amount(text: str):
    match = re.search(AMOUNT_PATTERN, text)
    if match:
        return float(match.group(1).replace(",", ""))
    return None


def _find_amount_near(ocr_lines: list[dict], index: int, lookahead: int = 3):
    """
    The label ('Grand Total', 'SGST', etc.) and its numeric value are
    almost always separate OCR boxes on this kind of invoice layout.
    Check the same line first, then the next few lines, for a number.
    """
    amt = _extract_amount(ocr_lines[index]["text"])
    if amt is not None:
        return amt

    for offset in range(1, lookahead + 1):
        next_idx = index + offset
        if next_idx >= len(ocr_lines):
            break
        amt = _extract_amount(ocr_lines[next_idx]["text"])
        if amt is not None:
            return amt

    return None


def parse_fields(ocr_lines: list[dict]) -> dict:
    vendor_name, invoice_date, total_amount, tax_amount = None, None, None, None
    tax_amounts_found = []
    consumed_indices = set()

    # ---- Vendor: search for an explicit anchor first ----
    for i, line in enumerate(ocr_lines):
        lower = line["text"].lower()
        if any(a in lower for a in VENDOR_ANCHORS):
            cleaned = re.split(r"sold by|seller|from:|billed by", line["text"], flags=re.IGNORECASE)[-1]
            vendor_name = cleaned.strip(" :,")
            consumed_indices.add(i)
            break

    if vendor_name is None:
        for i, line in enumerate(ocr_lines[:3]):
            if len(line["text"]) > 3:
                vendor_name = line["text"].strip()
                consumed_indices.add(i)
                break

    # ---- Total: take the MAXIMUM value found next to a strong keyword
    # ("grand total"/"amount due"/"balance due"), not just the first one.
    # NOTE: some source PDFs contain more than one invoice concatenated
    # together (confirmed via a real test file with two "Grand Total"
    # occurrences) -- taking the max is a deliberate choice to surface
    # the largest, most likely-final total rather than assuming document
    # order. Only falls back to a bare "total" match if no strong keyword
    # was found anywhere in the document. ----
    strong_totals = []
    for i, line in enumerate(ocr_lines):
        lower = line["text"].lower()
        if any(k in lower for k in STRONG_TOTAL_KEYWORDS):
            amt = _find_amount_near(ocr_lines, i)
            if amt is not None:
                strong_totals.append(amt)
                consumed_indices.add(i)

    if strong_totals:
        total_amount = max(strong_totals)

    if total_amount is None:
        for i, line in enumerate(ocr_lines):
            lower = line["text"].lower()
            if any(k in lower for k in WEAK_TOTAL_KEYWORDS):
                amt = _find_amount_near(ocr_lines, i)
                if amt is not None:
                    total_amount = amt
                    consumed_indices.add(i)
                    break

    # ---- Date + Tax ----
    for i, line in enumerate(ocr_lines):
        text = line["text"]
        lower = text.lower()

        if invoice_date is None:
            for pattern in DATE_PATTERNS:
                m = re.search(pattern, text)
                if m:
                    parsed = _try_parse_date(m.group())
                    if parsed:
                        invoice_date = parsed
                        consumed_indices.add(i)
                    break

        if any(k in lower for k in TAX_KEYWORDS):
            amt = _find_amount_near(ocr_lines, i)
            if amt is not None:
                tax_amounts_found.append(amt)
                consumed_indices.add(i)

    if tax_amounts_found:
        tax_amount = round(sum(tax_amounts_found), 2)

    # ---- Line items: everything not already consumed by vendor/date/total/tax.
    # KNOWN LIMITATION (not fixed here): invoices whose summary table repeats
    # values also present in an item table, or PDFs containing multiple
    # concatenated invoices, will still produce duplicate/extra line items,
    # since this reads text in OCR order, not table/document structure.
    # Proper fix needs bounding-box row-grouping (see extract_text's 'box'
    # field) and/or document-boundary detection -- scoped as a follow-up. ----
    line_items = []
    for i, line in enumerate(ocr_lines):
        if i in consumed_indices:
            continue
        text = line["text"]
        lower = text.lower()
        if any(k in lower for k in STRONG_TOTAL_KEYWORDS + WEAK_TOTAL_KEYWORDS + TAX_KEYWORDS):
            continue
        amt = _extract_amount(text)
        if amt is not None:
            line_items.append({"description": text.strip(), "amount": amt})

    return {
        "vendorName": vendor_name,
        "invoiceDate": invoice_date,
        "totalAmount": total_amount,
        "taxAmount": tax_amount,
        "lineItems": line_items,
    }


def run_ocr_extraction(file_path: str) -> dict:
    images = converter.pdf_to_images(file_path)
    all_lines = []
    for img in images:
        processed = preprocess.preprocess_image(img)
        all_lines.extend(extractor.extract_text(processed))
    return parse_fields(all_lines)