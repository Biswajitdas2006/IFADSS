from fastapi import APIRouter, HTTPException
 
from app.models.ocr_schemas import OcrExtractRequest, OcrExtractResponse
from app.services.ocr_service import run_ocr_extraction
 
router = APIRouter()
 
 
@router.post("/extract", response_model=OcrExtractResponse)
def extract(request: OcrExtractRequest):
    try:
        return run_ocr_extraction(request.filePath)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"OCR extraction failed: {e}")