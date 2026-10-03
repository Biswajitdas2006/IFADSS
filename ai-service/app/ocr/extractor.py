from paddleocr import PaddleOCR
import numpy as np


_ocr_engine = None


def get_engine() -> PaddleOCR:
    global _ocr_engine

    if _ocr_engine is None:
        _ocr_engine = PaddleOCR(
            use_textline_orientation=True,
            lang="en",
            enable_mkldnn=False,
        )

    return _ocr_engine


def extract_text(image: np.ndarray) -> list[dict]:
    """
    Run PaddleOCR on one image/page.

    Returns a normalized list:

    [
        {
            "box": [[x,y], ...],
            "text": "...",
            "confidence": 0.98
        }
    ]
    """

    engine = get_engine()

    result = engine.ocr(image)

    if not result or not result[0]:
        return []

    page = result[0]

    texts = page.get("rec_texts", [])
    scores = page.get("rec_scores", [])

    boxes = page.get(
        "rec_polys",
        page.get("dt_polys", []),
    )

    parsed = []

    for index, text in enumerate(texts):

        if text is None:
            continue

        text = str(text).strip()

        if not text:
            continue

        box = None

        if index < len(boxes):
            try:
                box = boxes[index].tolist()
            except Exception:
                box = None

        confidence = None

        if index < len(scores):
            try:
                confidence = float(scores[index])
            except Exception:
                confidence = None

        parsed.append(
            {
                "box": box,
                "text": text,
                "confidence": confidence,
            }
        )

    return parsed