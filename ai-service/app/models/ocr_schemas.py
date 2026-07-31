from typing import Optional
from pydantic import BaseModel
 
 
class OcrExtractRequest(BaseModel):
    filePath: str
 
 
class LineItem(BaseModel):
    description: str
    amount: float
 
 
class OcrExtractResponse(BaseModel):
    vendorName: Optional[str] = None
    invoiceDate: Optional[str] = None
    totalAmount: Optional[float] = None
    taxAmount: Optional[float] = None
    lineItems: list[LineItem] = []