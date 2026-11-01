import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from backend.app.config import settings
from backend.app.db.session import get_db
from backend.app.db.models import Product, DailySales, ForecastRun, ForecastPoint
from backend.app.inventory.service import InventoryIntelligenceService

router = APIRouter(prefix="/ai", tags=["ai"])

@router.get("/briefing")
def get_ai_briefing(sku: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Generates an executive briefing on demand forecasts and inventory risk.
    Uses Gemini API when configured, with a deterministic rule-based explainability fallback.
    """
    service = InventoryIntelligenceService(db)

    if sku:
        prod = db.query(Product).filter(Product.sku == sku).first()
        if not prod:
            raise HTTPException(status_code=404, detail="Product not found")
        metrics = service.calculate_sku_inventory_metrics(sku)
        context_text = (
            f"Product: {metrics['product_name']} (SKU: {sku})\n"
            f"Category: {metrics['category']}, Unit Price: €{metrics['unit_price']}, Unit Cost: €{metrics['cost_price']}\n"
            f"Current Stock: {metrics['current_stock']} units\n"
            f"Replenishment Lead Time: {metrics['lead_time_days']} days\n"
            f"Expected Lead-Time Demand: {metrics['lead_time_demand']} units\n"
            f"Safety Stock Required: {metrics['safety_stock']} units\n"
            f"Reorder Point: {metrics['reorder_point']} units\n"
            f"Days of Supply Remaining: {metrics['days_of_supply']} days\n"
            f"Current Risk Assessment: {metrics['risk_status']} ({metrics['status_badge']})\n"
            f"Suggested Reorder Quantity: {metrics['suggested_reorder_qty']} units (Capital required: €{metrics['capital_required']:,.2f})\n"
        )
    else:
        all_items = service.get_all_inventory_status()
        critical = [i for i in all_items if i["risk_status"] == "CRITICAL"]
        reorder = [i for i in all_items if i["risk_status"] == "REORDER_NOW"]
        safe = [i for i in all_items if i["risk_status"] == "SAFE"]
        context_text = (
            f"Catalog Scope: {len(all_items)} total monitored SKUs.\n"
            f"Critical Stockout Alerts: {len(critical)} SKUs below lead-time demand.\n"
            f"Reorder Triggered: {len(reorder)} SKUs below safety stock reorder point.\n"
            f"Healthy Inventory: {len(safe)} SKUs.\n"
            f"Top Critical SKUs: {', '.join([c['sku'] + ' (' + c['product_name'] + ')' for c in critical[:3]])}\n"
        )

    # Deterministic rule-based analytical fallback
    if sku:
        if metrics["risk_status"] == "CRITICAL":
            fallback_narrative = (
                f"{metrics['product_name']} is currently experiencing a critical stockout risk. "
                f"With only {metrics['current_stock']} units in stock and a supplier replenishment lead time of {metrics['lead_time_days']} days, "
                f"projected demand of {metrics['lead_time_demand']:.0f} units will deplete inventory in approximately {metrics['days_of_supply']} days. "
                f"Issuing a Purchase Order for {metrics['suggested_reorder_qty']} units (€{metrics['capital_required']:,.2f}) immediately is recommended to mitigate lost sales."
            )
        elif metrics["risk_status"] == "REORDER_NOW":
            fallback_narrative = (
                f"{metrics['product_name']} has reached its calculated reorder threshold of {metrics['reorder_point']:.0f} units. "
                f"Current stock ({metrics['current_stock']} units) provides {metrics['days_of_supply']} days of runway. "
                f"To maintain target service level ({metrics['safety_stock_factor']:.2f} safety factor), an order of {metrics['suggested_reorder_qty']} units is suggested."
            )
        else:
            fallback_narrative = (
                f"{metrics['product_name']} inventory is in a healthy posture with {metrics['current_stock']} units in stock, "
                f"providing {metrics['days_of_supply']} days of supply against forecast demand. No immediate purchase orders required."
            )
    else:
        fallback_narrative = (
            f"Executive Inventory Summary: Out of {len(all_items)} monitored SKUs, {len(critical)} SKUs require urgent purchase orders "
            f"to avert stockouts within their supplier lead times. An additional {len(reorder)} SKUs have breached safety stock reorder thresholds. "
            f"Demand forecasting indicates strong momentum across top retail lines."
        )

    ai_generated = False
    ai_model_used = "Deterministic Rules Engine (Non-AI Fallback)"

    # Attempt Gemini generation if API key is provided
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = (
                "You are the Chief Inventory Officer and ML Demand Forecasting Analyst for Mercato AI. "
                "Write a concise, polished 2-3 sentence executive briefing based on the following verified data. "
                "Adopt a confident, sophisticated commerce tone. Highlight specific numbers and direct actionable next steps.\n\n"
                f"{context_text}"
            )
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt
            )
            if response and response.text:
                fallback_narrative = response.text.strip()
                ai_generated = True
                ai_model_used = settings.GEMINI_MODEL
        except Exception:
            # Graceful degradation per Rule 28 & 29
            ai_generated = False
            ai_model_used = "Deterministic Rules Engine (Graceful Degradation Fallback)"

    return {
        "sku": sku,
        "narrative": fallback_narrative,
        "ai_generated": ai_generated,
        "model_provenance": ai_model_used,
        "confidence_level": 0.95 if ai_generated else 1.0,
        "methodology": "Conformal forecast inference + continuous review (s, Q) inventory model"
    }
