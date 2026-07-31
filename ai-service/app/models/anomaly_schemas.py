from pydantic import BaseModel
 
 
class Transaction(BaseModel):
    id: str
    description: str
    amount: float
    transactionDate: str
 
 
class AnomalyScanRequest(BaseModel):
    transactions: list[Transaction]
 
 
class AnomalyResult(BaseModel):
    transactionId: str
    anomalyScore: float
    reason: str
    severity: str
 
 
class AnomalyScanResponse(BaseModel):
    anomalies: list[AnomalyResult]