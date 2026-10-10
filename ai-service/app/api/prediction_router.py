from fastapi import APIRouter, HTTPException

from app.models.prediction_schemas import ForecastRequest, ForecastResponse
from app.services.prediction_service import get_forecast

router = APIRouter()


@router.post("/forecast", response_model=ForecastResponse)
def forecast_endpoint(request: ForecastRequest):
    try:
        history = [h.model_dump() for h in request.history]
        points = get_forecast(request.metricType, request.horizonDays, history)
        return {"forecast": points}
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Forecast failed: {e}")