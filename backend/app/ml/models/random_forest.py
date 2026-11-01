import numpy as np
import pandas as pd
from typing import Dict, List, Optional
from sklearn.ensemble import RandomForestRegressor
from backend.app.ml.features import TimeSeriesFeatureEngineer

class RandomForestForecaster:
    """
    Random Forest Regressor with recursive multi-step forecasting and
    empirical quantile prediction intervals.
    """

    def __init__(self, n_estimators: int = 100, max_depth: int = 10, random_state: int = 42):
        self.model = RandomForestRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            min_samples_leaf=2,
            random_state=random_state,
            n_jobs=-1
        )
        self.feature_cols: List[str] = TimeSeriesFeatureEngineer.get_feature_column_names()
        self.feature_importances_: Dict[str, float] = {}
        self.validation_residuals_: np.ndarray = np.array([])
        self.name = "Random Forest Regressor"

    def fit(self, X_train: pd.DataFrame, y_train: pd.Series, X_val: Optional[pd.DataFrame] = None, y_val: Optional[pd.Series] = None) -> "RandomForestForecaster":
        X = X_train[self.feature_cols].fillna(0.0)
        y = np.asarray(y_train, dtype=np.float64)

        self.model.fit(X, y)

        # Record feature importance
        importances = self.model.feature_importances_
        self.feature_importances_ = {
            col: round(float(imp), 4)
            for col, imp in sorted(zip(self.feature_cols, importances), key=lambda x: x[1], reverse=True)
        }

        # Calculate validation residuals for empirical prediction intervals
        if X_val is not None and y_val is not None and len(X_val) > 0:
            val_preds = self.model.predict(X_val[self.feature_cols].fillna(0.0))
            self.validation_residuals_ = np.asarray(y_val, dtype=np.float64) - val_preds
        else:
            # Fall back to training out-of-bag/sample residuals
            train_preds = self.model.predict(X)
            self.validation_residuals_ = y - train_preds

        return self

    def forecast_recursive(self, df_history: pd.DataFrame, horizon: int, sku: str) -> Dict[str, np.ndarray]:
        """
        Performs multi-step recursive forecasting without future leakage.
        Iteratively rolls forward one day at a time, calculating features dynamically.
        """
        # Ensure df_history has 'date', 'sku', 'quantity'
        history = df_history[df_history["sku"] == sku][["date", "sku", "quantity"]].copy()
        history["date"] = pd.to_datetime(history["date"])
        history = history.sort_values("date").reset_index(drop=True)

        predictions: List[float] = []
        future_dates: List[pd.Timestamp] = []
        last_date = history["date"].max()

        simulated_history = history.copy()

        for step in range(1, horizon + 1):
            next_date = last_date + pd.Timedelta(days=step)
            future_dates.append(next_date)

            # Re-generate features with simulated history so far
            df_feats = TimeSeriesFeatureEngineer.create_features(simulated_history, target_col="quantity")
            last_feat_row = df_feats.iloc[-1:][self.feature_cols].fillna(0.0)

            # Predict next step
            pred_val = float(self.model.predict(last_feat_row)[0])
            pred_val = max(0.0, round(pred_val, 2))
            predictions.append(pred_val)

            # Append prediction to simulated history for the next step's autoregressive lags
            new_row = pd.DataFrame([{
                "date": next_date,
                "sku": sku,
                "quantity": pred_val
            }])
            simulated_history = pd.concat([simulated_history, new_row], ignore_index=True)

        preds_arr = np.array(predictions)

        # Compute academically sound empirical prediction intervals
        if len(self.validation_residuals_) >= 5:
            q80_low = float(np.percentile(self.validation_residuals_, 10))
            q80_high = float(np.percentile(self.validation_residuals_, 90))
            q95_low = float(np.percentile(self.validation_residuals_, 2.5))
            q95_high = float(np.percentile(self.validation_residuals_, 97.5))
        else:
            std = float(np.std(preds_arr)) if len(preds_arr) > 1 else 1.0
            q80_low, q80_high = -1.28 * std, 1.28 * std
            q95_low, q95_high = -1.96 * std, 1.96 * std

        return {
            "dates": future_dates,
            "predictions": preds_arr,
            "lower_80": np.clip(preds_arr + q80_low, 0, None),
            "upper_80": np.clip(preds_arr + q80_high, 0, None),
            "lower_95": np.clip(preds_arr + q95_low, 0, None),
            "upper_95": np.clip(preds_arr + q95_high, 0, None),
        }
