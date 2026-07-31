from fastapi import APIRouter, HTTPException
 
from app.models.classify_schemas import ClassifyRequest, ClassifyResponse
from app.services.classification_service import classify
 
router = APIRouter()
 
 
@router.post("/transaction", response_model=ClassifyResponse)
def classify_transaction(request: ClassifyRequest):
    try:
        return classify(request.description, request.amount)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))