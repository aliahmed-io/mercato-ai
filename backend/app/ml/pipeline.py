import json
import pandas as pd
import numpy as np
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.db.models import Product, DailySales, ForecastRun, ForecastPoint, ModelBenchmark, utc_now
from backend.app.ml.features import TimeSeriesFeatureEngineer
from backend.app.ml.models.baseline import SeasonalNaiveForecaster
from backend.app.ml.models.random_forest import RandomForestForecaster
from backend.app.ml.models.gradient_boosting import HistGradientBoostingForecaster
from backend.app.ml.metrics import evaluate_all_metrics

class ForecastingPipeline:
    """
    Orchestrates data preparation, feature engineering, chronological model training,
    evaluation against holdout sets, recursive future forecasting, and database persistence.
    """

    SUPPORTED_MODELS = ["seasonal_naive", "random_forest", "hist_gradient_boosting"]

    def __init__(self, db: Session):
        self.db = db

    def get_sku_daily_series(self, sku: str) -> pd.DataFrame:
        """Loads daily sales records from DB for the specified SKU."""
        records = (
            self.db.query(DailySales)
            .filter(DailySales.sku == sku)
            .order_by(DailySales.date.asc())
            .all()
        )
        if not records:
            return pd.DataFrame()

        data = [{
            "date": r.date,
            "sku": r.sku,
            "quantity": float(r.quantity_sold),
            "revenue": float(r.revenue),
            "order_count": int(r.order_count)
        } for r in records]

        df = pd.DataFrame(data)
        df["date"] = pd.to_datetime(df["date"])

        # Regularize continuous daily series
        min_date = df["date"].min()
        max_date = df["date"].max()
        full_idx = pd.date_range(min_date, max_date, freq="D", name="date")
        df = df.set_index("date").reindex(full_idx)
        df["sku"] = sku
        df["quantity"] = df["quantity"].fillna(0.0)
        df["revenue"] = df["revenue"].fillna(0.0)
        df["order_count"] = df["order_count"].fillna(0).astype(int)
        return df.reset_index()

    def run_pipeline(
        self,
        sku: str,
        model_name: str = "hist_gradient_boosting",
        horizon_days: int = 7
    ) -> Dict[str, Any]:
        """
        Executes end-to-end forecasting pipeline for a single SKU.
        """
        if model_name not in self.SUPPORTED_MODELS:
            raise ValueError(f"Unsupported model: {model_name}. Allowed: {self.SUPPORTED_MODELS}")

        df_daily = self.get_sku_daily_series(sku)
        if len(df_daily) < 30:
            raise ValueError(f"Insufficient historical data for SKU {sku}. Minimum 30 daily observations required.")

        # 1. Feature Engineering (Strictly lagged)
        df_features = TimeSeriesFeatureEngineer.create_features(df_daily, target_col="quantity")
        train_df, val_df, test_df = TimeSeriesFeatureEngineer.prepare_train_test_split(
            df_features, horizon_days=horizon_days, val_days=14, target_col="quantity"
        )

        if len(train_df) < 15:
            # Fallback to train on all available if series is shorter
            train_df = df_features.dropna(subset=TimeSeriesFeatureEngineer.get_feature_column_names())
            val_df = pd.DataFrame()
            test_df = pd.DataFrame()

        # 2. Evaluate Baseline
        baseline = SeasonalNaiveForecaster(season_length=7)
        baseline.fit(train_df["quantity"].values)
        baseline_mae = None

        if not test_df.empty:
            y_test_true = test_df["quantity"].values
            baseline_preds = baseline.predict(len(y_test_true))
            baseline_metrics = evaluate_all_metrics(y_test_true, baseline_preds)
            baseline_mae = baseline_metrics["mae"]

        # 3. Train Selected Model
        feature_importance_dict = {}
        if model_name == "seasonal_naive":
            model = baseline
            if not test_df.empty:
                eval_metrics = baseline_metrics
            else:
                eval_metrics = {"mae": 0.0, "rmse": 0.0, "wape": 0.0, "bias": 0.0, "lift_vs_baseline_pct": 0.0}

            forecast_res = model.predict_intervals(horizon_days)
            future_dates = [
                (df_daily["date"].max() + pd.Timedelta(days=i + 1)).date()
                for i in range(horizon_days)
            ]
            forecast_output = {
                "dates": future_dates,
                "predictions": forecast_res["predictions"],
                "lower_80": forecast_res["lower_80"],
                "upper_80": forecast_res["upper_80"],
                "lower_95": forecast_res["lower_95"],
                "upper_95": forecast_res["upper_95"],
            }

        elif model_name == "random_forest":
            rf = RandomForestForecaster(n_estimators=100, max_depth=10)
            rf.fit(train_df, train_df["quantity"], val_df, val_df["quantity"] if not val_df.empty else None)
            feature_importance_dict = rf.feature_importances_

            if not test_df.empty:
                test_res = rf.forecast_recursive(train_df, horizon=len(test_df), sku=sku)
                eval_metrics = evaluate_all_metrics(test_df["quantity"].values, test_res["predictions"], baseline_mae=baseline_mae)
            else:
                eval_metrics = {"mae": 0.0, "rmse": 0.0, "wape": 0.0, "bias": 0.0, "lift_vs_baseline_pct": 0.0}

            # Future forecast beyond max known date
            full_history = df_daily.copy()
            forecast_res = rf.forecast_recursive(full_history, horizon=horizon_days, sku=sku)
            forecast_output = {
                "dates": [d.date() if isinstance(d, (pd.Timestamp, datetime)) else d for d in forecast_res["dates"]],
                "predictions": forecast_res["predictions"],
                "lower_80": forecast_res["lower_80"],
                "upper_80": forecast_res["upper_80"],
                "lower_95": forecast_res["lower_95"],
                "upper_95": forecast_res["upper_95"],
            }

        else:  # hist_gradient_boosting
            hgb = HistGradientBoostingForecaster(max_iter=120, max_depth=8)
            hgb.fit(train_df, train_df["quantity"], val_df, val_df["quantity"] if not val_df.empty else None)

            if not test_df.empty:
                test_res = hgb.forecast_recursive(train_df, horizon=len(test_df), sku=sku)
                eval_metrics = evaluate_all_metrics(test_df["quantity"].values, test_res["predictions"], baseline_mae=baseline_mae)
            else:
                eval_metrics = {"mae": 0.0, "rmse": 0.0, "wape": 0.0, "bias": 0.0, "lift_vs_baseline_pct": 0.0}

            full_history = df_daily.copy()
            forecast_res = hgb.forecast_recursive(full_history, horizon=horizon_days, sku=sku)
            forecast_output = {
                "dates": [d.date() if isinstance(d, (pd.Timestamp, datetime)) else d for d in forecast_res["dates"]],
                "predictions": forecast_res["predictions"],
                "lower_80": forecast_res["lower_80"],
                "upper_80": forecast_res["upper_80"],
                "lower_95": forecast_res["lower_95"],
                "upper_95": forecast_res["upper_95"],
            }

        # Apply promotional & retail holiday lift multipliers to future predictions
        from backend.app.ml.promotions import PromotionManager
        promo_mgr = PromotionManager(self.db)
        adjusted_preds = []
        for dt, p in zip(forecast_output["dates"], forecast_output["predictions"]):
            target_dt = dt if isinstance(dt, date) else dt.date()
            lift = promo_mgr.get_lift_multiplier_for_date(target_dt, sku=sku)
            adjusted_preds.append(round(float(p) * lift, 2))
        forecast_output["predictions"] = adjusted_preds

        # 4. Save Forecast Run to Database
        run_record = ForecastRun(
            created_at=utc_now(),
            sku=sku,
            model_name=model_name,
            horizon_days=horizon_days,
            mae=eval_metrics.get("mae"),
            rmse=eval_metrics.get("rmse"),
            wape=eval_metrics.get("wape"),
            bias=eval_metrics.get("bias"),
            status="completed"
        )
        self.db.add(run_record)
        self.db.flush()

        points_to_save = []
        for i, dt in enumerate(forecast_output["dates"]):
            pt = ForecastPoint(
                forecast_run_id=run_record.id,
                sku=sku,
                target_date=dt,
                predicted_quantity=round(float(forecast_output["predictions"][i]), 2),
                lower_bound_80=round(float(forecast_output["lower_80"][i]), 2),
                upper_bound_80=round(float(forecast_output["upper_80"][i]), 2),
                lower_bound_95=round(float(forecast_output["lower_95"][i]), 2),
                upper_bound_95=round(float(forecast_output["upper_95"][i]), 2),
            )
            points_to_save.append(pt)
        self.db.bulk_save_objects(points_to_save)

        # 5. Save Model Benchmark
        benchmark = ModelBenchmark(
            evaluated_at=utc_now(),
            sku=sku,
            model_name=model_name,
            horizon_days=horizon_days,
            mae=eval_metrics.get("mae", 0.0),
            rmse=eval_metrics.get("rmse", 0.0),
            wape=eval_metrics.get("wape", 0.0),
            bias=eval_metrics.get("bias", 0.0),
            lift_vs_baseline_pct=eval_metrics.get("lift_vs_baseline_pct", 0.0),
            feature_importance_json=json.dumps(feature_importance_dict) if feature_importance_dict else None
        )
        self.db.add(benchmark)
        self.db.commit()

        # Build response payload
        return {
            "forecast_run_id": run_record.id,
            "sku": sku,
            "model_name": model_name,
            "horizon_days": horizon_days,
            "metrics": eval_metrics,
            "feature_importance": feature_importance_dict,
            "points": [
                {
                    "target_date": dt.strftime("%Y-%m-%d"),
                    "predicted_quantity": round(float(forecast_output["predictions"][i]), 2),
                    "lower_80": round(float(forecast_output["lower_80"][i]), 2),
                    "upper_80": round(float(forecast_output["upper_80"][i]), 2),
                    "lower_95": round(float(forecast_output["lower_95"][i]), 2),
                    "upper_95": round(float(forecast_output["upper_95"][i]), 2),
                }
                for i, dt in enumerate(forecast_output["dates"])
            ]
        }
