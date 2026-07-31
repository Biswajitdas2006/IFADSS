import pandas as pd
from prophet import Prophet
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error
 
 
def rolling_origin_backtest(history_df: pd.DataFrame, horizon_days: int = 14, folds: int = 3) -> dict:
    maes, mapes = [], []
    n = len(history_df)
    fold_size = horizon_days
 
    for i in range(folds):
        cutoff = n - (folds - i) * fold_size
        if cutoff <= 30:
            continue
        train_slice = history_df.iloc[:cutoff]
        test_slice = history_df.iloc[cutoff:cutoff + fold_size]
        if test_slice.empty:
            continue
 
        model = Prophet(changepoint_prior_scale=0.05, interval_width=0.80)
        model.fit(train_slice)
        future = model.make_future_dataframe(periods=len(test_slice))
        forecast = model.predict(future).tail(len(test_slice))
 
        maes.append(mean_absolute_error(test_slice["y"], forecast["yhat"]))
        mapes.append(mean_absolute_percentage_error(test_slice["y"], forecast["yhat"]))
 
    return {"mae": sum(maes) / len(maes) if maes else None,
            "mape": sum(mapes) / len(mapes) if mapes else None,
            "folds_evaluated": len(maes)}