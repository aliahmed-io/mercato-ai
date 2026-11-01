from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.app.db.models import PromotionEvent

def get_black_friday_date(year: int) -> date:
    """Calculates Black Friday: the day after the fourth Thursday in November."""
    # Find November 1st
    nov_first = date(year, 11, 1)
    # Find first Thursday: weekday() 3 = Thursday
    offset = (3 - nov_first.weekday()) % 7
    first_thursday = nov_first + timedelta(days=offset)
    fourth_thursday = first_thursday + timedelta(weeks=3)
    black_friday = fourth_thursday + timedelta(days=1)
    return black_friday

def get_major_retail_holidays(year: int) -> List[Dict[str, Any]]:
    """Returns standard major retail shopping events and estimated demand multipliers."""
    bf = get_black_friday_date(year)
    cm = bf + timedelta(days=3)  # Cyber Monday

    return [
        {
            "id": f"holiday-{year}-ny",
            "name": "New Year Shopping Surge",
            "start_date": date(year, 1, 1),
            "end_date": date(year, 1, 4),
            "expected_lift_factor": 1.25,
            "type": "calendar_holiday",
            "is_fixed": True
        },
        {
            "id": f"holiday-{year}-val",
            "name": "Valentine's Retail Peak",
            "start_date": date(year, 2, 8),
            "end_date": date(year, 2, 14),
            "expected_lift_factor": 1.30,
            "type": "calendar_holiday",
            "is_fixed": True
        },
        {
            "id": f"holiday-{year}-summer",
            "name": "Mid-Year Summer Sale Week",
            "start_date": date(year, 7, 10),
            "end_date": date(year, 7, 17),
            "expected_lift_factor": 1.35,
            "type": "calendar_holiday",
            "is_fixed": True
        },
        {
            "id": f"holiday-{year}-bf",
            "name": "Black Friday Mega Event",
            "start_date": bf,
            "end_date": bf + timedelta(days=2),
            "expected_lift_factor": 1.75,
            "type": "calendar_holiday",
            "is_fixed": True
        },
        {
            "id": f"holiday-{year}-cm",
            "name": "Cyber Monday Digital Surge",
            "start_date": cm,
            "end_date": cm + timedelta(days=1),
            "expected_lift_factor": 1.65,
            "type": "calendar_holiday",
            "is_fixed": True
        },
        {
            "id": f"holiday-{year}-xmas",
            "name": "Holiday Gifting Rush",
            "start_date": date(year, 12, 15),
            "end_date": date(year, 12, 24),
            "expected_lift_factor": 1.55,
            "type": "calendar_holiday",
            "is_fixed": True
        },
        {
            "id": f"holiday-{year}-box",
            "name": "Boxing Week Clearance",
            "start_date": date(year, 12, 26),
            "end_date": date(year, 12, 31),
            "expected_lift_factor": 1.40,
            "type": "calendar_holiday",
            "is_fixed": True
        },
    ]

class PromotionManager:
    """Evaluates combined calendar holidays and scheduled merchant promotions."""

    def __init__(self, db: Session):
        self.db = db

    def get_active_events_for_date_range(self, start_date: date, end_date: date, sku: Optional[str] = None) -> List[Dict[str, Any]]:
        """Combines scheduled merchant promotions with calendar retail events."""
        events = []

        # 1. Merchant scheduled promotions from DB
        db_promos = (
            self.db.query(PromotionEvent)
            .filter(
                PromotionEvent.is_active == True,
                PromotionEvent.start_date <= end_date,
                PromotionEvent.end_date >= start_date
            )
            .all()
        )
        for p in db_promos:
            if sku and p.sku_scope != "ALL":
                allowed_skus = [s.strip().upper() for s in p.sku_scope.split(",")]
                if sku.upper() not in allowed_skus:
                    continue
            events.append({
                "id": f"promo-{p.id}",
                "name": p.name,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "discount_pct": p.discount_pct,
                "expected_lift_factor": p.expected_lift_factor,
                "sku_scope": p.sku_scope,
                "type": "merchant_promotion",
                "is_fixed": False
            })

        # 2. Add calendar holidays for relevant years
        years = {start_date.year, end_date.year}
        for yr in years:
            for h in get_major_retail_holidays(yr):
                if h["start_date"] <= end_date and h["end_date"] >= start_date:
                    events.append(h)

        return events

    def get_lift_multiplier_for_date(self, target_date: date, sku: Optional[str] = None) -> float:
        """Calculates aggregate demand multiplier for a specific day."""
        events = self.get_active_events_for_date_range(target_date, target_date, sku)
        if not events:
            return 1.0

        # Compounding or highest lift factor
        max_lift = max(e["expected_lift_factor"] for e in events)
        return max_lift
