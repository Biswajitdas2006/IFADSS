def generate_reason(
    feature_row: dict,
    anomaly_score: float = 0.0
) -> tuple[str, str]:
    """
    Generate a human-readable explanation and severity
    using both transaction features and the Isolation Forest
    anomaly score.

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

    anomaly_score = float(anomaly_score)

    # ---------------------------------------------------------
    # 1. Extremely high transaction amount
    # ---------------------------------------------------------
    if ratio >= 5 or z >= 3:
        return (
            f"Amount is {ratio:.1f}x above this vendor's typical transaction",
            "High"
        )

    # ---------------------------------------------------------
    # 2. Extremely low transaction amount
    # ---------------------------------------------------------
    if ratio <= 0.25 or z <= -2.5:
        return (
            f"Amount is unusually low compared with this vendor's "
            f"typical transaction ({ratio:.1f}x of the median)",
            "Medium"
        )

    # ---------------------------------------------------------
    # 3. Significantly high amount
    # ---------------------------------------------------------
    if ratio >= 2.0 or z >= 1.5:
        return (
            f"Amount is higher than this vendor's typical transaction "
            f"({ratio:.1f}x of the median)",
            "High" if anomaly_score >= 0.75 else "Medium"
        )

    # ---------------------------------------------------------
    # 4. Significantly low amount
    # ---------------------------------------------------------
    if ratio <= 0.5 or z <= -1.0:
        return (
            f"Amount is lower than this vendor's typical transaction "
            f"({ratio:.1f}x of the median)",
            "Medium"
        )

    # ---------------------------------------------------------
    # 5. First transaction from vendor
    # ---------------------------------------------------------
    if is_first == 1:
        return (
            "First transaction recorded with this vendor",
            "Medium"
        )

    # ---------------------------------------------------------
    # 6. Long gap
    # ---------------------------------------------------------
    if days_gap >= 90:
        return (
            f"No transaction with this vendor in the last "
            f"{int(days_gap)} days",
            "Medium"
        )

    # ---------------------------------------------------------
    # 7. Moderately long gap
    # ---------------------------------------------------------
    if days_gap >= 45:
        return (
            f"Unusual gap of {int(days_gap)} days since the previous "
            f"transaction with this vendor",
            "Medium"
        )

    # ---------------------------------------------------------
    # 8. High anomaly score with no single dominant feature
    # ---------------------------------------------------------
    if anomaly_score >= 0.75:
        return (
            "Transaction pattern is significantly different "
            "from the vendor's historical behavior",
            "High"
        )

    # ---------------------------------------------------------
    # 9. Moderate anomaly score
    # ---------------------------------------------------------
    if anomaly_score >= 0.65:
        return (
            "Transaction pattern shows a moderate deviation "
            "from historical behavior",
            "Medium"
        )

    # ---------------------------------------------------------
    # 10. Mild anomaly
    # ---------------------------------------------------------
    if anomaly_score >= 0.60:
        return (
            "Transaction pattern shows a minor deviation "
            "from historical behavior",
            "Low"
        )

    # ---------------------------------------------------------
    # 11. Fallback
    # ---------------------------------------------------------
    return (
        "Transaction pattern is within the normal historical range",
        "Low"
    )
