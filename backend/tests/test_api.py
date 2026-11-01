import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.db.session import Base, engine, SessionLocal, ensure_schema_migrations
from backend.app.data.seed_data import seed_database
from backend.app.db.models import Product

@pytest.fixture(scope="module")
def client():
    # Ensure tables are created and seeded
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations(engine)
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            seed_database(db, num_days=90)
    finally:
        db.close()
    
    with TestClient(app) as test_client:
        yield test_client

def test_root_and_health(client):
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["project"] == "Mercato AI"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

def test_products_endpoint(client):
    res = client.get("/api/v1/data/products")
    assert res.status_code == 200
    products = res.json()
    assert isinstance(products, list)
    assert len(products) > 0
    assert "sku" in products[0]
    assert "name" in products[0]

def test_overview_analytics(client):
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_historical_revenue" in data
    assert "total_units_sold" in data
    assert "top_products" in data
    assert "category_breakdown" in data
    assert isinstance(data["top_products"], list)

def test_inventory_status(client):
    res = client.get("/api/v1/inventory/status")
    assert res.status_code == 200
    items = res.json()
    assert isinstance(items, list)
    assert len(items) > 0
    first = items[0]
    assert "sku" in first
    assert "current_stock" in first
    assert "reorder_point" in first
    assert "risk_status" in first

def test_generate_and_get_forecast(client):
    res = client.get("/api/v1/forecast/APP-20241?horizon_days=7")
    assert res.status_code == 200
    forecast_data = res.json()
    assert "sku" in forecast_data
    assert "points" in forecast_data
    assert len(forecast_data["points"]) == 7

def test_report_csv_export(client):
    res = client.get("/api/v1/reports/csv/forecast?sku=APP-20241")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "Date" in res.text

def test_report_pdf_export(client):
    res = client.get("/api/v1/reports/pdf/sales-forecast?sku=APP-20241")
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert res.content.startswith(b"%PDF")

def test_sample_csv_endpoint(client):
    res = client.get("/api/v1/data/sample-csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "StockCode" in res.text or "product_id" in res.text
    assert "Quantity" in res.text

def test_promotions_endpoints(client):
    # 1. Calendar
    res_cal = client.get("/api/v1/promotions/calendar")
    assert res_cal.status_code == 200
    data = res_cal.json()
    assert "events" in data
    assert data["total_events"] > 0

    # 2. Create promotion
    res_create = client.post("/api/v1/promotions", json={
        "name": "Summer Prime Days",
        "start_date": "2026-07-15",
        "end_date": "2026-07-18",
        "discount_pct": 20.0,
        "expected_lift_factor": 1.35,
        "sku_scope": "ALL"
    })
    assert res_create.status_code == 200
    promo = res_create.json()
    promo_id = promo["id"]
    assert promo["name"] == "Summer Prime Days"

    # 3. List promotions
    res_list = client.get("/api/v1/promotions")
    assert res_list.status_code == 200
    assert any(p["id"] == promo_id for p in res_list.json())

    # 4. Delete promotion
    res_del = client.delete(f"/api/v1/promotions/{promo_id}")
    assert res_del.status_code == 200

def test_purchase_order_api_lifecycle(client):
    # 1. Create Purchase Order
    res_create = client.post("/api/v1/inventory/purchase-order", json={
        "supplier_name": "Premier Wholesale Corp",
        "supplier_email": "procurement@premierwholesale.com",
        "warehouse_location": "CX Central Hub",
        "supplier_notes": "Automated system test replenishment",
        "items": [
            {"sku": "APP-20241", "quantity": 100}
        ]
    })
    assert res_create.status_code == 200
    po = res_create.json()
    po_num = po["po_number"]
    assert po["status"] == "DRAFT"
    assert po["total_units"] == 100

    # 2. List POs
    res_list = client.get("/api/v1/inventory/purchase-orders")
    assert res_list.status_code == 200
    assert any(p["po_number"] == po_num for p in res_list.json())

    # 3. Dispatch PO
    res_dispatch = client.post(f"/api/v1/inventory/purchase-order/{po_num}/dispatch")
    assert res_dispatch.status_code == 200
    dispatched = res_dispatch.json()
    assert dispatched["status"] == "DISPATCHED"
    assert "mailto:" in dispatched["mailto_url"]

    # 4. PDF PO report
    res_pdf = client.get(f"/api/v1/reports/pdf/purchase-order/{po_num}")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers["content-type"]
    assert res_pdf.content.startswith(b"%PDF")

    # 5. Receive PO
    res_receive = client.post(f"/api/v1/inventory/purchase-order/{po_num}/receive?actual_lead_time_days=11")
    assert res_receive.status_code == 200
    received = res_receive.json()
    assert received["status"] == "RECEIVED"
    assert received["actual_lead_time_days"] == 11

