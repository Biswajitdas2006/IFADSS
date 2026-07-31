import json
from pathlib import Path
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
)
 
from app.classification import model_loader
from app.classification.train import build_feature_matrix
from app.classification.embedding_generator import embed_texts
 
SPLITS_DIR = Path(__file__).resolve().parents[2] / "datasets" / "splits"
 
 
def evaluate(y_test, y_pred) -> dict:
    return {
        "accuracy": accuracy_score(y_test, y_pred),
        "precision_macro": precision_score(y_test, y_pred, average="macro", zero_division=0),
        "recall_macro": recall_score(y_test, y_pred, average="macro", zero_division=0),
        "f1_macro": f1_score(y_test, y_pred, average="macro", zero_division=0),
        "labels": sorted(y_test.unique().tolist()),
        "confusion_matrix": confusion_matrix(
            y_test,
            y_pred,
            labels=sorted(y_test.unique())
        ).tolist(),
    }
 
if __name__ == "__main__":
    version = "v1.0"
    model_loader.load_classifier(version=version)
    model = model_loader.get_classifier()
    encoder = model_loader.get_label_encoder()
 
    test_df = pd.read_csv(SPLITS_DIR / version / "test.csv")
    embeddings = embed_texts(test_df["description"].tolist())
    emb_df = pd.DataFrame(embeddings, columns=[f"dim_{i}" for i in range(embeddings.shape[1])])
    emb_df["amount"] = test_df["amount"].values
    x_test = build_feature_matrix(emb_df)
    y_test = test_df["category"]
 
    y_pred = model.predict(x_test)

    if encoder is not None:
        y_pred = encoder.inverse_transform(y_pred)

    metrics = evaluate(y_test, y_pred)
    print(json.dumps(metrics, indent=2))
 
    out_path = Path(__file__).resolve().parents[2] / "models_store" / "classifier" / version / "metrics.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    json.dump(metrics, open(out_path, "w"), indent=2)
    print(f"Metrics written to {out_path}")