from paddleocr import PaddleOCR
import numpy as np

_ocr_engine = None


def get_engine() -> PaddleOCR:
    global _ocr_engine
    if _ocr_engine is None:
        # enable_mkldnn=False works around a known PaddlePaddle 3.x bug:
        # NotImplementedError: ConvertPirAttribute2RuntimeAttribute...
        # (confirmed via PaddleOCR GitHub issues #17539, #17955, #18162 —
        # affects multiple PaddleOCR/PaddlePaddle version combinations on
        # CPU, not specific to this project's code).
        _ocr_engine = PaddleOCR(use_textline_orientation=True, lang="en", enable_mkldnn=False)
    return _ocr_engine


def extract_text(image: np.ndarray) -> list[dict]:
    engine = get_engine()
    result = engine.ocr(image)

    # PaddleOCR 3.x's output structure is fundamentally different from 2.x.
    # result is a list of one dict per input image (we pass one image, so
    # result[0] is what we want). Text, confidence, and box coordinates are
    # now separate parallel lists inside that dict, not nested tuples.
    if not result or not result[0]:
        return []

    page = result[0]
    texts = page.get("rec_texts", [])
    scores = page.get("rec_scores", [])
    boxes = page.get("rec_polys", page.get("dt_polys", []))

    parsed = []
    for i in range(len(texts)):
        parsed.append({
            "box": boxes[i].tolist() if i < len(boxes) else None,
            "text": texts[i],
            "confidence": float(scores[i]) if i < len(scores) else None,
        })
    return parsed