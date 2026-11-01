from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from pydantic import BaseModel, Field

from backend.app.db.session import get_db
from backend.app.db.models import PromotionEvent, utc_now
from backend.app.ml.promotions import PromotionManager, get_major_retail_holidays

router = APIRouter(prefix="/promotions", tags=["promotions"])

class PromotionCreate(BaseModel):
    name: str = Field(min_length=3, max_length=128)
    start_date: date
    end_date: date
    discount_pct: float = Field(default=20.0, ge=0.0, le=90.0)
    expected_lift_factor: float = Field(default=1.35, ge=1.0, le=4.0)
    sku_scope: str = Field(default="ALL")

class PromotionOut(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    discount_pct: float
    expected_lift_factor: float
    sku_scope: str
    is_active: bool
    created_at: datetime

@router.get("", response_model=List[PromotionOut])
def list_promotions(db: Session = Depends(get_db)):
    """Returns all user-scheduled promotional campaigns."""
    return db.query(PromotionEvent).filter(PromotionEvent.is_active == True).order_by(PromotionEvent.start_date.asc()).all()

@router.post("", response_model=PromotionOut)
def create_promotion(req: PromotionCreate, db: Session = Depends(get_db)):
    """Creates a new promotional campaign and applies demand lift to forward forecasts."""
    if req.end_date < req.start_date:
        raise HTTPException(status_code=400, detail="End date must be on or after start date.")

    promo = PromotionEvent(
        name=req.name,
        start_date=req.start_date,
        end_date=req.end_date,
        discount_pct=req.discount_pct,
        expected_lift_factor=req.expected_lift_factor,
        sku_scope=req.sku_scope,
        is_active=True,
        created_at=utc_now()
    )
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return promo

@router.delete("/{promo_id}")
def delete_promotion(promo_id: int, db: Session = Depends(get_db)):
    """Deactivates a promotional campaign."""
    promo = db.query(PromotionEvent).filter(PromotionEvent.id == promo_id).first()
    if not promo:
        raise HTTPException(status_code=404, detail="Promotion not found.")
    promo.is_active = False
    db.commit()
    return {"status": "success", "message": f"Promotion '{promo.name}' deactivated."}

@router.get("/calendar")
def get_promotional_calendar(db: Session = Depends(get_db)):
    """Returns combined scheduled promotions and standard retail shopping holidays."""
    today = date.today()
    start = today - date.resolution * 30
    end = today + date.resolution * 180

    manager = PromotionManager(db)
    events = manager.get_active_events_for_date_range(start, end)
    return {
        "today": today.isoformat(),
        "total_events": len(events),
        "events": events
    }
