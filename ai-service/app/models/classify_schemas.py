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
    confidence: float
    shapExplanation: ShapExplanation