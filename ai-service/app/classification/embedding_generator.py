from pathlib import Path
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

ROOT_DIR = Path(__file__).resolve().parents[2]

SPLITS_DIR = ROOT_DIR / "datasets" / "splits"
EMBEDDINGS_DIR = ROOT_DIR / "datasets" / "embeddings"

_model = None


def get_model() -> SentenceTransformer:
    global _model

    if _model is None:
        _model = SentenceTransformer("all-MiniLM-L6-v2")

    return _model


def embed_texts(texts: list[str]) -> np.ndarray:

    model = get_model()

    return model.encode(
        texts,
        batch_size=64,
        show_progress_bar=True,
        convert_to_numpy=True,
    )


def create_embeddings(split: str, version: str):

    input_path = (
        SPLITS_DIR
        / version
        / f"{split}.csv"
    )

    output_dir = (
        EMBEDDINGS_DIR
        / version
    )

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    output_path = (
        output_dir
        / f"{split}_embeddings.parquet"
    )

    if output_path.exists():

        print(f"{split} embeddings already exist.")

        return output_path

    print(f"\nGenerating embeddings for {split} dataset...")

    df = pd.read_csv(input_path)

    embeddings = embed_texts(
        df["description"].tolist()
    )

    emb_df = pd.DataFrame(

        embeddings,

        columns=[
            f"dim_{i}"
            for i in range(embeddings.shape[1])
        ],

    )

    emb_df["description"] = df["description"].values
    emb_df["amount"] = df["amount"].values
    emb_df["category"] = df["category"].values

    emb_df.to_parquet(
        output_path,
        index=False,
    )

    print(
        f"Saved {split} embeddings -> {output_path}"
    )

    return output_path


if __name__ == "__main__":

    VERSION = "v1.0"

    for split in [

        "train",

        "val",

        "test",

    ]:

        create_embeddings(
            split,
            VERSION,
        )

    print("\nEmbedding generation completed.")