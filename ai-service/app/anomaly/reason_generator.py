def generate_reason(feature_row: dict) -> tuple[str, str]:
    """Generate a human-readable reason and severity for an anomaly."""

    z = float(feature_row.get("amount_zscore", 0))
    freq = int(feature_row.get("vendor_frequency", 0))
    days_gap = float(feature_row.get("days_since_last_same_vendor", 0))
    ratio = float(feature_row.get("amount_vs_median_ratio", 1))
    is_first = int(feature_row.get("is_first_vendor_transaction", 0))

    # 1. Strong amount-based anomaly
    if abs(z) >= 3 or ratio >= 5:
        reason = (
            f"Amount is {ratio:.1f}x above this vendor's typical transaction"
        )
        severity = "High"

    # 2. First transaction with this vendor
    elif is_first == 1:
        reason = "First transaction recorded with this vendor"
        severity = "Medium"

    # 3. Long gap since previous transaction
    elif days_gap >= 90:
        reason = (
            f"No transaction with this vendor in the last "
            f"{int(days_gap)} days"
        )
        severity = "Medium"

    # 4. Otherwise
    else:
        reason = "Transaction pattern deviates from historical norm"
        severity = "Low"

    return reason, severity