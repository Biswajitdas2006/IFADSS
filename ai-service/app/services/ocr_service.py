import re
from datetime import datetime
 
from app.ocr import converter, preprocess, extractor
 
DATE_PATTERNS = [r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}", r"[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}"]
TOTAL_KEYWORDS = ["total", "amount due", "grand total", "balance due"]
TAX_KEYWORDS = ["tax", "gst", "vat"]
 
 
def _try_parse_date(text: str):
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y-%m-%d", "%B %d, %Y", "%b %d, %Y"):
        try:
            return datetime.strptime(text.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return None
 
 
def _extract_amount(text: str):
    match = re.search(r"[\d,]+\.\d{2}", text)
    if match:
        return float(match.group().replace(",", ""))
    return None
 
def parse_fields(ocr_lines: list[dict]) -> dict:
    vendor_name, invoice_date, total_amount, tax_amount = None, None, None, None
    line_items = []
 
    for i, line in enumerate(ocr_lines):
        text = line["text"]
        lower = text.lower()
 
        if vendor_name is None and i < 3 and len(text) > 3:
            vendor_name = text.strip()
 
        if invoice_date is None:
            for pattern in DATE_PATTERNS:
                m = re.search(pattern, text)
                if m:
                    parsed = _try_parse_date(m.group())
                    if parsed:
                        invoice_date = parsed
                    break
 
        if any(k in lower for k in TOTAL_KEYWORDS):
            amt = _extract_amount(text)
            if amt is not None:
                total_amount = amt
 
        if any(k in lower for k in TAX_KEYWORDS):
            amt = _extract_amount(text)
            if amt is not None:
                tax_amount = amt
 
        amt = _extract_amount(text)
        if amt is not None and not any(k in lower for k in TOTAL_KEYWORDS + TAX_KEYWORDS):
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