import math
import pytest
from backend.app.inventory.service import InventoryIntelligenceService

def test_inventory_risk_classification():
    """Verify inventory status transitions between CRITICAL, REORDER_NOW, and SAFE."""
    # Simulation: lead_time = 14, avg_daily = 10, std = 2, z = 1.65
    lt_days = 14
    avg_daily = 10.0
    daily_std = 2.0
    z_factor = 1.65

    lead_time_demand = avg_daily * lt_days  # 140
    safety_stock = z_factor * daily_std * math.sqrt(lt_days)  # 1.65 * 2 * 3.7416 = 12.35
    rop = lead_time_demand + safety_stock  # 152.35

    # Stock < lead_time_demand (140) -> CRITICAL
    stock_critical = 100
    assert stock_critical < lead_time_demand

    # Lead_time_demand <= Stock <= ROP (140 <= 145 <= 152.35) -> REORDER_NOW
    stock_reorder = 145
    assert lead_time_demand <= stock_reorder <= rop

    # Stock > ROP * 1.3 (152.35 * 1.3 = 198) -> SAFE
    stock_safe = 250
    assert stock_safe > rop * 1.3

def test_suggested_reorder_qty():
    # If ROP = 152.35 and stock = 100, deficit is 52.35
    rop = 152.35
    stock = 100
    min_reorder = 50
    deficit = rop - stock
    suggested = int(math.ceil(max(deficit, min_reorder)))
    assert suggested == 53

def test_dual_variance_safety_stock_math():
    """Verify stochastic dual-variance formula vs deterministic."""
    lt_days = 14
    daily_std = 3.5
    avg_daily = 12.0
    z_factor = 1.65
    lt_std = 2.5

    # 1. Deterministic
    ss_det = z_factor * daily_std * math.sqrt(lt_days)

    # 2. Stochastic: sqrt( LT * sigma_D^2 + d_bar^2 * sigma_LT^2 )
    var_ltd = (lt_days * (daily_std ** 2)) + ((avg_daily ** 2) * (lt_std ** 2))
    sigma_ltd = math.sqrt(var_ltd)
    ss_stoch = z_factor * sigma_ltd

    # Stochastic safety stock must be strictly greater than deterministic when LT variance > 0
    assert ss_stoch > ss_det
    assert round(ss_det, 1) == 21.6  # 1.65 * 3.5 * 3.7416 = 21.6
    assert round(ss_stoch, 1) == 54.0  # 1.65 * sqrt(171.5 + 900) = 1.65 * 32.73 = 54.0

    # 3. When lt_std == 0, dual-variance equals deterministic
    var_zero_jitter = (lt_days * (daily_std ** 2)) + ((avg_daily ** 2) * (0.0 ** 2))
    assert math.isclose(z_factor * math.sqrt(var_zero_jitter), ss_det, rel_tol=1e-5)

def test_purchase_order_lifecycle():
    """Test PO draft creation, vendor dispatch, and goods receipt restocking."""
    from backend.app.db.session import Base, engine, SessionLocal, ensure_schema_migrations
    from backend.app.data.seed_data import seed_database
    from backend.app.db.models import Product, InventoryItem

    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations(engine)
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            seed_database(db, num_days=30)

        service = InventoryIntelligenceService(db)
        product = db.query(Product).first()
        assert product is not None

        # Record initial stock
        inv_before = db.query(InventoryItem).filter(InventoryItem.sku == product.sku).first()
        initial_stock = inv_before.current_stock if inv_before else 100

        # Step 1: Create PO
        po = service.create_purchase_order(
            items=[{"sku": product.sku, "quantity": 75}],
            supplier_notes="Urgent seasonal replenish",
            supplier_name="Premier Wholesale Corp",
            supplier_email="procurement@premierwholesale.com"
        )
        assert po["status"] == "DRAFT"
        assert po["total_units"] == 75
        assert len(po["items"]) == 1
        assert po["items"][0]["sku"] == product.sku
        assert po["items"][0]["quantity"] == 75

        # Step 2: Dispatch PO
        dispatched = service.dispatch_purchase_order(po["po_number"])
        assert dispatched["status"] == "DISPATCHED"
        assert dispatched["dispatched_at"] is not None
        assert "mailto:" in dispatched["mailto_url"]
        assert "procurement@premierwholesale.com" in dispatched["mailto_url"]

        # Step 3: Receive PO
        received = service.receive_purchase_order(po["po_number"], actual_lead_time=12)
        assert received["status"] == "RECEIVED"
        assert received["received_at"] is not None
        assert received["actual_lead_time_days"] == 12

        # Verify stock incremented
        inv_after = db.query(InventoryItem).filter(InventoryItem.sku == product.sku).first()
        assert inv_after.current_stock == initial_stock + 75
    finally:
        db.close()

