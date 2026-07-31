import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
 
MODELS_STORE = Path(__file__).resolve().parents[2] / "models_store" / "classifier"
 
 
def save(model, version: str, dataset_version: str, metrics: dict) -> Path:
    out_dir = MODELS_STORE / version
    out_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, out_dir / "model.joblib")
 
    metadata = {
        "version": version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": dataset_version,
        "metrics": metrics,
        "xgboost_params": model.get_params(),
    }
    json.dump(metadata, open(out_dir / "metadata.json", "w"), indent=2, default=str)
 
    active_file = MODELS_STORE / "ACTIVE_VERSION.txt"
    active_file.write_text(version)
 
    return out_dir