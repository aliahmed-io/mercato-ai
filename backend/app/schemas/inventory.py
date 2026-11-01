from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class InventoryItemOut(BaseModel):
    sku: str
    product_name: str
    category: str
    unit_price: float
    cost_price: float
    current_stock: int
    warehouse_location: str
    lead_time_days: int
    safety_stock_factor: float
    daily_demand_std: float
    avg_daily_forecast: float
    lead_time_demand: float
    safety_stock: float
    reorder_point: float
    days_of_supply: float
    risk_status: str  # "CRITICAL", "REORDER_NOW", "MODERATE", "SAFE"
    status_badge: str
    urgency: str
    suggested_reorder_qty: int
    capital_required: float
    assumptions: List[str]
    safety_stock_deterministic: Optional[float] = None
    safety_stock_stochastic: Optional[float] = None
    reorder_point_deterministic: Optional[float] = None
    lead_time_std_days: Optional[float] = None
    supplier_reliability_score: Optional[float] = None
    supplier_name: Optional[str] = None
    supplier_email: Optional[str] = None

class StockUpdateRequest(BaseModel):
    sku: str
    current_stock: int = Field(ge=0)
    lead_time_days: int = Field(default=14, ge=1, le=180)
    lead_time_std_days: Optional[float] = Field(default=2.5, ge=0.0, le=30.0)
    safety_stock_factor: float = Field(default=1.65, ge=0.5, le=3.0)
    warehouse_location: str = Field(default="CX Warehouse")
    supplier_name: Optional[str] = None
    supplier_email: Optional[str] = None

class PurchaseOrderItemIn(BaseModel):
    sku: str
    quantity: int = Field(gt=0)

class PurchaseOrderCreateRequest(BaseModel):
    supplier_name: Optional[str] = "Premier Wholesale Corp"
    supplier_email: Optional[str] = "procurement@premierwholesale.com"
    warehouse_location: Optional[str] = "CX Warehouse"
    supplier_notes: Optional[str] = None
    items: List[PurchaseOrderItemIn]

class PurchaseOrderItemOut(BaseModel):
    id: int
    sku: str
    product_name: Optional[str] = None
    quantity: int
    unit_cost: float
    total_cost: float

class PurchaseOrderOut(BaseModel):
    id: int
    po_number: str
    created_at: str
    status: str  # 'DRAFT', 'DISPATCHED', 'RECEIVED', 'CANCELLED'
    supplier_name: str
    supplier_email: str
    warehouse_location: str
    dispatched_at: Optional[str] = None
    received_at: Optional[str] = None
    actual_lead_time_days: Optional[int] = None
    total_units: int
    total_cost: float
    notes: Optional[str] = None
    items: List[PurchaseOrderItemOut]

