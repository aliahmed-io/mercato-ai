import numpy as np
import pytest
from backend.app.ml.metrics import (
    calculate_mae,
    calculate_rmse,
    calculate_wape,
    calculate_bias,
    evaluate_all_metrics
)

def test_mae_calculation():
    y_true = np.array([10.0, 20.0, 30.0])
    y_pred = np.array([12.0, 18.0, 33.0])
    # |10-12| + |20-18| + |30-33| = 2 + 2 + 3 = 7 / 3 = 2.3333...
    assert round(calculate_mae(y_true, y_pred), 3) == 2.333

def test_rmse_calculation():
    y_true = np.array([10.0, 20.0, 30.0])
    y_pred = np.array([10.0, 20.0, 30.0])
    assert calculate_rmse(y_true, y_pred) == 0.0

def test_wape_normal():
    y_true = np.array([10.0, 20.0, 30.0])
    y_pred = np.array([12.0, 18.0, 33.0])
    # sum(|e|) = 7, sum(y) = 60 => 7 / 60 = 0.11666...
    assert round(calculate_wape(y_true, y_pred), 4) == 0.1167

def test_wape_zero_denominator_safety():
    """Ensure zero sales does not raise ZeroDivisionError."""
    y_true = np.array([0.0, 0.0, 0.0])
    y_pred = np.array([0.0, 0.0, 0.0])
    assert calculate_wape(y_true, y_pred) == 0.0

def test_bias_positive_overforecast():
    y_true = np.array([10.0, 10.0, 10.0])
    y_pred = np.array([15.0, 12.0, 13.0])
    # mean(pred - true) = ((15-10) + (12-10) + (13-10)) / 3 = (5 + 2 + 3) / 3 = 3.333
    assert round(calculate_bias(y_true, y_pred), 3) == 3.333

def test_evaluate_all_metrics():
    y_true = np.array([10.0, 20.0, 15.0, 25.0])
    y_pred = np.array([12.0, 18.0, 16.0, 24.0])
    res = evaluate_all_metrics(y_true, y_pred, baseline_mae=3.0)
    assert "mae" in res
    assert "rmse" in res
    assert "wape" in res
    assert "bias" in res
    assert "lift_vs_baseline_pct" in res
    assert res["lift_vs_baseline_pct"] > 0
