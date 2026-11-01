import pytest
import numpy as np
import pandas as pd
from backend.app.ml.models.baseline import SeasonalNaiveForecaster
from backend.app.ml.models.random_forest import RandomForestForecaster
from backend.app.ml.models.gradient_boosting import HistGradientBoostingForecaster
from backend.app.ml.features import TimeSeriesFeatureEngineer

@pytest.fixture
def sample_sales_series() -> pd.DataFrame:
    """Creates 60 days of synthetic continuous daily retail sales."""
    dates = pd.date_range("2025-01-01", periods=60, freq="D")
    np.random.seed(42)
    # Seasonal weekly pattern + slight noise
    base = np.array([20, 22, 25, 28, 45, 60, 30])  # Mon-Sun
    quantities = []
    for i in range(60):
        dow = dates[i].day_of_week
        quantities.append(max(0.0, float(base[dow] + np.random.normal(0, 3))))
    
    return pd.DataFrame({
        "date": dates,
        "sku": "TEST-SKU-001",
        "quantity": quantities
    })

def test_seasonal_naive_forecaster(sample_sales_series):
    forecaster = SeasonalNaiveForecaster(season_length=7)
    y_train = sample_sales_series["quantity"].values
    forecaster.fit(y_train)

    forecast_7 = forecaster.predict(horizon=7)
    assert len(forecast_7) == 7
    # All forecasted unit demand values must be non-negative
    assert np.all(forecast_7 >= 0.0)

    # Seasonal naive should repeat the last 7 days of training
    last_7 = y_train[-7:]
    np.testing.assert_allclose(forecast_7, last_7)

    intervals = forecaster.predict_intervals(horizon=7)
    assert "lower_80" in intervals
    assert "upper_80" in intervals
    assert np.all(intervals["lower_80"] <= intervals["predictions"])
    assert np.all(intervals["upper_80"] >= intervals["predictions"])

def test_feature_engineering_no_future_leakage(sample_sales_series):
    df_features = TimeSeriesFeatureEngineer.create_features(sample_sales_series, target_col="quantity")
    
    # Check that lag_1 is strictly the previous day's quantity
    # Index 1's lag_1 must match index 0's quantity
    assert df_features.loc[1, "lag_1"] == sample_sales_series.loc[0, "quantity"]
    
    # For rolling stats at index t, ensure changing quantity at index t does NOT change rolling_mean at index t
    modified_series = sample_sales_series.copy()
    original_mean_t10 = df_features.loc[10, "rolling_mean_7"]
    
    # Modify current day t=10
    modified_series.loc[10, "quantity"] = 999999.0
    modified_features = TimeSeriesFeatureEngineer.create_features(modified_series, target_col="quantity")
    
    # rolling_mean_7 at index 10 must NOT change because it uses shift(1)
    assert modified_features.loc[10, "rolling_mean_7"] == original_mean_t10

def test_random_forest_recursive_forecasting(sample_sales_series):
    features_df = TimeSeriesFeatureEngineer.create_features(sample_sales_series)
    train_df = features_df.dropna().reset_index(drop=True)
    
    rf = RandomForestForecaster(n_estimators=30, max_depth=5, random_state=42)
    feature_cols = TimeSeriesFeatureEngineer.get_feature_column_names()
    
    X = train_df[feature_cols]
    y = train_df["quantity"]
    rf.fit(X, y)
    
    assert len(rf.feature_importances_) > 0
    # Feature importances sum approximately to 1
    total_imp = sum(rf.feature_importances_.values())
    assert 0.95 <= total_imp <= 1.05

    horizon = 7
    results = rf.forecast_recursive(sample_sales_series, horizon=horizon, sku="TEST-SKU-001")
    
    assert len(results["predictions"]) == horizon
    assert np.all(results["predictions"] >= 0.0)
    assert np.all(results["lower_80"] <= results["predictions"])
    assert np.all(results["upper_80"] >= results["predictions"])

def test_gradient_boosting_forecaster(sample_sales_series):
    features_df = TimeSeriesFeatureEngineer.create_features(sample_sales_series)
    train_df = features_df.dropna().reset_index(drop=True)
    
    hgb = HistGradientBoostingForecaster(max_iter=30, max_depth=4, random_state=42)
    feature_cols = TimeSeriesFeatureEngineer.get_feature_column_names()
    
    X = train_df[feature_cols]
    y = train_df["quantity"]
    hgb.fit(X, y)

    horizon = 7
    results = hgb.forecast_recursive(sample_sales_series, horizon=horizon, sku="TEST-SKU-001")
    assert len(results["predictions"]) == horizon
    assert np.all(results["predictions"] >= 0.0)
