import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.db.models import ModelBenchmark, Product, DailySales
from backend.app.ml.backtesting import RollingOriginBacktester
from backend.app.ml.pipeline import ForecastingPipeline

router = APIRouter(prefix="/models", tags=["models"])

@router.get("/leaderboard")
def get_model_leaderboard(sku: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns comparative evaluation metrics (MAE, RMSE, WAPE, Bias, Lift vs Baseline)
    for Seasonal Naive, Random Forest, and HistGradientBoosting.
    """
    if not sku:
        # Pick top product as representative benchmark
        top_prod = db.query(Product).first()
        sku = top_prod.sku if top_prod else "APP-20241"

    pipeline = ForecastingPipeline(db)
    models = [
        {"id": "seasonal_naive", "name": "Seasonal Naive Baseline (7-Day)", "is_baseline": True},
        {"id": "random_forest", "name": "Random Forest Regressor (100 Trees)", "is_baseline": False},
        {"id": "hist_gradient_boosting", "name": "HistGradientBoosting Regressor", "is_baseline": False}
    ]

    leaderboard = []
    baseline_mae = None

    for m in models:
        try:
            res = pipeline.run_pipeline(sku=sku, model_name=m["id"], horizon_days=7)
            metrics = res["metrics"]
            if m["is_baseline"]:
                baseline_mae = metrics["mae"]

            lift = metrics.get("lift_vs_baseline_pct", 0.0)
            if not m["is_baseline"] and baseline_mae and baseline_mae > 0:
                lift = round(((baseline_mae - metrics["mae"]) / baseline_mae) * 100.0, 1)

            leaderboard.append({
                "model_id": m["id"],
                "model_name": m["name"],
                "is_baseline": m["is_baseline"],
                "mae": metrics.get("mae", 0.0),
                "rmse": metrics.get("rmse", 0.0),
                "wape_pct": metrics.get("wape_pct", 0.0),
                "bias": metrics.get("bias", 0.0),
                "lift_vs_baseline_pct": lift,
                "feature_importance": res.get("feature_importance", {})
            })
        except Exception as e:
            continue

    # Sort: highest lift first
    leaderboard.sort(key=lambda x: (not x["is_baseline"], x["lift_vs_baseline_pct"]), reverse=True)

    return {
        "sku": sku,
        "evaluation_period": "Chronological 7-Day Holdout",
        "leaderboard": leaderboard
    }

@router.post("/backtest")
def run_backtest_for_sku(sku: str = Query(...), n_splits: int = Query(3, ge=2, le=5), db: Session = Depends(get_db)):
    """Runs rolling-origin (expanding window) backtesting across walk-forward folds."""
    pipeline = ForecastingPipeline(db)
    df_daily = pipeline.get_sku_daily_series(sku)
    if df_daily.empty or len(df_daily) < 45:
        raise HTTPException(status_code=400, detail="Insufficient historical observations for walk-forward backtesting.")

    backtester = RollingOriginBacktester(horizon_days=7, n_splits=n_splits)
    try:
        results = backtester.run_backtest(df_daily, sku=sku)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest error: {str(e)}")
