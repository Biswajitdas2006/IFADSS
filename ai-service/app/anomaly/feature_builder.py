import pandas as pd
import numpy as np
 
 
def build_features(transactions: pd.DataFrame) -> pd.DataFrame:
    """transactions must have columns: description, amount, transactionDate, vendor (optional).
    If 'vendor' isn't present, it is derived as the text before the first ' - ' in description."""
    df = transactions.copy()
    if "vendor" not in df.columns:
        df["vendor"] = df["description"].str.split(" - ").str[0]
    df["transactionDate"] = pd.to_datetime(df["transactionDate"])
 
    vendor_stats = df.groupby("vendor")["amount"].agg(["mean", "std", "count"]).fillna(0)
    df = df.join(vendor_stats, on="vendor", rsuffix="_vendor")
 
    df["amount_zscore"] = (df["amount"] - df["mean"]) / df["std"].replace(0, 1)
    df["vendor_frequency"] = df["count"]
 
    df = df.sort_values("transactionDate")
    df["days_since_last_same_vendor"] = (
        df.groupby("vendor")["transactionDate"].diff().dt.days.fillna(999)
    )
 
    category_median = df.groupby("vendor")["amount"].transform("median").replace(0, 1)
    df["amount_vs_median_ratio"] = df["amount"] / category_median
 
    feature_cols = [
        "amount_zscore", "vendor_frequency", "days_since_last_same_vendor", "amount_vs_median_ratio",
    ]
    return df[feature_cols].fillna(0), df