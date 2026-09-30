# app/api/ocr_router.py
import os
import tempfile
import uuid
import threading

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.models.ocr_schemas import OcrExtractResponse
from app.services.ocr_service import run_ocr_extraction

router = APIRouter()

# In-memory job store -- fine for draft/Review-1 scope; a single-process
# deployment (which is what you have) doesn't need a real queue yet.
_jobs: dict[str, dict] = {}


def _run_job(job_id: str, tmp_path: str):
    try:
        result = run_ocr_extraction(tmp_path)
        _jobs[job_id] = {"status": "done", "result": result}
    except Exception as e:
        _jobs[job_id] = {"status": "failed", "error": str(e)}
    finally:
        os.remove(tmp_path)


@router.post("/extract")
async def extract(file: UploadFile = File(...)):
    contents = await file.read()
    suffix = os.path.splitext(file.filename or "")[1] or ".pdf"

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(contents)
        tmp_path = tmp.name

    job_id = str(uuid.uuid4())
    _jobs[job_id] = {"status": "processing"}

    thread = threading.Thread(target=_run_job, args=(job_id, tmp_path))
    thread.start()

    return {"jobId": job_id, "status": "processing"}


@router.get("/extract/{job_id}", response_model=None)
async def get_extract_result(job_id: str):
    job = _jobs.get(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job