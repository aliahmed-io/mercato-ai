import pandas as pd
import numpy as np
from typing import Dict, List, Any
from backend.app.ml.features import TimeSeriesFeatureEngineer
from backend.app.ml.models.baseline import SeasonalNaiveForecaster
from backend.app.ml.models.random_forest import RandomForestForecaster
from backend.app.ml.models.gradient_boosting import HistGradientBoostingForecaster
from backend.app.ml.metrics import evaluate_all_metrics

class RollingOriginBacktester:
    """
    Performs expanding-window (rolling-origin) walk-forward validation across multiple splits.
    Simulates real-world sequential deployment where future data is strictly unobserved.
    """

    def __init__(self, horizon_days: int = 7, n_splits: int = 3):
        self.horizon_days = horizon_days
        self.n_splits = n_splits

    def run_backtest(self, df_daily: pd.DataFrame, sku: str) -> Dict[str, Any]:
        """
        Runs walk-forward backtest comparing Seasonal Naive, Random Forest, and HistGradientBoosting.
        Returns fold-by-fold results and aggregate performance metrics.
        """
        sku_df = df_daily[df_daily["sku"] == sku].sort_values("date").reset_index(drop=True)
        if len(sku_df) < 60:
            return {"error": "Insufficient history for backtesting (minimum 60 days required)."}

        # Generate full features
        df_feats = TimeSeriesFeatureEngineer.create_features(sku_df, target_col="quantity")
        feature_cols = TimeSeriesFeatureEngineer.get_feature_column_names()
        df_valid = df_feats.dropna(subset=feature_cols).reset_index(drop=True)

        total_rows = len(df_valid)
        if total_rows < 35:
            return {"error": "Insufficient feature rows after lag generation."}

        models_to_test = ["seasonal_naive", "random_forest", "hist_gradient_boosting"]
        fold_results: List[Dict[str, Any]] = []
        model_scores: Dict[str, List[Dict[str, float]]] = {m: [] for m in models_to_test}

        # Calculate cutoff origins
        # Origin 0 is total_rows - n_splits * horizon_days
        step_size = self.horizon_days
        for split_idx in range(self.n_splits):
            test_end_idx = total_rows - (self.n_splits - 1 - split_idx) * step_size
            test_start_idx = test_end_idx - step_size
            train_end_idx = test_start_idx

            train_df = df_valid.iloc[:train_end_idx]
            test_df = df_valid.iloc[test_start_idx:test_end_idx]

            y_test_true = test_df["quantity"].values
            test_dates = [d.strftime("%Y-%m-%d") for d in test_df["date"]]
            origin_date = train_df["date"].iloc[-1].strftime("%Y-%m-%d")

            fold_info: Dict[str, Any] = {
                "fold": split_idx + 1,
                "origin_date": origin_date,
                "test_start_date": test_dates[0] if test_dates else "",
                "test_end_date": test_dates[-1] if test_dates else "",
                "actuals": [round(float(v), 2) for v in y_test_true],
                "predictions": {}
            }

            # 1. Seasonal Naive
            naive = SeasonalNaiveForecaster()
            naive.fit(train_df["quantity"].values)
            y_pred_naive = naive.predict(len(y_test_true))
            metrics_naive = evaluate_all_metrics(y_test_true, y_pred_naive)
            model_scores["seasonal_naive"].append(metrics_naive)
            fold_info["predictions"]["seasonal_naive"] = [round(float(v), 2) for v in y_pred_naive]

            # 2. Random Forest
            rf = RandomForestForecaster(n_estimators=60, max_depth=8)
            rf.fit(train_df, train_df["quantity"])
            rf_res = rf.forecast_recursive(train_df, horizon=len(y_test_true), sku=sku)
            y_pred_rf = rf_res["predictions"]
            metrics_rf = evaluate_all_metrics(y_test_true, y_pred_rf, baseline_mae=metrics_naive["mae"])
            model_scores["random_forest"].append(metrics_rf)
            fold_info["predictions"]["random_forest"] = [round(float(v), 2) for v in y_pred_rf]

            # 3. HistGradientBoosting
            hgb = HistGradientBoostingForecaster(max_iter=80, max_depth=6)
            hgb.fit(train_df, train_df["quantity"])
            hgb_res = hgb.forecast_recursive(train_df, horizon=len(y_test_true), sku=sku)
            y_pred_hgb = hgb_res["predictions"]
            metrics_hgb = evaluate_all_metrics(y_test_true, y_pred_hgb, baseline_mae=metrics_naive["mae"])
            model_scores["hist_gradient_boosting"].append(metrics_hgb)
            fold_info["predictions"]["hist_gradient_boosting"] = [round(float(v), 2) for v in y_pred_hgb]

            fold_results.append(fold_info)

        # Compute aggregate averages
        summary: Dict[str, Any] = {}
        for m in models_to_test:
            scores = model_scores[m]
            summary[m] = {
                "mean_mae": round(float(np.mean([s["mae"] for s in scores])), 3),
                "mean_rmse": round(float(np.mean([s["rmse"] for s in scores])), 3),
                "mean_wape_pct": round(float(np.mean([s["wape_pct"] for s in scores])), 2),
                "mean_bias": round(float(np.mean([s["bias"] for s in scores])), 3),
                "mean_lift_pct": round(float(np.mean([s["lift_vs_baseline_pct"] for s in scores])), 2)
            }

        return {
            "sku": sku,
            "horizon_days": self.horizon_days,
            "n_splits": self.n_splits,
            "summary": summary,
            "folds": fold_results
        }
