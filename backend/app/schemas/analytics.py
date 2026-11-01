from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class KPICard(BaseModel):
    title: str
    value: str
    subtitle: str
    delta_pct: Optional[float] = None
    delta_direction: Optional[str] = "up"  # "up", "down", "neutral"

class CategoryPerformance(BaseModel):
    category: str
    units_sold: int
    revenue: float
    product_count: int
    share_pct: float

class TopProductItem(BaseModel):
    sku: str
    name: str
    category: str
    units_sold: int
    revenue: float
    trend_pct: float
    current_stock: int
    status_badge: str

class ExecutiveOverviewResponse(BaseModel):
    total_historical_revenue: float
    total_units_sold: int
    total_forecasted_revenue: float
    total_forecasted_units: int
    active_skus_count: int
    critical_stockouts_count: int
    reorder_now_count: int
    kpis: List[KPICard]
    category_breakdown: List[CategoryPerformance]
    top_products: List[TopProductItem]
    recent_trend: List[Dict[str, Any]]
    ai_executive_summary: Optional[str] = None
