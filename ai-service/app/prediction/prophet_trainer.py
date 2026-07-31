import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
import pandas as pd
from prophet import Prophet
 
MODELS_STORE = Path(__file__).resolve().parents[2] / "models_store" / "prophet"
 
 
def train(history_df: pd.DataFrame) -> Prophet:
    """history_df needs columns 'ds' (date) and 'y' (aggregated value)."""
    model = Prophet(
        changepoint_prior_scale=0.05,
        seasonality_mode="additive",
        interval_width=0.80,
    )
    model.fit(history_df)
    return model
 
 
def save(model, metric_type: str, version: str = "v1") -> Path:
    out_dir = MODELS_STORE / metric_type.lower()
    out_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out_dir / f"{version}_model.joblib")
    metadata = {"metricType": metric_type, "version": version, "trained_at": datetime.now(timezone.utc).isoformat()}
    json.dump(metadata, open(out_dir / f"{version}_metadata.json", "w"), indent=2)
    (out_dir / "ACTIVE_VERSION.txt").write_text(version)
    return out_dir
 
 
if __name__ == "__main__":
    # Example: aggregate daily CashFlow from a processed transactions CSV.
    tx_path = Path(__file__).resolve().parents[2] / "datasets" / "processed" / "transactions_v1.0.csv"
    df = pd.read_csv(tx_path)
    df["transactionDate"] = pd.to_datetime(df.get("transactionDate", pd.Timestamp.now()))
    daily = df.groupby(df["transactionDate"].dt.date)["amount"].sum().reset_index()
    daily.columns = ["ds", "y"]
 
    model = train(daily)
    save(model, metric_type="CashFlow")
    print("Trained and saved Prophet model for CashFlow")