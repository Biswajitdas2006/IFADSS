from pathlib import Path
import joblib
 
MODELS_STORE = Path(__file__).resolve().parents[2] / "models_store" / "classifier"
 
_classifier = None
_active_version = None
_label_encoder = None
 
def _resolve_latest() -> str:
    active_file = MODELS_STORE / "ACTIVE_VERSION.txt"
    if not active_file.exists():
        raise FileNotFoundError(
            f"No ACTIVE_VERSION.txt found at {active_file} — train and save a model first."
        )
    return active_file.read_text().strip()
 
 
def load_classifier(version: str = "latest") -> None:
    global _classifier, _active_version
    resolved = _resolve_latest() if version == "latest" else version
    model_path = MODELS_STORE / resolved / "model.joblib"
    _classifier = joblib.load(model_path)
    encoder_path = MODELS_STORE / resolved / "label_encoder.joblib"

    if encoder_path.exists():
        global _label_encoder
        _label_encoder = joblib.load(encoder_path)
    _active_version = resolved
 
 
def get_classifier():
    if _classifier is None:
        raise RuntimeError("Classifier not loaded — call load_classifier() at startup")
    return _classifier
 
 
def get_active_version() -> str:
    return _active_version

def get_label_encoder():
    return _label_encoder