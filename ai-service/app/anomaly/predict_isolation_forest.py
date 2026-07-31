from pathlib import Path
import joblib
import numpy as np
import pandas as pd
 
from app.anomaly.feature_builder import build_features
 
MODELS_STORE = Path(__file__).resolve().parents[2] / "models_store" / "isolation_forest"
_model = None
 
 
def load_model(version: str = "latest") -> None:
    global _model
    resolved = version
    if version == "latest":
        resolved = (MODELS_STORE / "ACTIVE_VERSION.txt").read_text().strip()
    _model = joblib.load(MODELS_STORE / resolved / "model.joblib")
 
 
def score(transactions: pd.DataFrame) -> pd.DataFrame:
    if _model is None:
        raise RuntimeError("Isolation Forest not loaded — call load_model() at startup")
    features, enriched = build_features(transactions)
    raw_scores = _model.decision_function(features)  # higher = more normal
    normalized = (raw_scores - raw_scores.min()) / (raw_scores.max() - raw_scores.min() + 1e-9)
    enriched = enriched.reset_index(drop=True)
    enriched["anomalyScore"] = 1 - normalized  # flip: higher = more anomalous
    enriched["features"] = features.to_dict(orient="records")
    return enriched