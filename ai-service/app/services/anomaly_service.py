import pandas as pd

from app.anomaly.predict_isolation_forest import score
from app.anomaly.reason_generator import generate_reason

ANOMALY_THRESHOLD = 0.6

# Below this vendor-history count, amount_zscore is statistically
# unreliable (a 2-transaction vendor is mathematically guaranteed a
# zscore of +/-0.707 regardless of how similar the amounts actually
# are -- confirmed via direct feature inspection on 2026-08-29).
# BUT low history should only suppress borderline/subtle flags --
# an extreme, obvious deviation should still be caught even with
# little history, since that magnitude isn't a statistical artifact.
MIN_VENDOR_HISTORY_FOR_SCORING = 5

# Confirmed via hand-trace on 2026-08-29 real data: a genuine spike
# (89000 vs ~450-500 baseline) produces a ratio of 178.0, while normal
# variation among near-identical transactions stays under ~1.1. 5.0 is
# comfortably above normal noise and well below a real spike -- revisit
# once more real transaction data is available.
EXTREME_RATIO_OVERRIDE = 5.0


def scan_transactions(transactions: list[dict]) -> list[dict]:
    df = pd.DataFrame(transactions)
    scored = score(df)

    results = []
    for _, row in scored.iterrows():

        has_enough_history = row.get("vendor_frequency", 0) >= MIN_VENDOR_HISTORY_FOR_SCORING
        is_extreme_amount = row.get("amount_vs_median_ratio", 0) >= EXTREME_RATIO_OVERRIDE

        if not has_enough_history and not is_extreme_amount:
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