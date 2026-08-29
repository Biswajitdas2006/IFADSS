from typing import Optional
from pydantic import BaseModel


class ClassifyRequest(BaseModel):
    description: str
    amount: float


class ShapFeature(BaseModel):
    feature: str
    contribution: float


class ShapExplanation(BaseModel):
    topFeatures: list[ShapFeature]


class ClassifyResponse(BaseModel):
    category: str
    confidence: Optional[float] = None
    shapExplanation: ShapExplanation

    # Populated only when the keyword fallback overrides a
    # low-confidence ML prediction (see predict.py /
    # keyword_fallback.py). All default to "no override happened"
    # so this is backward compatible with any existing caller that
    # doesn't yet know about these fields.
    overriddenBy: Optional[str] = None
    originalMlCategory: Optional[str] = None
    originalMlConfidence: Optional[float] = None
    needsReview: bool = False