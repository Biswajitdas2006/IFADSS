from pathlib import Path
import fitz
import pandas as pd
from tqdm import tqdm

PROJECT_ROOT = Path(__file__).resolve().parent.parent

INVOICE_DIR = PROJECT_ROOT / "datasets" / "raw" / "invoices" / "incoming"

OUTPUT_CSV = PROJECT_ROOT / "datasets" / "raw" / "invoices" / "invoice_audit.csv"


VENDOR_HINTS = [
    "amazon",
    "flipkart",
    "uber",
    "ola",
    "marriott",
    "oyo",
    "taj",
    "air india",
    "indigo",
    "irctc",
    "zomato",
    "swiggy",
]


def audit_pdf(pdf_path: Path):

    try:

        document = fitz.open(pdf_path)

        pages = len(document)

        extracted_text = ""

        for page in document:
            extracted_text += page.get_text()

        extracted_text = extracted_text.strip()

        digital = len(extracted_text) > 30

        needs_ocr = not digital

        preview = extracted_text[:250].replace("\n", " ")

        vendor = "Unknown"

        lower = extracted_text.lower()

        for hint in VENDOR_HINTS:
            if hint in lower:
                vendor = hint.title()
                break

        return {
            "filename": pdf_path.name,
            "pages": pages,
            "size_kb": round(pdf_path.stat().st_size / 1024, 2),
            "digital_pdf": digital,
            "needs_ocr": needs_ocr,
            "vendor_hint": vendor,
            "preview": preview,
            "status": "OK",
        }

    except Exception as e:

        return {
            "filename": pdf_path.name,
            "pages": None,
            "size_kb": None,
            "digital_pdf": None,
            "needs_ocr": None,
            "vendor_hint": None,
            "preview": "",
            "status": str(e),
        }


def main():

    pdfs = sorted(INVOICE_DIR.glob("*.pdf"))

    print(f"Found {len(pdfs)} invoice(s).\n")

    rows = []

    for pdf in tqdm(pdfs):
        rows.append(audit_pdf(pdf))

    df = pd.DataFrame(rows)

    df.to_csv(OUTPUT_CSV, index=False)

    print("\nAudit Complete")

    print(df)

    print(f"\nSaved report -> {OUTPUT_CSV}")


if __name__ == "__main__":
    main()