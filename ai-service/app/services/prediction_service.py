import pandas as pd

MIN_ACTIVE_DAYS = 14


def get_forecast(
    metric_type: str, horizon_days: int, history: list[dict] | None = None
) -> list[dict]:
    from prophet import Prophet

    if not history:
        raise RuntimeError("No history provided for forecasting.")

    df = pd.DataFrame(history).rename(columns={"date": "ds", "value": "y"})
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = df["y"].astype(float)
    df = df.sort_values("ds").drop_duplicates("ds")

    if int((df["y"] != 0).sum()) < MIN_ACTIVE_DAYS:
        raise RuntimeError(
            f"Not enough history: at least {MIN_ACTIVE_DAYS} days with activity are needed."
        )

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