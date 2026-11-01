import math
import numpy as np
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.app.db.models import Product, InventoryItem, DailySales, ForecastPoint, ForecastRun

class InventoryIntelligenceService:
    """
    Computes inventory risk, lead-time demand, safety stock, and reorder suggestions
    based on machine-learning forecasts and explicit assumptions:
    1. Continuous review inventory policy (s, Q).
    2. Replenishment lead time is assumed constant (user-configured).
    3. Daily demand variability is estimated from historical standard deviation.
    4. Lead-time demand variance scales with sqrt(lead_time_days).
    """

    def __init__(self, db: Session):
        self.db = db

    def calculate_sku_inventory_metrics(
        self,
        sku: str,
        current_stock: Optional[int] = None,
        lead_time_days: Optional[int] = None,
        safety_stock_factor: Optional[float] = None
    ) -> Dict[str, Any]:
        product = self.db.query(Product).filter(Product.sku == sku).first()
        if not product:
            raise ValueError(f"Product not found: {sku}")

        inv = self.db.query(InventoryItem).filter(InventoryItem.sku == sku).first()
        stock = current_stock if current_stock is not None else (inv.current_stock if inv else 100)
        lt_days = lead_time_days if lead_time_days is not None else (inv.lead_time_days if inv else 14)
        z_factor = safety_stock_factor if safety_stock_factor is not None else (inv.safety_stock_factor if inv else 1.65)
        min_reorder = inv.min_reorder_qty if inv else 50
        warehouse = inv.warehouse_location if inv else "CX Warehouse"

        # 1. Fetch recent daily sales to compute historical standard deviation
        recent_sales = (
            self.db.query(DailySales.quantity_sold)
            .filter(DailySales.sku == sku)
            .order_by(DailySales.date.desc())
            .limit(60)
            .all()
        )
        sales_values = [r[0] for r in recent_sales] if recent_sales else [5.0]
        daily_std = float(np.std(sales_values)) if len(sales_values) > 1 else 2.0
        daily_avg = float(np.mean(sales_values)) if len(sales_values) > 0 else 5.0

        # 2. Get latest forecast points for the SKU
        latest_run = (
            self.db.query(ForecastRun)
            .filter(ForecastRun.sku == sku)
            .order_by(ForecastRun.created_at.desc())
            .first()
        )

        forecast_points = []
        if latest_run:
            points = (
                self.db.query(ForecastPoint)
                .filter(ForecastPoint.forecast_run_id == latest_run.id)
                .order_by(ForecastPoint.target_date.asc())
                .all()
            )
            forecast_points = [p.predicted_quantity for p in points]

        # 3. Calculate Lead-Time Demand (D_LT)
        if len(forecast_points) >= lt_days:
            lead_time_demand = float(sum(forecast_points[:lt_days]))
            avg_daily_forecast = float(np.mean(forecast_points[:lt_days]))
        elif len(forecast_points) > 0:
            avg_daily_forecast = float(np.mean(forecast_points))
            lead_time_demand = float(avg_daily_forecast * lt_days)
        else:
            avg_daily_forecast = daily_avg
            lead_time_demand = float(daily_avg * lt_days)

        lt_std = float(getattr(inv, "lead_time_std_days", 2.5) if inv else 2.5)
        vendor_reliability = float(getattr(inv, "on_time_delivery_rate", 0.92) if inv else 0.92)
        supplier_name = str(getattr(inv, "supplier_name", "Premier Wholesale Corp") if inv else "Premier Wholesale Corp")
        supplier_email = str(getattr(inv, "supplier_email", "procurement@premierwholesale.com") if inv else "procurement@premierwholesale.com")

        # 4a. Deterministic Safety Stock: SS_det = Z * sigma_daily * sqrt(LT)
        ss_deterministic = float(z_factor * daily_std * math.sqrt(lt_days))
        ss_deterministic = max(0.0, round(ss_deterministic, 1))

        # 4b. Stochastic (Dual-Variance) Safety Stock:
        # Accounts for both demand uncertainty AND supplier delivery variance:
        # sigma_LTD = sqrt( LT * sigma_D^2 + (d_bar)^2 * sigma_LT^2 )
        # SS_stochastic = Z * sigma_LTD
        variance_ltd = (lt_days * (daily_std ** 2)) + ((avg_daily_forecast ** 2) * (lt_std ** 2))
        sigma_ltd = math.sqrt(max(0.0, variance_ltd))
        ss_stochastic = float(z_factor * sigma_ltd)
        ss_stochastic = max(0.0, round(ss_stochastic, 1))

        # Default to stochastic safety stock to protect against supply disruptions
        safety_stock = ss_stochastic
        reorder_point = max(0.0, round(lead_time_demand + safety_stock, 1))
        reorder_point_deterministic = max(0.0, round(lead_time_demand + ss_deterministic, 1))

        # 6. Days of Supply (Runway)
        days_of_supply = round(stock / max(avg_daily_forecast, 0.1), 1)

        # 7. Stockout Risk Assessment
        if stock < lead_time_demand:
            risk_status = "CRITICAL"
            status_badge = "Stockout imminent"
            urgency = "high"
        elif stock <= reorder_point:
            risk_status = "REORDER_NOW"
            status_badge = "Reorder now"
            urgency = "medium"
        elif stock <= reorder_point * 1.3:
            risk_status = "MODERATE"
            status_badge = "Watchlist"
            urgency = "low"
        else:
            risk_status = "SAFE"
            status_badge = "Healthy"
            urgency = "none"

        # 8. Suggested Reorder Quantity
        deficit = reorder_point - stock
        if deficit > 0:
            suggested_reorder_qty = int(math.ceil(max(deficit, min_reorder)))
        else:
            suggested_reorder_qty = 0

        capital_required = round(suggested_reorder_qty * product.cost_price, 2)

        return {
            "sku": sku,
            "product_name": product.name,
            "category": product.category,
            "unit_price": product.unit_price,
            "cost_price": product.cost_price,
            "current_stock": stock,
            "warehouse_location": warehouse,
            "lead_time_days": lt_days,
            "lead_time_std_days": lt_std,
            "safety_stock_factor": z_factor,
            "daily_demand_std": round(daily_std, 2),
            "avg_daily_forecast": round(avg_daily_forecast, 2),
            "lead_time_demand": round(lead_time_demand, 1),
            "safety_stock": safety_stock,
            "safety_stock_deterministic": ss_deterministic,
            "safety_stock_stochastic": ss_stochastic,
            "reorder_point": reorder_point,
            "reorder_point_deterministic": reorder_point_deterministic,
            "supplier_reliability_score": round(vendor_reliability * 100, 1),
            "supplier_name": supplier_name,
            "supplier_email": supplier_email,
            "days_of_supply": days_of_supply,
            "risk_status": risk_status,
            "status_badge": status_badge,
            "urgency": urgency,
            "suggested_reorder_qty": suggested_reorder_qty,
            "capital_required": capital_required,
            "assumptions": [
                f"Continuous review policy with {z_factor} safety factor (~95% service level).",
                f"Lead time: mean = {lt_days} days, std dev (sigma_LT) = {lt_std:.1f} days.",
                f"Dual-variance stochastic safety stock incorporates vendor delay risk.",
                f"Supplier on-time delivery benchmark = {vendor_reliability * 100:.1f}%."
            ]
        }

    def get_all_inventory_status(self) -> List[Dict[str, Any]]:
        products = self.db.query(Product).order_by(Product.name.asc()).all()
        results = []
        for p in products:
            try:
                metrics = self.calculate_sku_inventory_metrics(p.sku)
                results.append(metrics)
            except Exception:
                continue

        # Sort by urgency: CRITICAL first, then REORDER_NOW, then MODERATE, then SAFE
        urgency_order = {"CRITICAL": 0, "REORDER_NOW": 1, "MODERATE": 2, "SAFE": 3}
        results.sort(key=lambda x: (urgency_order.get(x["risk_status"], 4), x["days_of_supply"]))
        return results

    def update_stock_record(
        self,
        sku: str,
        current_stock: int,
        lead_time_days: int = 14,
        lead_time_std_days: float = 2.5,
        safety_stock_factor: float = 1.65,
        warehouse_location: str = "CX Warehouse",
        supplier_name: Optional[str] = None,
        supplier_email: Optional[str] = None
    ) -> Dict[str, Any]:
        inv = self.db.query(InventoryItem).filter(InventoryItem.sku == sku).first()
        if not inv:
            inv = InventoryItem(
                sku=sku,
                current_stock=current_stock,
                lead_time_days=lead_time_days,
                lead_time_std_days=lead_time_std_days,
                safety_stock_factor=safety_stock_factor,
                warehouse_location=warehouse_location
            )
            if supplier_name:
                inv.supplier_name = supplier_name
            if supplier_email:
                inv.supplier_email = supplier_email
            self.db.add(inv)
        else:
            inv.current_stock = current_stock
            inv.lead_time_days = lead_time_days
            inv.lead_time_std_days = lead_time_std_days
            inv.safety_stock_factor = safety_stock_factor
            inv.warehouse_location = warehouse_location
            if supplier_name:
                inv.supplier_name = supplier_name
            if supplier_email:
                inv.supplier_email = supplier_email

        self.db.commit()
        return self.calculate_sku_inventory_metrics(sku)

    def create_purchase_order(
        self,
        items: List[Dict[str, Any]],
        supplier_notes: Optional[str] = None,
        supplier_name: str = "Premier Wholesale Corp",
        supplier_email: str = "procurement@premierwholesale.com",
        warehouse_location: str = "CX Warehouse"
    ) -> Dict[str, Any]:
        from backend.app.db.models import PurchaseOrder, PurchaseOrderItem, utc_now
        import random
        from datetime import date, timedelta

        po_num = f"PO-2026-{random.randint(10000, 99999)}"
        po = PurchaseOrder(
            po_number=po_num,
            created_at=utc_now(),
            status="DRAFT",
            supplier_name=supplier_name,
            supplier_email=supplier_email,
            warehouse_location=warehouse_location,
            expected_delivery_date=date.today() + timedelta(days=14),
            notes=supplier_notes or "Standard restocking replenishment order.",
            total_units=0,
            total_cost=0.0
        )
        self.db.add(po)
        self.db.flush()

        total_units = 0
        total_cost = 0.0
        po_item_objs = []

        products_map = {p.sku: p for p in self.db.query(Product).all()}

        for it in items:
            sku = it.get("sku")
            qty = int(it.get("quantity", 0))
            if not sku or qty <= 0 or sku not in products_map:
                continue

            prod = products_map[sku]
            cost = prod.cost_price
            line_total = round(qty * cost, 2)
            total_units += qty
            total_cost += line_total

            item_obj = PurchaseOrderItem(
                po_id=po.id,
                sku=sku,
                quantity=qty,
                unit_cost=cost,
                total_cost=line_total
            )
            po_item_objs.append(item_obj)

        po.total_units = total_units
        po.total_cost = round(total_cost, 2)
        self.db.add_all(po_item_objs)
        self.db.commit()

        return self.get_purchase_order_by_number(po_num)

    def get_purchase_orders(self) -> List[Dict[str, Any]]:
        from backend.app.db.models import PurchaseOrder
        orders = self.db.query(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).all()
        return [self._format_po(o) for o in orders]

    def get_purchase_order_by_number(self, po_number: str) -> Optional[Dict[str, Any]]:
        from backend.app.db.models import PurchaseOrder
        po = self.db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_number).first()
        if not po:
            return None
        return self._format_po(po)

    def dispatch_purchase_order(self, po_number: str) -> Dict[str, Any]:
        from backend.app.db.models import PurchaseOrder, utc_now
        po = self.db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_number).first()
        if not po:
            raise ValueError(f"Purchase order {po_number} not found.")

        po.status = "DISPATCHED"
        po.dispatched_at = utc_now()
        self.db.commit()

        subject = f"Official Purchase Order {po.po_number} - Mercato AI Commerce"
        body = (
            f"Dear {po.supplier_name} Procurement Team,\n\n"
            f"Please accept official purchase order {po.po_number} for delivery to {po.warehouse_location}.\n\n"
            f"Total Units: {po.total_units}\n"
            f"Total Amount: €{po.total_cost:,.2f}\n"
            f"Required Delivery By: {po.expected_delivery_date}\n\n"
            f"Notes: {po.notes}\n\n"
            f"Authorized by Mercato AI Automated Inventory Management."
        )

        res = self._format_po(po)
        res["mailto_url"] = f"mailto:{po.supplier_email}?subject={subject.replace(' ', '%20')}&body={body.replace(' ', '%20').replace(chr(10), '%0D%0A')}"
        res["procurement_letter"] = body
        return res

    def receive_purchase_order(self, po_number: str, actual_lead_time: Optional[int] = None) -> Dict[str, Any]:
        from backend.app.db.models import PurchaseOrder, InventoryItem, utc_now
        po = self.db.query(PurchaseOrder).filter(PurchaseOrder.po_number == po_number).first()
        if not po:
            raise ValueError(f"Purchase order {po_number} not found.")

        po.status = "RECEIVED"
        po.received_at = utc_now()

        if actual_lead_time is not None:
            days_taken = actual_lead_time
        elif po.dispatched_at:
            delta = (po.received_at - po.dispatched_at).days
            days_taken = max(1, delta)
        else:
            days_taken = 14
        po.actual_lead_time_days = days_taken

        # Restock inventory items and update supplier reliability
        for it in po.items:
            inv = self.db.query(InventoryItem).filter(InventoryItem.sku == it.sku).first()
            if inv:
                inv.current_stock += it.quantity
                inv.last_restocked_at = utc_now()
                if days_taken <= inv.lead_time_days:
                    inv.on_time_delivery_rate = min(1.0, inv.on_time_delivery_rate * 0.9 + 0.1 * 1.0)
                else:
                    inv.on_time_delivery_rate = max(0.5, inv.on_time_delivery_rate * 0.9)

        self.db.commit()
        return self._format_po(po)

    def _format_po(self, po) -> Dict[str, Any]:
        products_map = {p.sku: p.name for p in self.db.query(Product).all()}
        return {
            "id": po.id,
            "po_number": po.po_number,
            "created_at": po.created_at.strftime("%Y-%m-%d %H:%M"),
            "status": po.status,
            "supplier_name": po.supplier_name,
            "supplier_email": po.supplier_email,
            "warehouse_location": po.warehouse_location,
            "dispatched_at": po.dispatched_at.strftime("%Y-%m-%d %H:%M") if po.dispatched_at else None,
            "received_at": po.received_at.strftime("%Y-%m-%d %H:%M") if po.received_at else None,
            "actual_lead_time_days": po.actual_lead_time_days,
            "expected_delivery_date": str(po.expected_delivery_date) if po.expected_delivery_date else None,
            "total_units": po.total_units,
            "total_cost": po.total_cost,
            "notes": po.notes,
            "items": [
                {
                    "id": item.id,
                    "sku": item.sku,
                    "product_name": products_map.get(item.sku, f"Product {item.sku}"),
                    "quantity": item.quantity,
                    "unit_cost": item.unit_cost,
                    "total_cost": item.total_cost
                }
                for item in po.items
            ]
        }
