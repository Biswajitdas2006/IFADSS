from fastapi import APIRouter, HTTPException
 
from app.models.anomaly_schemas import AnomalyScanRequest, AnomalyScanResponse
from app.services.anomaly_service import scan_transactions
 
router = APIRouter()
 
 
@router.post("/scan", response_model=AnomalyScanResponse)
def scan(request: AnomalyScanRequest):
    try:
        transactions = [t.model_dump() for t in request.transactions]
        anomalies = scan_transactions(transactions)
        return {"anomalies": anomalies}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))