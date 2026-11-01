from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date

class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    sku: str
    name: str
    category: str
    unit_price: float
    cost_price: float
    description: Optional[str] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None

class DailySalesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date: date
    sku: str
    quantity_sold: float
    revenue: float
    order_count: int

class ColumnMapping(BaseModel):
    sku_col: str
    date_col: str
    quantity_col: str
    price_col: Optional[str] = None
    invoice_col: Optional[str] = None
    description_col: Optional[str] = None

class ImportValidationResult(BaseModel):
    total_raw_rows: int
    valid_rows: int
    return_rows_detected: int
    admin_rows_filtered: int
    skus_detected: int
    date_range_start: str
    date_range_end: str
    preview_rows: List[Dict[str, Any]]
    validation_status: str  # "valid", "warnings", "invalid"
    messages: List[str]
    detected_columns: Optional[Dict[str, str]] = None

class SeedDataResponse(BaseModel):
    status: str
    message: str
    transactions_loaded: int
    catalog_count: int
