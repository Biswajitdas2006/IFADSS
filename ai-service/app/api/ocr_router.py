# app/api/ocr_router.py

import os
import tempfile
import uuid
import threading
import traceback
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.services.ocr_service import run_ocr_extraction
from app.utils.logger import get_logger


router = APIRouter()

logger = get_logger("ocr-router")


# ---------------------------------------------------------
# In-memory job store
# ---------------------------------------------------------
#
# Suitable for:
# - single FastAPI process
# - single Docker container
# - draft / college project deployment
#
# Not suitable for:
# - multiple workers
# - multiple containers
# - horizontal scaling
#
_jobs: dict[str, dict] = {}

_jobs_lock = threading.Lock()


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------

def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _update_job(job_id: str, **values):
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id].update(values)


def _run_job(job_id: str, tmp_path: str):
    """
    Background OCR worker.

    This function runs outside the FastAPI request handler.
    """

    logger.info(
        "OCR background job started: job_id=%s file=%s",
        job_id,
        tmp_path,
    )

    _update_job(
        job_id,
        status="processing",
        startedAt=_utc_now(),
    )

    try:
        logger.info(
            "OCR extraction starting: job_id=%s",
            job_id,
        )

        result = run_ocr_extraction(tmp_path)

        logger.info(
            "OCR extraction completed: job_id=%s",
            job_id,
        )

        _update_job(
            job_id,
            status="completed",
            result=result,
            completedAt=_utc_now(),
        )

    except Exception as e:

        logger.exception(
            "OCR background job failed: job_id=%s",
            job_id,
        )

        _update_job(
            job_id,
            status="failed",
            error=str(e),
            traceback=traceback.format_exc(),
            completedAt=_utc_now(),
        )

    finally:

        try:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

                logger.info(
                    "Temporary OCR file removed: job_id=%s",
                    job_id,
                )

        except Exception as cleanup_error:

            logger.warning(
                "Failed to remove temporary OCR file: "
                "job_id=%s error=%s",
                job_id,
                cleanup_error,
            )


# ---------------------------------------------------------
# POST /internal/ocr/extract
# ---------------------------------------------------------

@router.post("/extract")
async def extract(
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    suffix = (
        os.path.splitext(file.filename)[1]
        or ".pdf"
    ).lower()

    allowed_extensions = {
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
    }

    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, JPG, JPEG and PNG files are supported",
        )

    logger.info(
        "OCR upload received: filename=%s",
        file.filename,
    )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty",
        )

    # 10 MB safety limit
    max_size = 10 * 1024 * 1024

    if len(contents) > max_size:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds 10 MB limit",
        )

    # -----------------------------------------------------
    # Save temporary file
    # -----------------------------------------------------

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as tmp:

        tmp.write(contents)
        tmp_path = tmp.name

    # -----------------------------------------------------
    # Create job
    # -----------------------------------------------------

    job_id = str(uuid.uuid4())

    with _jobs_lock:
        _jobs[job_id] = {
            "status": "processing",
            "createdAt": _utc_now(),
            "filename": file.filename,
        }

    logger.info(
        "OCR job created: job_id=%s",
        job_id,
    )

    # -----------------------------------------------------
    # Start background thread
    # -----------------------------------------------------

    thread = threading.Thread(
        target=_run_job,
        args=(job_id, tmp_path),
        name=f"ocr-worker-{job_id[:8]}",
        daemon=True,
    )

    thread.start()

    logger.info(
        "OCR background thread started: "
        "job_id=%s thread=%s",
        job_id,
        thread.name,
    )

    return {
        "jobId": job_id,
        "status": "processing",
    }


# ---------------------------------------------------------
# GET /internal/ocr/extract/{job_id}
# ---------------------------------------------------------

@router.get(
    "/extract/{job_id}",
    response_model=None,
)
async def get_extract_result(
    job_id: str,
):

    logger.info(
        "OCR job status requested: job_id=%s",
        job_id,
    )

    with _jobs_lock:
        job = _jobs.get(job_id)

    if job is None:

        logger.warning(
            "OCR job not found: job_id=%s",
            job_id,
        )

        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    logger.info(
        "OCR job status: job_id=%s status=%s",
        job_id,
        job.get("status"),
    )

    return job