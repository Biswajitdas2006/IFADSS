from datetime import date, timedelta

from app.prediction.prophet_predictor import forecast


def get_forecast(metric_type: str, horizon_days: int) -> list[dict]:
    points = forecast(metric_type, horizon_days)
    if not points:
        return points

    # Prophet continues dates from its training data's last date, not
    # from "today" -- shift the whole forecast to start tomorrow,
    # preserving the relative trend/seasonality shape without
    # retraining anything.
    start = date.today() + timedelta(days=1)
    for i, point in enumerate(points):
        point["date"] = (start + timedelta(days=i)).isoformat()

    return points