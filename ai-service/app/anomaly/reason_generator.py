def generate_reason(feature_row: dict) -> tuple[str, str]:
    """Returns (reason_text, severity)."""

    z = feature_row.get("amount_zscore", 0)
    freq = feature_row.get("vendor_frequency", 0)
    days_gap = feature_row.get("days_since_last_same_vendor", 0)
    ratio = feature_row.get("amount_vs_median_ratio", 1)
    is_first = feature_row.get("is_first_vendor_transaction", 0)

    # Strong amount-based anomaly
    if abs(z) >= 3 or ratio >= 5:
        reason = (
            f"Amount is {ratio:.1f}x above this vendor's typical transaction"
        )
        severity = "High"

    # First chronological transaction for this vendor
    elif is_first == 1:
        reason = "First transaction recorded with this vendor"
        severity = "Medium"

    # Existing vendor but unusually long gap
    elif days_gap >= 90:
        reason = (
            f"No transaction with this vendor in the last "
            f"{int(days_gap)} days"
        )
        severity = "Medium"

    # Otherwise
    else:
        reason = "Transaction pattern deviates from historical norm"
        severity = "Low"

    return reason, severity