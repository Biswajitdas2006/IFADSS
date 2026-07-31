from paddleocr import PaddleOCR
import numpy as np

_ocr_engine = None
 
 
def get_engine() -> PaddleOCR:
    global _ocr_engine
    if _ocr_engine is None:
        _ocr_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    return _ocr_engine
 
 
def extract_text(image: np.ndarray) -> list[dict]:
    engine = get_engine()
    result = engine.ocr(image, cls=True)
    boxes = []
    for line in result[0] or []:
        box, (text, confidence) = line
        boxes.append({"box": box, "text": text, "confidence": float(confidence)})
    return boxes