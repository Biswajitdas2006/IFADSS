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
    Generate SHAP explanation for the predicted class.

    Supports both:
    - Older SHAP multiclass output: list of arrays
    - Newer SHAP multiclass output: 3D numpy array
    """

    explainer = get_explainer(model)

    shap_values = explainer.shap_values(feature_row)

    # Determine predicted class
    proba = model.predict_proba(feature_row)[0]
    predicted_index = int(np.argmax(proba))

    # Convert SHAP output into a consistent numpy representation
    if isinstance(shap_values, list):
        # Older SHAP format:
        # [
        #   class_0 -> (1, n_features),
        #   class_1 -> (1, n_features),
        #   ...
        # ]
        values = np.asarray(
            shap_values[predicted_index]
        )[0]

    else:
        shap_array = np.asarray(shap_values)

        if shap_array.ndim == 3:
            # Newer SHAP format:
            # (samples, features, classes)
            values = shap_array[
                0,
                :,
                predicted_index
            ]

        elif shap_array.ndim == 2:
            # Binary/single-output style:
            # (samples, features)
            values = shap_array[0]

        elif shap_array.ndim == 1:
            values = shap_array

        else:
            raise ValueError(
                f"Unexpected SHAP output shape: {shap_array.shape}"
            )

    values = np.asarray(values).reshape(-1)

    # Feature names:
    # 384 embedding dimensions + 1 amount feature
    feature_names = [
        f"embedding_dim_{i}"
        for i in range(len(values) - 1)
    ] + ["amount"]

    # Get indices of largest absolute contributions
    top_indices = np.argsort(
        -np.abs(values)
    )[:top_n]

    return {
        "topFeatures": [
            {
                "feature": feature_names[int(i)],
                "contribution": float(values[int(i)])
            }
            for i in top_indices
        ]
    }