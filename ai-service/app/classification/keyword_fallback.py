"""
Keyword-based fallback for categories the ML classifier has too few
training examples to learn reliably.

Confirmed via the 2026-08-28 evaluation + live predict_transaction()
tests: Rent, Payroll, Utilities, and Software/Subscriptions have too
few real training rows (single digits to low tens) for the embedding
model to form a stable decision boundary. In that state, low-confidence
predictions for these categories tend to fall back onto whichever
well-populated category (Office Supplies, Professional Fees,
Miscellaneous, Travel) happens to sit nearest in embedding space.

This is a stopgap, not a permanent design. Once each category below
has enough real, varied training examples, it should be removed from
FALLBACK_KEYWORDS (or the whole module retired).
"""


FALLBACK_KEYWORDS = {
    "Rent": [
        "rent", "lease", "leasing",
    ],
    "Payroll": [
        "payroll", "salary", "salaries", "wages", "wage", "stipend",
    ],
    "Utilities": [
        "electricity", "water bill", "internet bill", "broadband",
        "telecom", "phone bill", "mobile bill",
        "utility", "utilities",
        # "hosting" removed from here
    ],
    "Software/Subscriptions": [
        "subscription", "workspace", "saas", "renewal",
        "license fee", "licence fee", "software license",
        "hosting",  # moved here — cloud/server hosting is a software service, not a physical utility
    ],
}

# Explicit set (rather than just the keys of FALLBACK_KEYWORDS) so
# there's a single obvious place to shrink as real data improves.
FALLBACK_CATEGORIES = set(FALLBACK_KEYWORDS.keys())


def keyword_fallback_category(description: str) -> str | None:
    """
    Returns a category name if the description contains a keyword
    strongly associated with a data-starved category, else None.

    Case-insensitive substring match. Dict order = priority order if
    a description could match more than one category's keywords.
    """
    if not description:
        return None

    desc_lower = description.lower()

    for category, keywords in FALLBACK_KEYWORDS.items():
        if any(kw in desc_lower for kw in keywords):
            return category

    return None