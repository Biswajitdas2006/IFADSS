import pandas as pd
 
from app.anomaly.predict_isolation_forest import score
from app.anomaly.reason_generator import generate_reason
 
ANOMALY_THRESHOLD = 0.6
 
 
def scan_transactions(transactions: list[dict]) -> list[dict]:
    df = pd.DataFrame(transactions)
    scored = score(df)
 
    results = []
    for _, row in scored.iterrows():

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