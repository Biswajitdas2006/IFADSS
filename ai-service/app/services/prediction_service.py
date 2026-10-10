import pandas as pd

MIN_ACTIVE_DAYS = 3        # below this: no forecast
PROPHET_MIN_ACTIVE_DAYS = 14  # at/above this: Prophet


def _simple_forecast(df: pd.DataFrame, metric_type: str, horizon_days: int) -> list[dict]:
    mean = float(df["y"].mean())
    std = float(df["y"].std()) if len(df) > 1 else 0.0
    if pd.isna(std):
        std = 0.0
    margin = 1.28 * std  # ~80% band

    start = df["ds"].max() + pd.Timedelta(days=1)
    points = []
    for i in range(horizon_days):
        lower = mean - margin
        if metric_type in ("Revenue", "Expense"):
            lower = max(lower, 0.0)
        points.append(
            {
                "date": (start + pd.Timedelta(days=i)).strftime("%Y-%m-%d"),
                "predicted": round(mean, 2),
                "lowerBound": round(min(lower, mean), 2),
                "upperBound": round(mean + margin, 2),
            }
        )
    return points


def get_forecast(
    metric_type: str, horizon_days: int, history: list[dict] | None = None
) -> list[dict]:
    if not history:
        raise RuntimeError("No history provided for forecasting.")

    df = pd.DataFrame(history).rename(columns={"date": "ds", "value": "y"})
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)
    df = df.sort_values("ds").drop_duplicates("ds")

    active_days = int((df["y"] != 0).sum())
    if active_days < MIN_ACTIVE_DAYS:
        raise RuntimeError(
            f"Not enough history: at least {MIN_ACTIVE_DAYS} days with activity are needed."
        )

    if active_days < PROPHET_MIN_ACTIVE_DAYS:
        return _simple_forecast(df, metric_type, horizon_days)

    from prophet import Prophet

    span_days = (df["ds"].max() - df["ds"].min()).days + 1
    model = Prophet(
        interval_width=0.8,
        daily_seasonality=False,
        weekly_seasonality=span_days >= 21,
        yearly_seasonality=span_days >= 365,
    )
    model.fit(df[["ds", "y"]])

    future = model.make_future_dataframe(periods=horizon_days, freq="D")
    pred = model.predict(future)
    pred = pred[pred["ds"] > df["ds"].max()].head(horizon_days)

    points = []
    for _, r in pred.iterrows():
        yhat = float(r["yhat"])
        points.append(
            {
                "date": r["ds"].strftime("%Y-%m-%d"),
                "predicted": round(yhat, 2),
                "lowerBound": round(min(float(r["yhat_lower"]), yhat), 2),
                "upperBound": round(max(float(r["yhat_upper"]), yhat), 2),
            }
        )
    return points