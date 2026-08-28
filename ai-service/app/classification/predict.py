import numpy as np

from app.classification import model_loader, embedding_generator
from app.classification.keyword_fallback import keyword_fallback_category
from app.xai import shap_explainer

# Your four live test cases returned 0.30-0.44 confidence when wrong.
# 0.50 is a starting cutoff -- tune once you see more real traffic.
FALLBACK_CONFIDENCE_THRESHOLD = 0.50


def predict_transaction(description: str, amount: float) -> dict:

    # Generate text embedding
    embedding = embedding_generator.embed_texts(
        [description]
    )[0]

    # Transform amount using the same transformation used during training
    log_amount = np.log1p(amount)

    # Combine embedding + amount
    features = np.concatenate(
        [embedding, [log_amount]]
    ).reshape(1, -1)

    # Load trained classifier
    model = model_loader.get_classifier()

    # Get class probabilities
    proba = model.predict_proba(features)[0]

    # Predicted encoded class index
    predicted_index = int(np.argmax(proba))

    # Get predicted model label
    predicted_label = model.predict(features)[0]

    # Convert encoded label back to category name
    encoder = model_loader.get_label_encoder()

    if encoder is not None:
        category = encoder.inverse_transform(
            [predicted_label]
        )[0]
    else:
        category = str(predicted_label)

    # Confidence of predicted class
    confidence = float(
        proba[predicted_index]
    )

    # SHAP explanation
    explanation = shap_explainer.explain(
        model,
        features
    )

    result = {
        "category": str(category),
        "confidence": confidence,
        "shapExplanation": explanation,
    }

    # --- Keyword fallback: only consulted when the ML model is
    # genuinely uncertain. Does not touch the ML pipeline above at all;
    # it only inspects the output and optionally overrides it. ---
    if confidence < FALLBACK_CONFIDENCE_THRESHOLD:
        fallback_category = keyword_fallback_category(description)

        if fallback_category is not None and fallback_category != str(category):
            result["category"] = fallback_category
            result["overriddenBy"] = "keyword_fallback"
            result["originalMlCategory"] = str(category)
            result["originalMlConfidence"] = confidence
            # A keyword match isn't a real probability -- report it as
            # unknown rather than inventing a confidence number.
            result["confidence"] = None
            result["needsReview"] = True

    return result