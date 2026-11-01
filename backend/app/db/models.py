from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Index
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def utc_now() -> datetime:
    """Return timezone-naive UTC datetime for SQLite compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Product(Base):
    __tablename__ = "products"

    sku = Column(String(64), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), index=True, nullable=False)
    unit_price = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    # Relationships
    transactions = relationship("Transaction", back_populates="product", cascade="all, delete-orphan")
    daily_sales = relationship("DailySales", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("InventoryItem", back_populates="product", uselist=False, cascade="all, delete-orphan")
    forecast_runs = relationship("ForecastRun", back_populates="product", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_no = Column(String(64), index=True, nullable=False)
    invoice_date = Column(DateTime, index=True, nullable=False)
    sku = Column(String(64), ForeignKey("products.sku"), index=True, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    customer_id = Column(String(64), nullable=True)
    country = Column(String(64), default="United Kingdom")
    is_return = Column(Boolean, default=False)
    total_amount = Column(Float, nullable=False)

    product = relationship("Product", back_populates="transactions")

    __table_args__ = (
        Index("ix_transaction_sku_date", "sku", "invoice_date"),
    )

class DailySales(Base):
    __tablename__ = "daily_sales"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    date = Column(Date, index=True, nullable=False)
    sku = Column(String(64), ForeignKey("products.sku"), index=True, nullable=False)
    quantity_sold = Column(Float, nullable=False)
    revenue = Column(Float, nullable=False)
    order_count = Column(Integer, default=1)

    product = relationship("Product", back_populates="daily_sales")

    __table_args__ = (
        Index("ix_daily_sales_sku_date", "sku", "date", unique=True),
    )

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    sku = Column(String(64), ForeignKey("products.sku"), primary_key=True)
    current_stock = Column(Integer, default=0, nullable=False)
    lead_time_days = Column(Integer, default=14, nullable=False)
    lead_time_std_days = Column(Float, default=2.5, nullable=False)  # Supplier delivery jitter (sigma_LT)
    on_time_delivery_rate = Column(Float, default=0.92, nullable=False)  # Historical vendor reliability (e.g. 92%)
    supplier_name = Column(String(128), default="Premier Wholesale Corp", nullable=False)
    supplier_email = Column(String(128), default="procurement@premierwholesale.com", nullable=False)
    safety_stock_factor = Column(Float, default=1.65, nullable=False)
    min_reorder_qty = Column(Integer, default=50, nullable=False)
    warehouse_location = Column(String(100), default="CX Warehouse")
    last_restocked_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    product = relationship("Product", back_populates="inventory")

class ForecastRun(Base):
    __tablename__ = "forecast_runs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime, default=utc_now, index=True)
    sku = Column(String(64), ForeignKey("products.sku"), index=True, nullable=False)
    model_name = Column(String(64), nullable=False)  # 'seasonal_naive', 'random_forest', 'hist_gradient_boosting'
    horizon_days = Column(Integer, default=7, nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    wape = Column(Float, nullable=True)
    bias = Column(Float, nullable=True)
    status = Column(String(32), default="completed")

    product = relationship("Product", back_populates="forecast_runs")
    points = relationship("ForecastPoint", back_populates="forecast_run", cascade="all, delete-orphan")

class ForecastPoint(Base):
    __tablename__ = "forecast_points"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    forecast_run_id = Column(Integer, ForeignKey("forecast_runs.id"), index=True, nullable=False)
    sku = Column(String(64), index=True, nullable=False)
    target_date = Column(Date, index=True, nullable=False)
    predicted_quantity = Column(Float, nullable=False)
    lower_bound_80 = Column(Float, nullable=False)
    upper_bound_80 = Column(Float, nullable=False)
    lower_bound_95 = Column(Float, nullable=False)
    upper_bound_95 = Column(Float, nullable=False)
    actual_quantity = Column(Float, nullable=True)

    forecast_run = relationship("ForecastRun", back_populates="points")

    __table_args__ = (
        Index("ix_forecast_points_sku_date", "sku", "target_date"),
    )

class ModelBenchmark(Base):
    __tablename__ = "model_benchmarks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    evaluated_at = Column(DateTime, default=utc_now, index=True)
    sku = Column(String(64), nullable=True, index=True)  # None = catalog-wide
    model_name = Column(String(64), nullable=False)
    horizon_days = Column(Integer, nullable=False)
    mae = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    wape = Column(Float, nullable=False)
    bias = Column(Float, nullable=False)
    lift_vs_baseline_pct = Column(Float, default=0.0)
    feature_importance_json = Column(Text, nullable=True)
    backtest_metrics_json = Column(Text, nullable=True)

class PromotionEvent(Base):
    __tablename__ = "promotion_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(128), nullable=False)
    start_date = Column(Date, index=True, nullable=False)
    end_date = Column(Date, index=True, nullable=False)
    discount_pct = Column(Float, default=20.0, nullable=False)
    expected_lift_factor = Column(Float, default=1.40, nullable=False)  # 1.40x (+40% unit demand)
    sku_scope = Column(String(255), default="ALL", nullable=False)  # 'ALL' or comma-separated SKUs
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    po_number = Column(String(64), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, index=True)
    status = Column(String(32), default="DRAFT", index=True, nullable=False)  # 'DRAFT', 'DISPATCHED', 'RECEIVED', 'CANCELLED'
    supplier_name = Column(String(128), default="Premier Wholesale Corp", nullable=False)
    supplier_email = Column(String(128), default="procurement@premierwholesale.com", nullable=False)
    warehouse_location = Column(String(100), default="CX Warehouse", nullable=False)
    dispatched_at = Column(DateTime, nullable=True)
    expected_delivery_date = Column(Date, nullable=True)
    received_at = Column(DateTime, nullable=True)
    actual_lead_time_days = Column(Integer, nullable=True)
    total_units = Column(Integer, default=0, nullable=False)
    total_cost = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)

    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.id"), index=True, nullable=False)
    sku = Column(String(64), ForeignKey("products.sku"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")
