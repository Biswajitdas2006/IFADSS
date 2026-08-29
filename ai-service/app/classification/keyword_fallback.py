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

Matching uses word-boundary regex (not plain substring) so short
keywords like "rent" don't false-positive inside unrelated words
like "rental" -- confirmed via edge-case testing on 2026-08-29.
"""

import re

FALLBACK_KEYWORDS = {
    "Rent": [
        "rent", "lease", "leasing", "landlord", "tenancy",
    ],
    "Payroll": [
        "payroll", "salary", "salaries", "wages", "wage", "stipend",
        "compensation", "disbursement to staff", "staff disbursement",
    ],
    "Utilities": [
        "electricity", "electric bill", "power bill", "grid provider",
        "water bill", "internet bill", "broadband",
        "telecom", "phone bill", "mobile bill",
        "utility", "utilities",
    ],
    "Software/Subscriptions": [
        "subscription", "workspace", "saas", "renewal", "renewal fee",
        "license fee", "licence fee", "software license",
        "hosting",
        # common SaaS/software brand names seen in real invoices
        "creative cloud", "adobe", "zoom", "slack", "microsoft 365",
        "google workspace", "dropbox", "notion", "figma",
    ],
}

# Explicit set (rather than just the keys of FALLBACK_KEYWORDS) so
# there's a single obvious place to shrink as real data improves.
FALLBACK_CATEGORIES = set(FALLBACK_KEYWORDS.keys())


def keyword_fallback_category(description: str) -> str | None:
    """
    Returns a category name if the description contains a keyword
    strongly associated with a data-starved category, else None.

    Word-boundary regex match, case-insensitive. Multi-word keywords
    (e.g. "creative cloud") match as a phrase. Dict order = priority
    order if a description could match more than one category.
    """
    if not description:
        return None

    desc_lower = description.lower()

    for category, keywords in FALLBACK_KEYWORDS.items():
        for kw in keywords:
            if re.search(rf"\b{re.escape(kw)}\b", desc_lower):
                return category

    return None