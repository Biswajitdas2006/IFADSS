import numpy as np
import pandas as pd
import xgboost as xgb
from pathlib import Path
 
from app.classification import save_model
 
EMBEDDINGS_DIR = Path(__file__).resolve().parents[2] / "datasets" / "embeddings"
 
 
def build_feature_matrix(emb_df: pd.DataFrame) -> np.ndarray:
    embedding_cols = [c for c in emb_df.columns if c.startswith("dim_")]
    embeddings = emb_df[embedding_cols].values
    log_amount = np.log1p(emb_df["amount"].values).reshape(-1, 1)
    return np.hstack([embeddings, log_amount])
 
 
def train_model(x_train, y_train, x_val, y_val) -> xgb.XGBClassifier:
    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        eval_metric="mlogloss",
        early_stopping_rounds=20,
        objective="multi:softprob",
    )
    model.fit(x_train, y_train, eval_set=[(x_val, y_val)], verbose=False)
    return model
 
 
if __name__ == "__main__":
    version = "v1.0"
    emb_df = pd.read_parquet(EMBEDDINGS_DIR / f"embeddings_{version}.parquet")
 
    # Simple 85/15 train/val split of the already-clean embedded data
    # (the held-out TEST split lives separately in datasets/splits/ and is
    # only ever touched by evaluate.py — never used here).
    shuffled = emb_df.sample(frac=1.0, random_state=42).reset_index(drop=True)
    cut = int(len(shuffled) * 0.85)
    train_df, val_df = shuffled.iloc[:cut], shuffled.iloc[cut:]
 
    x_train, x_val = build_feature_matrix(train_df), build_feature_matrix(val_df)
    y_train, y_val = train_df["category"], val_df["category"]
 
    model = train_model(x_train, y_train, x_val, y_val)
    save_model.save(model, version=version, dataset_version=version, metrics={})
    print(f"Trained and saved classifier {version}")