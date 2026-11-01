from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.session import get_db
from backend.app.schemas.inventory import InventoryItemOut, StockUpdateRequest, PurchaseOrderCreateRequest
from backend.app.inventory.service import InventoryIntelligenceService

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/status", response_model=List[InventoryItemOut])
def get_inventory_status(db: Session = Depends(get_db)):
    """Returns complete inventory status, lead-time demand, safety stock, and stockout warnings."""
    service = InventoryIntelligenceService(db)
    return service.get_all_inventory_status()

@router.put("/item", response_model=InventoryItemOut)
def update_inventory_record(req: StockUpdateRequest, db: Session = Depends(get_db)):
    """Updates user-managed current stock level, lead time, or safety factor."""
    service = InventoryIntelligenceService(db)
    try:
        return service.update_stock_record(
            sku=req.sku,
            current_stock=req.current_stock,
            lead_time_days=req.lead_time_days,
            safety_stock_factor=req.safety_stock_factor,
            warehouse_location=req.warehouse_location
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/purchase-orders")
def list_purchase_orders(db: Session = Depends(get_db)):
    """Returns all historical and active purchase orders."""
    service = InventoryIntelligenceService(db)
    return service.get_purchase_orders()

@router.post("/purchase-order")
def create_purchase_order(req: PurchaseOrderCreateRequest, db: Session = Depends(get_db)):
    """Creates, persists, and validates a formal purchase order."""
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot create empty purchase order.")

    service = InventoryIntelligenceService(db)
    items_dicts = [{"sku": it.sku, "quantity": it.quantity} for it in req.items]
    return service.create_purchase_order(
        items=items_dicts,
        supplier_notes=req.supplier_notes,
        supplier_name=req.supplier_name or "Premier Wholesale Corp",
        supplier_email=req.supplier_email or "procurement@premierwholesale.com",
        warehouse_location=req.warehouse_location or "CX Warehouse"
    )

@router.post("/purchase-order/{po_number}/dispatch")
def dispatch_purchase_order(po_number: str, db: Session = Depends(get_db)):
    """Marks a purchase order as dispatched to supplier and generates mailto payload."""
    service = InventoryIntelligenceService(db)
    try:
        return service.dispatch_purchase_order(po_number)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/purchase-order/{po_number}/receive")
def receive_purchase_order(po_number: str, actual_lead_time_days: int = 14, db: Session = Depends(get_db)):
    """Marks PO as received, recalculates vendor reliability, and restocks inventory."""
    service = InventoryIntelligenceService(db)
    try:
        return service.receive_purchase_order(po_number, actual_lead_time=actual_lead_time_days)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

