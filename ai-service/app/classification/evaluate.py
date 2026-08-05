import json
from pathlib import Path

import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

from app.classification import model_loader
from app.classification.train import build_feature_matrix

ROOT_DIR = Path(__file__).resolve().parents[2]

EMBEDDINGS_DIR = ROOT_DIR / "datasets" / "embeddings"
MODELS_DIR = ROOT_DIR / "models_store" / "classifier"


def evaluate(y_true, y_pred):

    return {

        "accuracy": accuracy_score(y_true, y_pred),

        "precision_macro": precision_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        ),

        "recall_macro": recall_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        ),

        "f1_macro": f1_score(
            y_true,
            y_pred,
            average="macro",
            zero_division=0,
        ),

        "labels": sorted(
            y_true.unique().tolist()
        ),

        "confusion_matrix": confusion_matrix(
            y_true,
            y_pred,
            labels=sorted(y_true.unique()),
        ).tolist(),

    }


if __name__ == "__main__":

    VERSION = "v1.0"

    model_loader.load_classifier(version=VERSION)

    model = model_loader.get_classifier()

    encoder = model_loader.get_label_encoder()

    test_df = pd.read_parquet(

        EMBEDDINGS_DIR
        / VERSION
        / "test_embeddings.parquet"

    )

    x_test = build_feature_matrix(test_df)

    y_true = test_df["category"]

    y_pred = model.predict(x_test)

    if encoder is not None:

        y_pred = encoder.inverse_transform(y_pred)

    metrics = evaluate(
        y_true,
        y_pred,
    )

    print("\nEvaluation Metrics")
    print("-" * 40)

    print(f"Accuracy         : {metrics['accuracy']:.4f}")
    print(f"Precision Macro  : {metrics['precision_macro']:.4f}")
    print(f"Recall Macro     : {metrics['recall_macro']:.4f}")
    print(f"F1 Score Macro   : {metrics['f1_macro']:.4f}")

    out_path = (
        MODELS_DIR
        / VERSION
        / "metrics.json"
    )

    with open(out_path, "w") as f:

        json.dump(
            metrics,
            f,
            indent=2,
        )

    print(f"\nMetrics saved to\n{out_path}")