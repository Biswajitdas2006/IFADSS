import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
 
RAW_DIR = Path(__file__).resolve().parents[2] / "datasets" / "raw"
PROCESSED_DIR = Path(__file__).resolve().parents[2] / "datasets" / "processed"
SPLITS_DIR = Path(__file__).resolve().parents[2] / "datasets" / "splits"
 
CATEGORY_TAXONOMY = [
    "Office Supplies", "Travel", "Utilities", "Rent", "Payroll",
    "Software/Subscriptions", "Marketing", "Professional Fees", "Miscellaneous",
]
 
# Map any external/Kaggle label variants onto our fixed taxonomy here.
LABEL_REMAP = {
    "office": "Office Supplies", "supplies": "Office Supplies",
    "transport": "Travel", "travel": "Travel", "flights": "Travel",
    "utility": "Utilities", "utilities": "Utilities",
    "rent": "Rent", "housing": "Rent",
    "payroll": "Payroll", "salary": "Payroll", "wages": "Payroll",
    "software": "Software/Subscriptions", "subscription": "Software/Subscriptions",
    "marketing": "Marketing", "advertising": "Marketing",
    "professional": "Professional Fees", "legal": "Professional Fees", "consulting": "Professional Fees",
    "misc": "Miscellaneous", "other": "Miscellaneous",
}
 
 
def load_raw_datasets() -> pd.DataFrame:
    frames = []
    for csv_file in RAW_DIR.glob("*.csv"):
        df = pd.read_csv(csv_file)
        frames.append(df)
    if not frames:
        raise FileNotFoundError(f"No CSV files found in {RAW_DIR}")
    return pd.concat(frames, ignore_index=True)
 
 
def _remap_category(raw_label: str) -> str:
    raw_lower = str(raw_label).strip().lower()
    if raw_label in CATEGORY_TAXONOMY:
        return raw_label
    for key, mapped in LABEL_REMAP.items():
        if key in raw_lower:
            return mapped
    return "Miscellaneous"
 
 
def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.dropna(subset=["description", "amount"]).copy()
    df["description"] = df["description"].astype(str).str.strip()
    df = df[df["description"].str.len() > 0]
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    df = df.dropna(subset=["amount"])
    df["category"] = df["category"].apply(_remap_category)
    df = df.drop_duplicates(subset=["description", "amount"])
    return df.reset_index(drop=True)
 
 
def split(df: pd.DataFrame, seed: int = 42):
    train_df, temp_df = train_test_split(
        df, test_size=0.30, stratify=df["category"], random_state=seed
    )
    val_df, test_df = train_test_split(
        temp_df, test_size=0.50, stratify=temp_df["category"], random_state=seed
    )
    return train_df.reset_index(drop=True), val_df.reset_index(drop=True), test_df.reset_index(drop=True)
 
 
def save_processed(df: pd.DataFrame, version: str) -> Path:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    out_path = PROCESSED_DIR / f"transactions_{version}.csv"
    df.to_csv(out_path, index=False)
    return out_path
 
 
def save_splits(train_df, val_df, test_df, version: str) -> Path:
    out_dir = SPLITS_DIR / version
    out_dir.mkdir(parents=True, exist_ok=True)
    train_df.to_csv(out_dir / "train.csv", index=False)
    val_df.to_csv(out_dir / "val.csv", index=False)
    test_df.to_csv(out_dir / "test.csv", index=False)
    return out_dir
 
 
if __name__ == "__main__":
    version = "v1.0"
    raw = load_raw_datasets()
    cleaned = clean(raw)
    processed_path = save_processed(cleaned, version)
    train_df, val_df, test_df = split(cleaned)
    splits_path = save_splits(train_df, val_df, test_df, version)
    print(f"Processed dataset: {processed_path} ({len(cleaned)} rows)")
    print(f"Splits written to: {splits_path}")
    print(cleaned["category"].value_counts())