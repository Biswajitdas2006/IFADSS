import pandas as pd

from app.anomaly.predict_isolation_forest import score
from app.anomaly.reason_generator import generate_reason

ANOMALY_THRESHOLD = 0.6

# Vendors with fewer transactions than this don't have enough history
# for amount_zscore to be statistically meaningful (a 2-transaction
# vendor is mathematically guaranteed a zscore of +/-0.707 regardless
# of how similar the two amounts actually are -- confirmed via direct
# feature inspection on 2026-08-29). Skip scoring entirely below this
# threshold rather than risk a false positive from an unreliable stat.
MIN_VENDOR_HISTORY_FOR_SCORING = 5


def scan_transactions(transactions: list[dict]) -> list[dict]:
    df = pd.DataFrame(transactions)
    scored = score(df)

    results = []
    for _, row in scored.iterrows():

        if row.get("vendor_frequency", 0) < MIN_VENDOR_HISTORY_FOR_SCORING:
            continue

        if row["anomalyScore"] < ANOMALY_THRESHOLD:
            continue

        reason, severity = generate_reason(
            row["features"],
            row["anomalyScore"]
        )

        results.append({
            "transactionId": row["id"],
            "anomalyScore": float(row["anomalyScore"]),
            "reason": reason,
            "severity": severity,
        })
    return results