from pathlib import Path
import joblib
import pandas as pd
 
MODELS_STORE = Path(__file__).resolve().parents[2] / "models_store" / "prophet"
_models: dict = {}
 
 
def load_all_models() -> None:
    for metric_dir in MODELS_STORE.iterdir():
        if not metric_dir.is_dir():
            continue
        active_file = metric_dir / "ACTIVE_VERSION.txt"
        if not active_file.exists():
            continue
        version = active_file.read_text().strip()
        model_path = metric_dir / f"{version}_model.joblib"
        if model_path.exists():
            _models[metric_dir.name] = joblib.load(model_path)
 
 
def forecast(metric_type: str, horizon_days: int = 30) -> list[dict]:
    model = _models.get(metric_type.lower())
    if model is None:
        raise RuntimeError(f"No trained Prophet model available for metric '{metric_type}'")
    future = model.make_future_dataframe(periods=horizon_days)
    fc = model.predict(future)
    tail = fc[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(horizon_days)
    return [
        {
            "date": row.ds.date().isoformat(),
            "predicted": float(row.yhat),
            "lowerBound": float(row.yhat_lower),
            "upperBound": float(row.yhat_upper),
        }
        for row in tail.itertuples()
    ]