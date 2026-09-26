import os
import tempfile

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.models.ocr_schemas import OcrExtractResponse
from app.services.ocr_service import run_ocr_extraction

router = APIRouter()


@router.post("/extract", response_model=OcrExtractResponse)
async def extract(file: UploadFile = File(...)):
    contents = await file.read()

    suffix = os.path.splitext(file.filename or "")[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    try:
        return run_ocr_extraction(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"OCR extraction failed: {e}")
    finally:
        os.remove(tmp_path)