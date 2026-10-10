import numpy as np
import pandas as pd

from app.anomaly.predict_isolation_forest import score
from app.anomaly.reason_generator import generate_reason
from app.utils.logger import get_logger

logger = get_logger("anomaly-service")

ANOMALY_THRESHOLD = 0.6
MIN_VENDOR_HISTORY_FOR_SCORING = 5
EXTREME_RATIO_OVERRIDE = 5.0

# Rule fallback: amount vs the user's overall median (covers new vendors / fresh invoices)
GLOBAL_MIN_TRANSACTIONS = 4
GLOBAL_RATIO_THRESHOLD = 5.0


def _severity_for_ratio(ratio: float) -> str:
    if ratio >= 20:
        return "High"
    if ratio >= 10:
        return "Medium"
    return "Low"


def _ml_results(df: pd.DataFrame) -> dict:
    out = {}
    try:
        scored = score(df)
    except Exception as e:
        logger.warning("Isolation Forest scoring failed: %s", e)
        return out

    for _, row in scored.iterrows():
        has_enough_history = row.get("vendor_frequency", 0) >= MIN_VENDOR_HISTORY_FOR_SCORING
        is_extreme_amount = row.get("amount_vs_median_ratio", 0) >= EXTREME_RATIO_OVERRIDE

        if not has_enough_history and not is_extreme_amount:
            continue
        if row["anomalyScore"] < ANOMALY_THRESHOLD:
            continue

        reason, severity = generate_reason(row["features"], row["anomalyScore"])
        out[str(row["id"])] = {
            "transactionId": str(row["id"]),
            "anomalyScore": float(row["anomalyScore"]),
            "reason": reason,
            "severity": severity,
        }
    return out


def _rule_results(df: pd.DataFrame) -> dict:
    out = {}
    if len(df) < GLOBAL_MIN_TRANSACTIONS:
        return out

    amounts = df["amount"].astype(float).abs()
    median = float(np.median(amounts))
    if median <= 0:
        return out

    for _, row in df.iterrows():
        amount = abs(float(row["amount"]))
        ratio = amount / median
        if ratio < GLOBAL_RATIO_THRESHOLD:
            continue

        anomaly_score = round(min(0.99, 0.6 + 0.39 * (1 - GLOBAL_RATIO_THRESHOLD / ratio)), 4)
        desc = str(row.get("description", ""))[:80]
        out[str(row["id"])] = {
            "transactionId": str(row["id"]),
            "anomalyScore": anomaly_score,
            "reason": (
                f"Amount {amount:,.2f} is {ratio:.1f}x higher than your typical "
                f"transaction ({median:,.2f}). {desc}"
            ).strip(),
            "severity": _severity_for_ratio(ratio),
        }
    return out


def scan_transactions(transactions: list[dict]) -> list[dict]:
    if not transactions:
        return []

    df = pd.DataFrame(transactions)

    merged = _rule_results(df)
    for tid, item in _ml_results(df).items():
        if tid not in merged or item["anomalyScore"] > merged[tid]["anomalyScore"]:
            merged[tid] = item

    return list(merged.values())