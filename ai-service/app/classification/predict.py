'''import numpy as np
from datetime import date
 
from app.classification import model_loader, embedding_generator
from app.xai import shap_explainer
 
 
def predict_transaction(description: str, amount: float) -> dict:
    embedding = embedding_generator.embed_texts([description])[0]
    log_amount = np.log1p(amount)
    features = np.concatenate([embedding, [log_amount]]).reshape(1, -1)
 
    model = model_loader.get_classifier()
    proba = model.predict_proba(features)[0]
    predicted_index = int(np.argmax(proba))
    category = model.classes_[predicted_index]
    confidence = float(proba[predicted_index])
 
    explanation = shap_explainer.explain(model, features)
 
    return {
        "category": str(category),
        "confidence": confidence,
        "shapExplanation": explanation,
    }
'''

import numpy as np

from app.classification import model_loader, embedding_generator
from app.xai import shap_explainer


def predict_transaction(description: str, amount: float) -> dict:
    embedding = embedding_generator.embed_texts([description])[0]

    log_amount = np.log1p(amount)

    features = np.concatenate(
        [embedding, [log_amount]]
    ).reshape(1, -1)

    model = model_loader.get_classifier()

    proba = model.predict_proba(features)[0]

    predicted_index = int(np.argmax(proba))

    predicted_label = model.predict(features)[0]

    encoder = model_loader.get_label_encoder()

    if encoder is not None:
        category = encoder.inverse_transform(
            [predicted_label]
        )[0]
    else:
        category = str(predicted_label)

    confidence = float(
        proba[predicted_index]
    )

    explanation = shap_explainer.explain(
        model,
        features
    )

    return {
        "category": str(category),
        "confidence": confidence,
        "shapExplanation": explanation,
    }