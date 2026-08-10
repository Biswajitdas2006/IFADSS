import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
import pandas as pd
from sklearn.ensemble import IsolationForest
 
from app.anomaly.feature_builder import build_features
 
MODELS_STORE = Path(__file__).resolve().parents[2] / "models_store" / "isolation_forest"
 
 
def train(features: pd.DataFrame, contamination: float = 0.05) -> IsolationForest:
    model = IsolationForest(n_estimators=100, contamination=contamination, random_state=42)
    model.fit(features)
    return model
 
 
def save(model, version: str, contamination: float) -> Path:
    out_dir = MODELS_STORE / version
    out_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out_dir / "model.joblib")
    metadata = {
        "version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "contamination": contamination,
    }
    json.dump(metadata, open(out_dir / "metadata.json", "w"), indent=2)
    (MODELS_STORE / "ACTIVE_VERSION.txt").write_text(version)
    return out_dir
 
 
if __name__ == "__main__":
    version = "v1.0"

    transactions_path = (
        Path(__file__).resolve().parents[2]
        / "datasets"
        / "processed"
        / "transactions_v1.0.csv"
    )

    transactions = pd.read_csv(transactions_path)

    transactions["transactionDate"] = pd.to_datetime(
        transactions["date"],
        errors="coerce"
    )

    features, _ = build_features(transactions)

    model = train(features)

    save(
        model,
        version,
        contamination=0.05
    )

    print(
        f"Trained and saved Isolation Forest {version}"
    )