from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ForecastGenerateRequest(BaseModel):
    sku: str
    model_name: str = Field(default="hist_gradient_boosting", description="seasonal_naive, random_forest, or hist_gradient_boosting")
    horizon_days: int = Field(default=7, ge=3, le=60)

class ForecastPointOut(BaseModel):
    target_date: str
    predicted_quantity: float
    lower_80: float
    upper_80: float
    lower_95: float
    upper_95: float
    actual_quantity: Optional[float] = None

class HistoricalDataPoint(BaseModel):
    date: str
    quantity: float
    revenue: float

class ForecastResponse(BaseModel):
    forecast_run_id: int
    sku: str
    product_name: str
    category: str
    model_name: str
    horizon_days: int
    metrics: Dict[str, Any]
    feature_importance: Dict[str, float]
    history: List[HistoricalDataPoint]
    points: List[ForecastPointOut]
    summary_stats: Dict[str, Any]

class ModelLeaderboardItem(BaseModel):
    model_name: str
    model_label: str
    mae: float
    rmse: float
    wape_pct: float
    bias: float
    lift_vs_baseline_pct: float
    is_baseline: bool
