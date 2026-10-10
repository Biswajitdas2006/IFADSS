from typing import Optional

from pydantic import BaseModel


class HistoryPoint(BaseModel):
    date: str
    value: float


class ForecastRequest(BaseModel):
    userId: Optional[str] = None
    metricType: str
    horizonDays: int = 30
    history: list[HistoryPoint] = []


class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lowerBound: float
    upperBound: float


class ForecastResponse(BaseModel):
    forecast: list[ForecastPoint]