import random
import csv
from pathlib import Path
 
VENDORS = {
    "Office Supplies": ["Staples Inc.", "Amazon Business", "Office Depot"],
    "Travel": ["Uber", "Delta Airlines", "Marriott Hotels"],
    "Utilities": ["Con Edison", "AT&T", "City Water Dept"],
    "Rent": ["Blackstone Properties", "WeWork"],
    "Payroll": ["Gusto Payroll", "ADP"],
    "Software/Subscriptions": ["Notion", "Slack", "Microsoft 365"],
    "Marketing": ["Meta Ads", "Google Ads", "Mailchimp"],
    "Professional Fees": ["Deloitte Consulting", "Local CPA Firm"],
    "Miscellaneous": ["7-Eleven", "Local Cafe"],
}
 
AMOUNT_RANGES = {
    "Office Supplies": (10, 400), "Travel": (30, 1200), "Utilities": (50, 500),
    "Rent": (900, 5000), "Payroll": (1500, 8000), "Software/Subscriptions": (10, 300),
    "Marketing": (50, 2000), "Professional Fees": (200, 3000), "Miscellaneous": (5, 150),
}
 
 
def generate(rows_per_category: int = 60) -> list[dict]:
    rows = []
    for category, vendors in VENDORS.items():
        low, high = AMOUNT_RANGES[category]
        for _ in range(rows_per_category):
            vendor = random.choice(vendors)
            amount = round(random.uniform(low, high), 2)
            rows.append({
                "description": f"{vendor} - {category}",
                "amount": amount,
                "category": category,
            })
    random.shuffle(rows)
    return rows
 
 
if __name__ == "__main__":
    out_path = Path(__file__).resolve().parent.parent / "datasets" / "raw" / "synthetic_transactions_v1.csv"
    rows = generate()
    with open(out_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["description", "amount", "category"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} synthetic rows to {out_path}")