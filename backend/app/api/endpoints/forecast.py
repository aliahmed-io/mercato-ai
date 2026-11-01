from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from backend.app.db.session import get_db
from backend.app.db.models import Product, DailySales, ForecastRun, ForecastPoint, ModelBenchmark
from backend.app.schemas.forecast import ForecastGenerateRequest, ForecastResponse, HistoricalDataPoint, ForecastPointOut
from backend.app.ml.pipeline import ForecastingPipeline

router = APIRouter(prefix="/forecast", tags=["forecast"])

@router.post("/generate", response_model=ForecastResponse)
def generate_forecast(req: ForecastGenerateRequest, db: Session = Depends(get_db)):
    """Runs time series forecasting pipeline for specified SKU, model, and horizon."""
    product = db.query(Product).filter(Product.sku == req.sku).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{req.sku}' not found.")

    pipeline = ForecastingPipeline(db)
    try:
        pipeline_res = pipeline.run_pipeline(
            sku=req.sku,
            model_name=req.model_name,
            horizon_days=req.horizon_days
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Forecasting error: {str(e)}")

    # Fetch recent history (past 60 days) for signature visualization
    history_records = (
        db.query(DailySales)
        .filter(DailySales.sku == req.sku)
        .order_by(DailySales.date.desc())
        .limit(60)
        .all()
    )
    history_records = sorted(history_records, key=lambda x: x.date)

    history = [
        HistoricalDataPoint(
            date=r.date.strftime("%Y-%m-%d"),
            quantity=float(r.quantity_sold),
            revenue=float(r.revenue)
        )
        for r in history_records
    ]

    total_forecasted_units = sum(p["predicted_quantity"] for p in pipeline_res["points"])
    expected_revenue = round(total_forecasted_units * product.unit_price, 2)
    hist_revenue = sum(h.revenue for h in history)

    return ForecastResponse(
        forecast_run_id=pipeline_res["forecast_run_id"],
        sku=req.sku,
        product_name=product.name,
        category=product.category,
        model_name=req.model_name,
        horizon_days=req.horizon_days,
        metrics=pipeline_res["metrics"],
        feature_importance=pipeline_res["feature_importance"],
        history=history,
        points=[ForecastPointOut(**pt) for pt in pipeline_res["points"]],
        summary_stats={
            "total_forecasted_units": round(total_forecasted_units, 1),
            "expected_revenue": expected_revenue,
            "historical_revenue_window": round(hist_revenue, 2),
            "unit_price": product.unit_price,
            "cutoff_date": history[-1].date if history else ""
        }
    )

@router.get("/{sku}", response_model=ForecastResponse)
def get_latest_forecast(sku: str, horizon_days: int = 7, db: Session = Depends(get_db)):
    """Retrieves the latest forecast for a SKU or generates a default if none exists."""
    product = db.query(Product).filter(Product.sku == sku).first()
    if not product:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku}' not found.")

    latest_run = (
        db.query(ForecastRun)
        .filter(ForecastRun.sku == sku, ForecastRun.horizon_days == horizon_days)
        .order_by(ForecastRun.created_at.desc())
        .first()
    )

    if not latest_run:
        # Auto-generate with default model
        req = ForecastGenerateRequest(sku=sku, model_name="hist_gradient_boosting", horizon_days=horizon_days)
        return generate_forecast(req, db)

    points = (
        db.query(ForecastPoint)
        .filter(ForecastPoint.forecast_run_id == latest_run.id)
        .order_by(ForecastPoint.target_date.asc())
        .all()
    )

    history_records = (
        db.query(DailySales)
        .filter(DailySales.sku == sku)
        .order_by(DailySales.date.desc())
        .limit(60)
        .all()
    )
    history_records = sorted(history_records, key=lambda x: x.date)

    history = [
        HistoricalDataPoint(
            date=r.date.strftime("%Y-%m-%d"),
            quantity=float(r.quantity_sold),
            revenue=float(r.revenue)
        )
        for r in history_records
    ]

    pts_out = [
        ForecastPointOut(
            target_date=p.target_date.strftime("%Y-%m-%d"),
            predicted_quantity=p.predicted_quantity,
            lower_80=p.lower_bound_80,
            upper_80=p.upper_bound_80,
            lower_95=p.lower_bound_95,
            upper_95=p.upper_bound_95,
            actual_quantity=p.actual_quantity
        )
        for p in points
    ]

    total_forecasted_units = sum(p.predicted_quantity for p in pts_out)

    return ForecastResponse(
        forecast_run_id=latest_run.id,
        sku=sku,
        product_name=product.name,
        category=product.category,
        model_name=latest_run.model_name,
        horizon_days=latest_run.horizon_days,
        metrics={
            "mae": latest_run.mae,
            "rmse": latest_run.rmse,
            "wape": latest_run.wape,
            "bias": latest_run.bias,
        },
        feature_importance={},
        history=history,
        points=pts_out,
        summary_stats={
            "total_forecasted_units": round(total_forecasted_units, 1),
            "expected_revenue": round(total_forecasted_units * product.unit_price, 2),
            "historical_revenue_window": round(sum(h.revenue for h in history), 2),
            "unit_price": product.unit_price,
            "cutoff_date": history[-1].date if history else ""
        }
    )

@router.get("/compare/{sku}")
def compare_models_for_sku(sku: str, horizon_days: int = 7, db: Session = Depends(get_db)):
    """Runs all 3 models on the holdout period and returns a comparative performance breakdown."""
    pipeline = ForecastingPipeline(db)
    models = ["seasonal_naive", "random_forest", "hist_gradient_boosting"]
    labels = {
        "seasonal_naive": "Seasonal Naive (7-Day Baseline)",
        "random_forest": "Random Forest Regressor",
        "hist_gradient_boosting": "HistGradientBoosting Regressor"
    }

    comparison = []
    for m in models:
        try:
            res = pipeline.run_pipeline(sku=sku, model_name=m, horizon_days=horizon_days)
            metrics = res["metrics"]
            comparison.append({
                "model_name": m,
                "model_label": labels.get(m, m),
                "mae": metrics.get("mae", 0.0),
                "rmse": metrics.get("rmse", 0.0),
                "wape_pct": metrics.get("wape_pct", 0.0),
                "bias": metrics.get("bias", 0.0),
                "lift_vs_baseline_pct": metrics.get("lift_vs_baseline_pct", 0.0),
                "is_baseline": (m == "seasonal_naive")
            })
        except Exception:
            continue

    return {
        "sku": sku,
        "horizon_days": horizon_days,
        "comparison": comparison
    }
