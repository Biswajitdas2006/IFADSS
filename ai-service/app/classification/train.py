import numpy as np
import pandas as pd
import xgboost as xgb

from pathlib import Path
from sklearn.preprocessing import LabelEncoder

from app.classification import save_model

ROOT_DIR = Path(__file__).resolve().parents[2]

EMBEDDINGS_DIR = ROOT_DIR / "datasets" / "embeddings"


def build_feature_matrix(df: pd.DataFrame) -> np.ndarray:

    embedding_cols = [
        c
        for c in df.columns
        if c.startswith("dim_")
    ]

    embeddings = df[embedding_cols].values

    log_amount = np.log1p(
        df["amount"].values
    ).reshape(-1, 1)

    return np.hstack([
        embeddings,
        log_amount,
    ])


def train_model(
    x_train,
    y_train,
    x_val,
    y_val,
):

    model = xgb.XGBClassifier(

        n_estimators=300,

        max_depth=6,

        learning_rate=0.1,

        objective="multi:softprob",

        eval_metric="mlogloss",

        early_stopping_rounds=20,

        random_state=42,

    )

    model.fit(

        x_train,

        y_train,

        eval_set=[
            (
                x_val,
                y_val,
            )
        ],

        verbose=True,

    )

    return model


if __name__ == "__main__":

    VERSION = "v1.0"

    train_df = pd.read_parquet(

        EMBEDDINGS_DIR
        / VERSION
        / "train_embeddings.parquet"

    )

    val_df = pd.read_parquet(

        EMBEDDINGS_DIR
        / VERSION
        / "val_embeddings.parquet"

    )

    x_train = build_feature_matrix(
        train_df
    )

    x_val = build_feature_matrix(
        val_df
    )

    encoder = LabelEncoder()

    y_train = encoder.fit_transform(
        train_df["category"]
    )

    y_val = encoder.transform(
        val_df["category"]
    )

    model = train_model(

        x_train,

        y_train,

        x_val,

        y_val,

    )

    save_model.save(

        model=model,

        version=VERSION,

        dataset_version=VERSION,

        metrics={},

        label_encoder=encoder,

    )

    print("\nClassifier training completed.")