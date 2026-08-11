def generate_reason(feature_row: dict) -> tuple[str, str]:
    """
    Generate a human-readable explanation and severity
    from Isolation Forest feature values.

    Returns:
        (reason_text, severity)
    """

    z = float(feature_row.get("amount_zscore", 0))
    freq = int(feature_row.get("vendor_frequency", 0))
    days_gap = float(feature_row.get("days_since_last_same_vendor", 0))
    ratio = float(feature_row.get("amount_vs_median_ratio", 1))
    is_first = int(feature_row.get("is_first_vendor_transaction", 0))

    # ---------------------------------------------------------
    # 1. Extremely high transaction amount
    # ---------------------------------------------------------
    if ratio >= 5 or z >= 3:
        reason = (
            f"Amount is {ratio:.1f}x above this vendor's typical transaction"
        )
        severity = "High"
        return reason, severity

    # ---------------------------------------------------------
    # 2. Extremely low transaction amount
    # ---------------------------------------------------------
    if ratio <= 0.25 or z <= -2.5:
        reason = (
            f"Amount is unusually low compared with this vendor's "
            f"typical transaction ({ratio:.1f}x of the median)"
        )
        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 3. Very high amount compared with vendor history
    # ---------------------------------------------------------
    if ratio >= 2.5 or z >= 2:
        reason = (
            f"Amount is significantly higher than this vendor's "
            f"typical transaction ({ratio:.1f}x of the median)"
        )
        severity = "High"
        return reason, severity

    # ---------------------------------------------------------
    # 4. Moderately low amount compared with vendor history
    # ---------------------------------------------------------
    if ratio <= 0.5 or z <= -1:
        reason = (
            f"Amount is lower than this vendor's typical transaction "
            f"({ratio:.1f}x of the median)"
        )
        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 5. First transaction from this vendor
    # ---------------------------------------------------------
    if is_first == 1:
        reason = "First transaction recorded with this vendor"
        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 6. Long gap since previous transaction
    # ---------------------------------------------------------
    if days_gap >= 90:
        reason = (
            f"No transaction with this vendor in the last "
            f"{int(days_gap)} days"
        )
        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 7. Moderately long gap
    # ---------------------------------------------------------
    if days_gap >= 45:
        reason = (
            f"Unusual gap of {int(days_gap)} days since the previous "
            f"transaction with this vendor"
        )
        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 8. Unusual transaction pattern
    # ---------------------------------------------------------
    if abs(z) >= 1.5:
        if z > 0:
            reason = (
                "Transaction amount is higher than the vendor's "
                "usual spending pattern"
            )
        else:
            reason = (
                "Transaction amount is lower than the vendor's "
                "usual spending pattern"
            )

        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 9. Frequent vendor but unusual transaction
    # ---------------------------------------------------------
    if freq >= 30 and (ratio >= 1.5 or ratio <= 0.6):
        reason = (
            "Transaction amount deviates from the normal pattern "
            "of a frequently used vendor"
        )
        severity = "Medium"
        return reason, severity

    # ---------------------------------------------------------
    # 10. Fallback
    # ---------------------------------------------------------
    reason = "Transaction pattern deviates from historical norm"
    severity = "Low"

    return reason, severity
