def generate_reason(feature_row: dict) -> tuple[str, str]:
    """
    Generate a human-readable anomaly explanation.

    Returns:
        (reason_text, severity)
    """

    z = float(feature_row.get("amount_zscore", 0))
    freq = int(feature_row.get("vendor_frequency", 0))
    days_gap = float(
        feature_row.get("days_since_last_same_vendor", 0)
    )
    ratio = float(
        feature_row.get("amount_vs_median_ratio", 1)
    )
    is_first = int(
        feature_row.get("is_first_vendor_transaction", 0)
    )

    # --------------------------------------------------
    # 1. Strong amount anomaly
    # --------------------------------------------------
    if abs(z) >= 3:
        if z > 0:
            return (
                f"Transaction amount is unusually high "
                f"for this vendor (z-score: {z:.2f})",
                "High"
            )
        else:
            return (
                f"Transaction amount is unusually low "
                f"for this vendor (z-score: {z:.2f})",
                "Medium"
            )

    # --------------------------------------------------
    # 2. Extremely high amount compared with vendor median
    # --------------------------------------------------
    if ratio >= 5:
        return (
            f"Amount is {ratio:.1f}x above this vendor's "
            f"typical transaction",
            "High"
        )

    # --------------------------------------------------
    # 3. Extremely low amount compared with vendor median
    # --------------------------------------------------
    if ratio <= 0.25 and freq >= 2:
        return (
            f"Amount is unusually low compared with this "
            f"vendor's typical transaction ({ratio:.1f}x median)",
            "Medium"
        )

    # --------------------------------------------------
    # 4. First transaction with this vendor
    # --------------------------------------------------
    if is_first == 1:
        if freq <= 1:
            return (
                "First transaction recorded with this vendor",
                "Medium"
            )

        return (
            "First transaction observed for this vendor "
            "in the transaction history",
            "Low"
        )

    # --------------------------------------------------
    # 5. Long gap since previous transaction
    # --------------------------------------------------
    if days_gap >= 180:
        return (
            f"No transaction with this vendor in the last "
            f"{int(days_gap)} days",
            "Medium"
        )

    if days_gap >= 90:
        return (
            f"Long gap since the previous transaction "
            f"with this vendor ({int(days_gap)} days)",
            "Low"
        )

    # --------------------------------------------------
    # 6. Unusual vendor frequency
    # --------------------------------------------------
    if freq <= 2:
        return (
            "Vendor has very few transactions in the "
            "historical dataset",
            "Low"
        )

    # --------------------------------------------------
    # 7. Moderate amount deviation
    # --------------------------------------------------
    if abs(z) >= 2:
        if z > 0:
            return (
                f"Transaction amount is higher than the "
                f"vendor's normal range (z-score: {z:.2f})",
                "Medium"
            )
        else:
            return (
                f"Transaction amount is lower than the "
                f"vendor's normal range (z-score: {z:.2f})",
                "Low"
            )

    # --------------------------------------------------
    # 8. Moderate deviation from vendor median
    # --------------------------------------------------
    if ratio >= 2:
        return (
            f"Amount is {ratio:.1f}x the vendor's "
            f"typical transaction",
            "Low"
        )

    if ratio <= 0.5 and freq >= 2:
        return (
            f"Amount is only {ratio:.1f}x the vendor's "
            f"typical transaction",
            "Low"
        )

    # --------------------------------------------------
    # 9. Generic fallback
    # --------------------------------------------------
    return (
        "Transaction pattern deviates from historical norm",
        "Low"
    )