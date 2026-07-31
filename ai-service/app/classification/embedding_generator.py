from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
 
EMBEDDINGS_DIR = Path(__file__).resolve().parents[2] / "datasets" / "embeddings"
_model = None
 
 
def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model
 
 
def embed_texts(texts: list[str]) -> np.ndarray:
    model = get_model()
    return model.encode(texts, batch_size=64, show_progress_bar=True, convert_to_numpy=True)
 
 
def generate_and_cache(df: pd.DataFrame, version: str) -> Path:
    EMBEDDINGS_DIR.mkdir(parents=True, exist_ok=True)
    out_path = EMBEDDINGS_DIR / f"embeddings_{version}.parquet"
    if out_path.exists():
        print(f"Embeddings already cached at {out_path}, skipping.")
        return out_path
    embeddings = embed_texts(df["description"].tolist())
    emb_df = pd.DataFrame(embeddings, columns=[f"dim_{i}" for i in range(embeddings.shape[1])])
    emb_df["description"] = df["description"].values
    emb_df["amount"] = df["amount"].values
    emb_df["category"] = df["category"].values
    emb_df.to_parquet(out_path, index=False)
    return out_path
 
 
if __name__ == "__main__":
    version = "v1.0"
    processed_path = Path(__file__).resolve().parents[2] / "datasets" / "processed" / f"transactions_{version}.csv"
    df = pd.read_csv(processed_path)
    out_path = generate_and_cache(df, version)
    print(f"Embeddings written to {out_path}")
