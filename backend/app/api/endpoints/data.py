import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import random

from backend.app.db.session import get_db
from backend.app.db.models import Product, Transaction, DailySales, InventoryItem
from backend.app.schemas.data import ProductOut, SeedDataResponse, ImportValidationResult
from backend.app.data.seed_data import seed_database
from backend.app.ml.preprocessor import RetailDataPreprocessor

router = APIRouter(prefix="/data", tags=["data"])

def resolve_column(provided_name: Optional[str], available_cols: List[str], candidate_aliases: List[str]) -> Optional[str]:
    """Finds exact, normalized, or aliased column name from CSV headers."""
    if not available_cols:
        return None
    # 1. Exact match with provided name
    if provided_name and provided_name in available_cols:
        return provided_name
    # 2. Normalized match with provided name
    if provided_name:
        p_clean = provided_name.strip().lower().replace("_", "").replace(" ", "").replace("-", "")
        for c in available_cols:
            if c.strip().lower().replace("_", "").replace(" ", "").replace("-", "") == p_clean:
                return c
    # 3. Candidate alias match
    for alias in candidate_aliases:
        a_clean = alias.strip().lower().replace("_", "").replace(" ", "").replace("-", "")
        for c in available_cols:
            if c.strip().lower().replace("_", "").replace(" ", "").replace("-", "") == a_clean:
                return c
    return None

@router.post("/seed", response_model=SeedDataResponse)
def seed_benchmark_data(days: int = 180, db: Session = Depends(get_db)):
    """Populates the system with the clean benchmark retail dataset."""
    try:
        count = seed_database(db, num_days=days)
        catalog_count = db.query(Product).count()
        return SeedDataResponse(
            status="success",
            message=f"Successfully loaded {count} retail transactions across {catalog_count} products for the past {days} days.",
            transactions_loaded=count,
            catalog_count=catalog_count
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to seed benchmark data: {str(e)}")

@router.get("/products", response_model=List[ProductOut])
def list_products(category: Optional[str] = None, db: Session = Depends(get_db)):
    """Returns catalog of products, optionally filtered by category."""
    query = db.query(Product)
    if category:
        query = query.filter(Product.category == category)
    return query.order_by(Product.name.asc()).all()

@router.get("/sample-csv")
def download_sample_csv():
    """Generates an authentic UCI Online Retail formatted CSV for immediate testing."""
    headers = ["InvoiceNo", "StockCode", "Description", "Quantity", "InvoiceDate", "UnitPrice", "CustomerID", "Country"]
    skus_meta = [
        {"sku": "RET-101", "name": "Heavyweight Flannel Overshirt", "price": 145.0, "base_qty": 4},
        {"sku": "RET-102", "name": "Ribbed Cashmere Beanie", "price": 65.0, "base_qty": 6},
        {"sku": "RET-103", "name": "Wide-Leg Indigo Selvedge Denim", "price": 195.0, "base_qty": 3},
        {"sku": "RET-104", "name": "Full-Grain Leather Tote Bag", "price": 280.0, "base_qty": 2},
        {"sku": "RET-105", "name": "Hand-Poured Soy Amber Candle", "price": 38.0, "base_qty": 8},
        {"sku": "RET-106", "name": "Woven Linen Throw Blanket", "price": 120.0, "base_qty": 3},
    ]

    base_date = datetime.now() - timedelta(days=90)
    rows = []
    inv_num = 540000

    for day in range(90):
        current_date = base_date + timedelta(days=day)
        date_str = current_date.strftime("%Y-%m-%d %H:%M")
        for item in skus_meta:
            inv_num += 1
            qty = max(1, int(random.gauss(item["base_qty"], 1.5)))
            cust_id = str(random.randint(12000, 14000))
            rows.append(f"{inv_num},{item['sku']},{item['name']},{qty},{date_str},{item['price']:.2f},{cust_id},United Kingdom")
            # Occasionally add a return invoice starting with 'C'
            if day % 20 == 0:
                inv_num += 1
                rows.append(f"C{inv_num},{item['sku']},{item['name']},-{random.randint(1, 2)},{date_str},{item['price']:.2f},{cust_id},United Kingdom")

    csv_content = "\n".join([",".join(headers)] + rows)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mercato_sample_retail_transactions.csv"}
    )

@router.post("/preview", response_model=ImportValidationResult)
async def preview_csv_import(
    file: UploadFile = File(...),
    sku_col: str = Form("StockCode"),
    date_col: str = Form("InvoiceDate"),
    qty_col: str = Form("Quantity"),
    price_col: str = Form("UnitPrice"),
    invoice_col: str = Form("InvoiceNo")
):
    """
    Validates uploaded CSV file against column mapping and preprocessing rules
    without saving to database. Uses intelligent column detection.
    """
    try:
        contents = await file.read()
        df_raw = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig", low_memory=False)
    except Exception:
        try:
            df_raw = pd.read_csv(io.BytesIO(contents), encoding="latin1", low_memory=False)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    total_rows = len(df_raw)
    cols = list(df_raw.columns)

    # Intelligent column resolution with fallback aliases
    resolved_sku = resolve_column(sku_col, cols, ["StockCode", "stock_code", "SKU", "sku", "product_id", "product_code", "item_code", "item_id"])
    resolved_date = resolve_column(date_col, cols, ["InvoiceDate", "invoice_date", "Date", "date", "timestamp", "datetime", "order_date"])
    resolved_qty = resolve_column(qty_col, cols, ["Quantity", "quantity", "Qty", "qty", "units", "units_sold", "net_quantity"])
    resolved_price = resolve_column(price_col, cols, ["UnitPrice", "unit_price", "Price", "price", "variant_price", "cost", "amount"])
    resolved_invoice = resolve_column(invoice_col, cols, ["InvoiceNo", "invoice_no", "invoice", "Invoice", "order_id", "OrderNumber"])
    resolved_desc = resolve_column(None, cols, ["Description", "description", "product_name", "Product Name", "name", "title"])
    resolved_cat = resolve_column(None, cols, ["Category", "category", "Department", "department", "type"])

    messages = []
    if not resolved_sku:
        messages.append(f"SKU/Product code column not detected. Available headers: {cols}")
    if not resolved_date:
        messages.append(f"Date/Timestamp column not detected. Available headers: {cols}")
    if not resolved_qty:
        messages.append(f"Quantity/Units column not detected. Available headers: {cols}")

    if messages:
        return ImportValidationResult(
            total_raw_rows=total_rows,
            valid_rows=0,
            return_rows_detected=0,
            admin_rows_filtered=0,
            skus_detected=0,
            date_range_start="",
            date_range_end="",
            preview_rows=[],
            validation_status="invalid",
            messages=messages,
            detected_columns={
                "sku": resolved_sku or "Not found",
                "date": resolved_date or "Not found",
                "quantity": resolved_qty or "Not found",
                "price": resolved_price or "Optional (defaulted to 10.0)",
                "invoice": resolved_invoice or "Optional (auto-generated)",
                "description": resolved_desc or "Optional",
                "category": resolved_cat or "Optional"
            }
        )

    # Rename mapped columns to canonical
    rename_dict = {
        resolved_sku: "sku",
        resolved_date: "invoice_date",
        resolved_qty: "quantity",
    }
    if resolved_price:
        rename_dict[resolved_price] = "unit_price"
    if resolved_invoice:
        rename_dict[resolved_invoice] = "invoice_no"
    if resolved_desc:
        rename_dict[resolved_desc] = "description"
    if resolved_cat:
        rename_dict[resolved_cat] = "category"

    df = df_raw.rename(columns=rename_dict)

    preprocessor = RetailDataPreprocessor(remove_returns=True, clean_non_products=True)
    try:
        df_clean = preprocessor.clean_transactions(df)
    except Exception as e:
        return ImportValidationResult(
            total_raw_rows=total_rows,
            valid_rows=0,
            return_rows_detected=0,
            admin_rows_filtered=0,
            skus_detected=0,
            date_range_start="",
            date_range_end="",
            preview_rows=[],
            validation_status="invalid",
            messages=[f"Preprocessing validation failed: {str(e)}"],
            detected_columns={"sku": resolved_sku, "date": resolved_date, "quantity": resolved_qty}
        )

    audit = preprocessor.audit_log
    valid_rows = len(df_clean)
    ret_rows = audit.get("after_dedup", 0) - audit.get("after_return_filtering", 0)
    admin_filtered = audit.get("after_null_removal", 0) - audit.get("after_admin_code_filter", 0)
    skus_count = df_clean["sku"].nunique()

    min_date = df_clean["invoice_date"].min().strftime("%Y-%m-%d") if not df_clean.empty else ""
    max_date = df_clean["invoice_date"].max().strftime("%Y-%m-%d") if not df_clean.empty else ""

    preview_records = df_clean.head(10)[["sku", "invoice_date", "quantity", "unit_price", "total_amount"]].to_dict(orient="records")
    for r in preview_records:
        r["invoice_date"] = r["invoice_date"].strftime("%Y-%m-%d %H:%M")

    return ImportValidationResult(
        total_raw_rows=total_rows,
        valid_rows=valid_rows,
        return_rows_detected=ret_rows,
        admin_rows_filtered=admin_filtered,
        skus_detected=skus_count,
        date_range_start=min_date,
        date_range_end=max_date,
        preview_rows=preview_records,
        validation_status="valid" if valid_rows > 0 else "warnings",
        messages=[f"Validation passed: Mapped SKU='{resolved_sku}', Date='{resolved_date}', Qty='{resolved_qty}'."] if valid_rows > 0 else ["No valid sales records found after cleaning."],
        detected_columns={
            "sku": resolved_sku,
            "date": resolved_date,
            "quantity": resolved_qty,
            "price": resolved_price or "Defaulted (10.0)",
            "invoice": resolved_invoice or "Auto-generated",
            "description": resolved_desc or "Defaulted",
            "category": resolved_cat or "Defaulted"
        }
    )

@router.post("/import")
async def execute_csv_import(
    file: UploadFile = File(...),
    sku_col: str = Form("StockCode"),
    date_col: str = Form("InvoiceDate"),
    qty_col: str = Form("Quantity"),
    price_col: str = Form("UnitPrice"),
    invoice_col: str = Form("InvoiceNo"),
    category_default: str = Form("General Retail"),
    db: Session = Depends(get_db)
):
    """Executes full data ingestion and generates daily aggregates for forecasting."""
    contents = await file.read()
    try:
        df_raw = pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig", low_memory=False)
    except Exception:
        df_raw = pd.read_csv(io.BytesIO(contents), encoding="latin1", low_memory=False)

    cols = list(df_raw.columns)

    resolved_sku = resolve_column(sku_col, cols, ["StockCode", "stock_code", "SKU", "sku", "product_id", "product_code", "item_code", "item_id"])
    resolved_date = resolve_column(date_col, cols, ["InvoiceDate", "invoice_date", "Date", "date", "timestamp", "datetime", "order_date"])
    resolved_qty = resolve_column(qty_col, cols, ["Quantity", "quantity", "Qty", "qty", "units", "units_sold", "net_quantity"])
    resolved_price = resolve_column(price_col, cols, ["UnitPrice", "unit_price", "Price", "price", "variant_price", "cost", "amount"])
    resolved_invoice = resolve_column(invoice_col, cols, ["InvoiceNo", "invoice_no", "invoice", "Invoice", "order_id", "OrderNumber"])
    resolved_desc = resolve_column(None, cols, ["Description", "description", "product_name", "Product Name", "name", "title"])
    resolved_cat = resolve_column(None, cols, ["Category", "category", "Department", "department", "type"])

    if not resolved_sku or not resolved_date or not resolved_qty:
        raise HTTPException(status_code=400, detail="Required columns (SKU, Date, Quantity) could not be resolved from CSV.")

    rename_dict = {
        resolved_sku: "sku",
        resolved_date: "invoice_date",
        resolved_qty: "quantity",
    }
    if resolved_price:
        rename_dict[resolved_price] = "unit_price"
    if resolved_invoice:
        rename_dict[resolved_invoice] = "invoice_no"
    if resolved_desc:
        rename_dict[resolved_desc] = "description"
    if resolved_cat:
        rename_dict[resolved_cat] = "category"

    df = df_raw.rename(columns=rename_dict)

    preprocessor = RetailDataPreprocessor(remove_returns=True, clean_non_products=True)
    df_clean = preprocessor.clean_transactions(df)

    if df_clean.empty:
        raise HTTPException(status_code=400, detail="No valid sales records found after cleaning.")

    # 1. Upsert Products & Inventory
    existing_products = {p.sku: p for p in db.query(Product).all()}
    existing_skus = set(existing_products.keys())
    unique_skus = df_clean["sku"].unique()

    new_products = []
    new_inventory = []

    for s in unique_skus:
        sku_df = df_clean[df_clean["sku"] == s]
        avg_price = float(sku_df["unit_price"].median()) if not sku_df.empty else 10.0
        cost_price = round(avg_price * 0.45, 2)

        # Extract authentic product name if description exists
        prod_name = f"Product {s}"
        if "description" in sku_df.columns:
            valid_descs = sku_df["description"].dropna().astype(str).str.strip()
            valid_descs = valid_descs[valid_descs.str.len() > 2]
            if not valid_descs.empty:
                prod_name = valid_descs.iloc[0].title()[:250]

        # Extract authentic category if category exists
        prod_cat = category_default
        if "category" in sku_df.columns:
            valid_cats = sku_df["category"].dropna().astype(str).str.strip()
            if not valid_cats.empty:
                prod_cat = valid_cats.iloc[0].title()[:95]

        if s not in existing_skus:
            p = Product(
                sku=s,
                name=prod_name,
                category=prod_cat,
                unit_price=max(1.0, avg_price),
                cost_price=max(0.5, cost_price),
                description=f"Imported retail SKU {s} ({prod_name})"
            )
            new_products.append(p)
            inv = InventoryItem(
                sku=s,
                current_stock=random.randint(40, 220),
                lead_time_days=14,
                safety_stock_factor=1.65,
                warehouse_location="Primary Depot",
                min_reorder_qty=50
            )
            new_inventory.append(inv)
        else:
            # Update existing product name if it was default
            p_exist = existing_products[s]
            if p_exist.name.startswith("Product ") and prod_name != f"Product {s}":
                p_exist.name = prod_name

    if new_products:
        db.add_all(new_products)
        db.add_all(new_inventory)
        db.commit()

    # 2. Compute and upsert daily sales aggregates
    daily_df = preprocessor.aggregate_daily_demand(df_clean)

    # Clear existing daily sales for affected SKUs to avoid duplicate keys
    for s in unique_skus:
        db.query(DailySales).filter(DailySales.sku == s).delete()
    db.commit()

    daily_objects = []
    for _, row in daily_df.iterrows():
        d_obj = DailySales(
            date=row["date"].date(),
            sku=row["sku"],
            quantity_sold=float(row["quantity"]),
            revenue=float(row["revenue"]),
            order_count=int(row["order_count"])
        )
        daily_objects.append(d_obj)

    db.bulk_save_objects(daily_objects)
    db.commit()

    return {
        "status": "success",
        "imported_transactions": len(df_clean),
        "products_configured": len(unique_skus),
        "daily_records_created": len(daily_objects)
    }
