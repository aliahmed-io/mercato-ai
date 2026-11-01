import numpy as np
import pandas as pd
from typing import Dict, Any, List

class SeasonalNaiveForecaster:
    """
    Academically established Seasonal Naive Baseline for retail.
    Predicts unit demand by matching the same day of the week from the previous week:
    y_hat(t + h) = y(t + h - 7)
    """

    def __init__(self, season_length: int = 7):
        self.season_length = season_length
        self.history_: np.ndarray = np.array([])
        self.validation_residuals_: np.ndarray = np.array([])
        self.name = "Seasonal Naive Baseline"

    def fit(self, y_train: np.ndarray) -> "SeasonalNaiveForecaster":
        self.history_ = np.asarray(y_train, dtype=np.float64)
        if len(self.history_) > self.season_length:
            # Calculate in-sample one-step seasonal residuals
            actuals = self.history_[self.season_length:]
            preds = self.history_[:-self.season_length]
            self.validation_residuals_ = actuals - preds
        else:
            self.validation_residuals_ = np.zeros(len(self.history_))
        return self

    def predict(self, horizon: int) -> np.ndarray:
        if len(self.history_) == 0:
            return np.zeros(horizon)

        predictions = []
        recent_season = self.history_[-self.season_length:] if len(self.history_) >= self.season_length else self.history_
        for step in range(horizon):
            idx = step % len(recent_season)
            val = max(0.0, float(recent_season[idx]))
            predictions.append(val)
        return np.array(predictions)

    def predict_intervals(self, horizon: int) -> Dict[str, np.ndarray]:
        preds = self.predict(horizon)
        if len(self.validation_residuals_) > 2:
            q80_low = float(np.percentile(self.validation_residuals_, 10))
            q80_high = float(np.percentile(self.validation_residuals_, 90))
            q95_low = float(np.percentile(self.validation_residuals_, 2.5))
            q95_high = float(np.percentile(self.validation_residuals_, 97.5))
        else:
            std = float(np.std(preds)) if len(preds) > 1 else 1.0
            q80_low, q80_high = -1.28 * std, 1.28 * std
            q95_low, q95_high = -1.96 * std, 1.96 * std

        return {
            "predictions": preds,
            "lower_80": np.clip(preds + q80_low, 0, None),
            "upper_80": np.clip(preds + q80_high, 0, None),
            "lower_95": np.clip(preds + q95_low, 0, None),
            "upper_95": np.clip(preds + q95_high, 0, None),
        }
