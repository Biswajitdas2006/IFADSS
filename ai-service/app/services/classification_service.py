from app.classification.predict import predict_transaction
 
 
def classify(description: str, amount: float) -> dict:
    return predict_transaction(description, amount)