from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.api import ocr_router, classify_router, anomaly_router, prediction_router
from app.classification import model_loader
from app.anomaly import predict_isolation_forest as isolation_forest_loader
from app.prediction import prophet_predictor
from app.utils.config import settings
from app.utils.logger import get_logger
 
logger = get_logger("ai-service")
 
app = FastAPI(title="IFADSS AI Service", version="1.0.0")
 
origins = [o.strip() for o in settings.cors_allowed_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
app.include_router(ocr_router.router, prefix="/internal/ocr", tags=["OCR"])
app.include_router(classify_router.router, prefix="/internal/classify", tags=["Classification"])
app.include_router(anomaly_router.router, prefix="/internal/anomaly", tags=["Anomaly"])
app.include_router(prediction_router.router, prefix="/internal/prediction", tags=["Prediction"])
 
 
@app.on_event("startup")
def preload_models():
    logger.info("Preloading models at startup...")
    try:
        model_loader.load_classifier()
        logger.info("Classifier loaded: %s", model_loader.get_active_version())
    except Exception as e:
        logger.warning("Classifier not loaded yet: %s", e)
    try:
        isolation_forest_loader.load_model()
        logger.info("Isolation Forest loaded.")
    except Exception as e:
        logger.warning("Isolation Forest not loaded yet: %s", e)
    try:
        prophet_predictor.load_all_models()
        logger.info("Prophet models loaded.")
    except Exception as e:
        logger.warning("Prophet models not loaded yet: %s", e)
 
 
@app.get("/health")
def health():
    return {"status": "ok", "service": "IFADSS AI Service"}