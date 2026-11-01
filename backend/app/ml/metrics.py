import numpy as np
from typing import Dict, Union

def calculate_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Mean Absolute Error"""
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    if len(y_true) == 0:
        return 0.0
    return float(np.mean(np.abs(y_true - y_pred)))

def calculate_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Root Mean Squared Error"""
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    if len(y_true) == 0:
        return 0.0
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

def calculate_wape(y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1e-6) -> float:
    """
    Weighted Absolute Percentage Error (WAPE).
    Academically preferred for intermittent demand over MAPE which divides by zero.
    WAPE = sum(|y - y_hat|) / max(sum(y), epsilon)
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    if len(y_true) == 0:
        return 0.0
    total_actual = float(np.sum(np.abs(y_true)))
    total_abs_error = float(np.sum(np.abs(y_true - y_pred)))
    if total_actual < epsilon:
        # If all ground truth demand is 0, return 0 if predictions are 0, else 1.0 (100% error)
        return float(min(1.0, total_abs_error / epsilon))
    return float(total_abs_error / total_actual)

def calculate_bias(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """
    Forecast Bias (Mean Forecast Error = mean(y_pred - y_true)).
    Positive bias indicates over-forecasting (holding excess stock risk).
    Negative bias indicates under-forecasting (stockout risk).
    """
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    if len(y_true) == 0:
        return 0.0
    return float(np.mean(y_pred - y_true))

def calculate_bias_pct(y_true: np.ndarray, y_pred: np.ndarray, epsilon: float = 1e-6) -> float:
    """Percentage forecast bias relative to total volume."""
    y_true = np.asarray(y_true, dtype=np.float64)
    y_pred = np.asarray(y_pred, dtype=np.float64)
    if len(y_true) == 0:
        return 0.0
    total_actual = float(np.sum(np.abs(y_true)))
    total_diff = float(np.sum(y_pred - y_true))
    if total_actual < epsilon:
        return 0.0
    return float((total_diff / total_actual) * 100.0)

def evaluate_all_metrics(y_true: np.ndarray, y_pred: np.ndarray, baseline_mae: Union[float, None] = None) -> Dict[str, float]:
    """Compute all standard evaluation metrics in one call with safe clipping."""
    # Forecasts cannot be negative for physical retail units
    y_pred_clipped = np.clip(np.asarray(y_pred, dtype=np.float64), 0, None)
    y_true = np.asarray(y_true, dtype=np.float64)

    mae = calculate_mae(y_true, y_pred_clipped)
    rmse = calculate_rmse(y_true, y_pred_clipped)
    wape = calculate_wape(y_true, y_pred_clipped)
    bias = calculate_bias(y_true, y_pred_clipped)
    bias_pct = calculate_bias_pct(y_true, y_pred_clipped)

    lift_pct = 0.0
    if baseline_mae is not None and baseline_mae > 1e-6:
        # Lift vs baseline = (baseline_mae - model_mae) / baseline_mae * 100
        lift_pct = float(max(-100.0, min(100.0, ((baseline_mae - mae) / baseline_mae) * 100.0)))

    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "wape": round(wape, 4),
        "wape_pct": round(wape * 100.0, 2),
        "bias": round(bias, 3),
        "bias_pct": round(bias_pct, 2),
        "lift_vs_baseline_pct": round(lift_pct, 2)
    }
