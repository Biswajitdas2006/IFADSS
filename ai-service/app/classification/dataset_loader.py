'''import pandas as pd
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
'''

from pathlib import Path
import random
import logging

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# -------------------------------------------------------
# Logging
# -------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

logger = logging.getLogger(__name__)

# -------------------------------------------------------
# Paths
# -------------------------------------------------------

ROOT_DIR = Path(__file__).resolve().parents[2]

RAW_DIR = ROOT_DIR / "datasets" / "raw"
PROCESSED_DIR = ROOT_DIR / "datasets" / "processed"
SPLITS_DIR = ROOT_DIR / "datasets" / "splits"

DATASET_VERSION = "v1.0"

RANDOM_SEED = 42

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# -------------------------------------------------------
# Final Project Taxonomy
# -------------------------------------------------------

CATEGORY_TAXONOMY = [

    "Office Supplies",
    "Travel",
    "Utilities",
    "Rent",
    "Payroll",
    "Software/Subscriptions",
    "Marketing",
    "Professional Fees",
    "Miscellaneous"

]

# -------------------------------------------------------
# Excel Category Mapping
# -------------------------------------------------------
EXCEL_CATEGORY_MAP = {

    "Alcohol & Bars": "Miscellaneous",
    "Auto Insurance": "Professional Fees",
    "Coffee Shops": "Miscellaneous",
    "Credit Card Payment": "Professional Fees",
    "Electronics & Software": "Software/Subscriptions",
    "Entertainment": "Miscellaneous",
    "Fast Food": "Miscellaneous",
    "Food & Dining": "Miscellaneous",
    "Gas & Fuel": "Travel",
    "Groceries": "Office Supplies",
    "Haircut": "Miscellaneous",
    "Home Improvement": "Office Supplies",
    "Internet": "Utilities",
    "Mobile Phone": "Utilities",
    "Mortgage & Rent": "Rent",
    "Movies & Dvds": "Software/Subscriptions",
    "Music": "Software/Subscriptions",
    "Paycheck": "Payroll",
    "Restaurants": "Miscellaneous",
    "Shopping": "Office Supplies",
    "Television": "Utilities",
    "Utilities": "Utilities",

}

# -------------------------------------------------------
# Indian Dataset Mapping
# -------------------------------------------------------

INDIAN_CATEGORY_MAP = {

    "Shopping": "Office Supplies",
    "Travel": "Travel",
    "Food": "Miscellaneous",
    "Investment": "Professional Fees",
    "EMI": "Rent",

}

# -------------------------------------------------------
# Synthetic Amount Generator
# -------------------------------------------------------

CATEGORY_AMOUNT_RANGE = {

    "Office Supplies": (20, 500),

    "Travel": (50, 3000),

    "Utilities": (30, 1000),

    "Rent": (1000, 5000),

    "Payroll": (500, 10000),

    "Software/Subscriptions": (10, 500),

    "Marketing": (100, 3000),

    "Professional Fees": (200, 5000),

    "Miscellaneous": (20, 1000)

}

# -------------------------------------------------------
# Helper Functions
# -------------------------------------------------------
def standardize_category(category: str) -> str:

    if pd.isna(category):
        return "Miscellaneous"

    category = str(category).strip()

    # Exact match first
    if category in EXCEL_CATEGORY_MAP:
        return EXCEL_CATEGORY_MAP[category]

    if category in INDIAN_CATEGORY_MAP:
        return INDIAN_CATEGORY_MAP[category]

    # Fallback: partial match
    lower = category.lower()

    for key, value in EXCEL_CATEGORY_MAP.items():
        if key.lower() in lower:
            return value

    for key, value in INDIAN_CATEGORY_MAP.items():
        if key.lower() in lower:
            return value

    return "Miscellaneous"

def generate_amount(category: str) -> float:

    minimum, maximum = CATEGORY_AMOUNT_RANGE.get(
        category,
        (20, 1000)
    )

    return round(
        random.uniform(minimum, maximum),
        2
    )


def normalize_text(text):

    if pd.isna(text):
        return ""

    return (
        str(text)
        .strip()
        .replace("\n", " ")
        .replace("\t", " ")
    )
# -------------------------------------------------------
# Excel Dataset
# -------------------------------------------------------

def load_excel_dataset() -> pd.DataFrame:

    logger.info("Loading Personal Finance Excel dataset...")

    excel_files = list(RAW_DIR.rglob("*.xlsx"))

    if not excel_files:
        raise FileNotFoundError("No Excel dataset found.")

    excel_path = excel_files[0]

    df = pd.read_excel(excel_path)

    df = df.rename(
        columns={
            "Description": "description",
            "Amount": "amount",
            "Category": "category",
            "Date": "date",
            "Transaction Type": "transaction_type",
            "Account Name": "account_name",
            "Month": "month",
        }
    )

    df["description"] = df["description"].apply(normalize_text)

    df["category"] = df["category"].apply(standardize_category)

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    df["source"] = "excel"

    logger.info(
        f"Loaded {len(df)} rows from Excel dataset."
    )

    return df


# -------------------------------------------------------
# Indian Dataset
# -------------------------------------------------------

def load_indian_dataset() -> pd.DataFrame:

    logger.info("Loading Indian Transaction Dataset...")

    csv_files = sorted(
        RAW_DIR.rglob("financial_transactions*.csv")
    )

    if len(csv_files) == 0:
        raise FileNotFoundError(
            "Indian dataset CSV files not found."
        )

    frames = []

    for file in csv_files:

        logger.info(f"Reading {file.name}")

        df = pd.read_csv(file)

        df = df.rename(
            columns={
                "Transaction_Text": "description",
                "Label": "category",
            }
        )

        df["description"] = (
            df["description"]
            .astype(str)
            .apply(normalize_text)
        )

        df["category"] = (
            df["category"]
            .astype(str)
            .apply(standardize_category)
        )

        df["amount"] = df["category"].apply(
            generate_amount
        )

        df["date"] = pd.NaT

        df["transaction_type"] = np.nan

        df["account_name"] = np.nan

        df["month"] = np.nan

        df["source"] = "indian"

        frames.append(df)

    merged = pd.concat(
        frames,
        ignore_index=True
    )

    logger.info(
        f"Loaded {len(merged)} rows from Indian dataset."
    )

    return merged


# -------------------------------------------------------
# Merge
# -------------------------------------------------------

def merge_datasets() -> pd.DataFrame:

    excel_df = load_excel_dataset()

    indian_df = load_indian_dataset()

    required_columns = [

        "description",
        "amount",
        "category",
        "date",
        "transaction_type",
        "account_name",
        "month",
        "source",

    ]

    excel_df = excel_df[required_columns]

    indian_df = indian_df[required_columns]

    merged = pd.concat(

        [excel_df, indian_df],

        ignore_index=True,

    )

    logger.info(
        f"Merged dataset contains {len(merged)} rows."
    )

    return merged
# -------------------------------------------------------
# Cleaning
# -------------------------------------------------------

def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:

    logger.info("Cleaning merged dataset...")

    before = len(df)

    df = df.drop_duplicates(
        subset=["description", "amount"]
    )

    df = df.dropna(
        subset=["description", "amount", "category"]
    )

    df["description"] = (
        df["description"]
        .astype(str)
        .str.strip()
    )

    df = df[
        df["description"].str.len() > 0
    ]

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["amount"]
    )

    after = len(df)

    logger.info(
        f"Removed {before-after} invalid rows."
    )

    return df.reset_index(drop=True)


# -------------------------------------------------------
# Validation
# -------------------------------------------------------

def validate_dataset(df: pd.DataFrame):

    logger.info("Running dataset validation...")

    assert df["description"].isna().sum() == 0
    assert df["amount"].isna().sum() == 0
    assert df["category"].isna().sum() == 0

    logger.info("Validation passed.")

    print("\nCategory Distribution\n")
    print(df["category"].value_counts())

    print("\nDataset Shape:", df.shape)


# -------------------------------------------------------
# Save Processed Dataset
# -------------------------------------------------------

def save_processed_dataset(
    df: pd.DataFrame,
    version="v1.0",
):

    PROCESSED_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    output = (
        PROCESSED_DIR
        / f"transactions_{version}.csv"
    )

    df.to_csv(
        output,
        index=False,
    )

    logger.info(
        f"Saved processed dataset to\n{output}"
    )

    return output


# -------------------------------------------------------
# Train / Validation / Test Split
# -------------------------------------------------------
def create_splits(
    df: pd.DataFrame,
    version="v1.0",
):
    logger.info("Creating dataset splits...")

    # First split: 70% train, 30% temporary
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=RANDOM_SEED,
        stratify=df["category"],
    )

    # Second split: 15% validation, 15% test.
    # Stratification is only safe when every class has enough
    # samples in the temporary set.
    temp_counts = temp_df["category"].value_counts()

    if temp_counts.min() >= 2:
        val_df, test_df = train_test_split(
            temp_df,
            test_size=0.50,
            random_state=RANDOM_SEED,
            stratify=temp_df["category"],
        )
    else:
        logger.warning(
            "Some categories have too few samples for stratified "
            "validation/test splitting. Using random split for "
            "validation/test."
        )

        val_df, test_df = train_test_split(
            temp_df,
            test_size=0.50,
            random_state=RANDOM_SEED,
            shuffle=True,
        )

    split_dir = SPLITS_DIR / version
    split_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    train_df.to_csv(
        split_dir / "train.csv",
        index=False,
    )

    val_df.to_csv(
        split_dir / "val.csv",
        index=False,
    )

    test_df.to_csv(
        split_dir / "test.csv",
        index=False,
    )

    logger.info(f"Train       : {len(train_df)}")
    logger.info(f"Validation  : {len(val_df)}")
    logger.info(f"Test        : {len(test_df)}")

    logger.info("\nTrain distribution:\n%s", train_df["category"].value_counts())
    logger.info("\nValidation distribution:\n%s", val_df["category"].value_counts())
    logger.info("\nTest distribution:\n%s", test_df["category"].value_counts())

    return train_df, val_df, test_df
# -------------------------------------------------------
# Summary
# -------------------------------------------------------

def print_summary(df):

    print("\n")
    print("=" * 60)

    print("FINAL DATASET SUMMARY")

    print("=" * 60)

    print(df.head())

    print()

    print(df.info())

    print()

    print(df.describe(include="all"))

    print("=" * 60)
if __name__ == "__main__":

    VERSION = "v1.0"

    merged = merge_datasets()

    cleaned = clean_dataset(merged)

    validate_dataset(cleaned)

    save_processed_dataset(
        cleaned,
        VERSION,
    )

    create_splits(
        cleaned,
        VERSION,
    )

    print_summary(cleaned)

    logger.info("Dataset Loader Completed Successfully.")