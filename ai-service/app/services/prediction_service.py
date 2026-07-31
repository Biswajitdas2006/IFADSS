from app.prediction.prophet_predictor import forecast
 
 
def get_forecast(metric_type: str, horizon_days: int) -> list[dict]:
    return forecast(metric_type, horizon_days)