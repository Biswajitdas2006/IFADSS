import pandas as pd
import numpy as np


def build_features(transactions: pd.DataFrame):
    """
    Build statistical features for Isolation Forest.

    Required columns:
        description
        amount
        transactionDate

    Optional:
        vendor
    """

    df = transactions.copy()

    # ---------------------------------------------------------
    # Vendor
    # ---------------------------------------------------------

    if "vendor" not in df.columns:
        df["vendor"] = (
            df["description"]
            .astype(str)
            .str.split(" - ")
            .str[0]
        )

    # ---------------------------------------------------------
    # Date
    # ---------------------------------------------------------

    df["transactionDate"] = pd.to_datetime(
        df["transactionDate"]
    )

    # ---------------------------------------------------------
    # Vendor statistics
    # ---------------------------------------------------------

    vendor_stats = (
        df.groupby("vendor")["amount"]
        .agg(["mean", "std", "count"])
        .fillna(0)
    )

    df = df.join(
        vendor_stats,
        on="vendor",
        rsuffix="_vendor"
    )

    # ---------------------------------------------------------
    # Amount z-score
    # ---------------------------------------------------------

    df["amount_zscore"] = (
        (df["amount"] - df["mean"])
        / df["std"].replace(0, 1)
    )

    # Number of transactions for this vendor
    df["vendor_frequency"] = df["count"]

    # ---------------------------------------------------------
    # Sort chronologically
    # ---------------------------------------------------------

    df = df.sort_values(
        "transactionDate"
    ).copy()

    # ---------------------------------------------------------
    # Previous transaction date for same vendor
    # ---------------------------------------------------------

    previous_date = (
        df.groupby("vendor")["transactionDate"]
        .shift(1)
    )

    # Identify first transaction for vendor
    df["is_first_vendor_transaction"] = (
        previous_date.isna()
    ).astype(int)

    # Calculate days since previous transaction
    df["days_since_last_same_vendor"] = (
        df["transactionDate"] - previous_date
    ).dt.days

    # First transaction gets 0 instead of 999
    df["days_since_last_same_vendor"] = (
        df["days_since_last_same_vendor"]
        .fillna(0)
    )

    # ---------------------------------------------------------
    # Amount compared with vendor median
    # ---------------------------------------------------------

    vendor_median = (
        df.groupby("vendor")["amount"]
        .transform("median")
        .replace(0, 1)
    )

    df["amount_vs_median_ratio"] = (
        df["amount"] / vendor_median
    )

    # ---------------------------------------------------------
    # Final model features
    # ---------------------------------------------------------

    feature_cols = [
        "amount_zscore",
        "vendor_frequency",
        "days_since_last_same_vendor",
        "amount_vs_median_ratio",
        "is_first_vendor_transaction",
    ]

    features = (
        df[feature_cols]
        .replace([np.inf, -np.inf], 0)
        .fillna(0)
    )

    return features, df