from pydantic import BaseModel
 
 
class ForecastRequest(BaseModel):
    metricType: str
    horizonDays: int = 30
 
 
class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lowerBound: float
    upperBound: float
 
 
class ForecastResponse(BaseModel):
    forecast: list[ForecastPoint]