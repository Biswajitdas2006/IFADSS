'''
import numpy as np
import shap
 
_explainer = None
_explained_model_id = None
 
 
def get_explainer(model):
    global _explainer, _explained_model_id
    if _explainer is None or _explained_model_id != id(model):
        _explainer = shap.TreeExplainer(model)
        _explained_model_id = id(model)
    return _explainer
 
 
def explain(model, feature_row: np.ndarray, top_n: int = 5) -> dict:
    explainer = get_explainer(model)
    shap_values = explainer.shap_values(feature_row)
 
    # shap_values is a list (one array per class) for multi-class models;
    # take the predicted class's array for the explanation.
    predicted_index = int(np.argmax(model.predict_proba(feature_row)[0]))
    values = np.array(shap_values)[predicted_index][0] if isinstance(shap_values, list) else shap_values[0]
 
    top_indices = np.argsort(-np.abs(values))[:top_n]
    feature_names = [f"embedding_dim_{i}" for i in range(len(values) - 1)] + ["amount"]
 
    return {
        "topFeatures": [
            {"feature": feature_names[i], "contribution": float(values[i])}
            for i in top_indices
        ]
    }
'''
import numpy as np
import shap

_explainer = None
_explained_model_id = None


def get_explainer(model):
    global _explainer, _explained_model_id

    if _explainer is None or _explained_model_id != id(model):
        _explainer = shap.TreeExplainer(model)
        _explained_model_id = id(model)

    return _explainer


def explain(model, feature_row: np.ndarray, top_n: int = 5) -> dict:
    """
    Generate a SHAP explanation for the predicted class.

    Supports both:
    - Older SHAP multiclass output: list of arrays
    - Newer SHAP multiclass output: 3D numpy array
    """

    explainer = get_explainer(model)

    shap_values = explainer.shap_values(feature_row)

    # Determine predicted class index
    probabilities = model.predict_proba(feature_row)[0]
    predicted_index = int(np.argmax(probabilities))

    # ---------------------------------------------------------
    # Handle different SHAP output formats
    # ---------------------------------------------------------

    if isinstance(shap_values, list):
        # Older SHAP format:
        # [
        #   (samples, features),
        #   (samples, features),
        #   ...
        # ]
        values = np.asarray(shap_values[predicted_index])[0]

    else:
        shap_array = np.asarray(shap_values)

        if shap_array.ndim == 3:
            # Newer SHAP format for multiclass:
            # (samples, features, classes)
            values = shap_array[0, :, predicted_index]

        elif shap_array.ndim == 2:
            # Binary/single-output format:
            # (samples, features)
            values = shap_array[0]

        elif shap_array.ndim == 1:
            values = shap_array

        else:
            raise ValueError(
                f"Unexpected SHAP output shape: {shap_array.shape}"
            )

    # Make sure values are one-dimensional
    values = np.asarray(values).reshape(-1)

    # ---------------------------------------------------------
    # Feature names
    # ---------------------------------------------------------

    feature_names = [
        f"embedding_dim_{i}"
        for i in range(len(values) - 1)
    ] + ["amount"]

    # ---------------------------------------------------------
    # Select top contributing features
    # ---------------------------------------------------------

    top_indices = np.argsort(-np.abs(values))[:top_n]

    return {
        "topFeatures": [
            {
                "feature": feature_names[int(i)],
                "contribution": float(values[int(i)])
            }
            for i in top_indices
        ]
    }