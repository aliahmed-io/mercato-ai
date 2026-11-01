import pytest
from datetime import date
from backend.app.ml.promotions import get_black_friday_date, get_major_retail_holidays, PromotionManager
from backend.app.db.session import Base, engine, SessionLocal
from backend.app.db.models import PromotionEvent, Product
from backend.app.data.seed_data import seed_database

def test_black_friday_calculation():
    """Verify Black Friday calculation for multiple calendar years."""
    # 2025: Nov 1 was Saturday, 4th Thursday is Nov 27 -> BF is Nov 28
    bf_2025 = get_black_friday_date(2025)
    assert bf_2025 == date(2025, 11, 28)
    assert bf_2025.weekday() == 4  # Friday

    # 2026: Nov 1 was Sunday, 4th Thursday is Nov 26 -> BF is Nov 27
    bf_2026 = get_black_friday_date(2026)
    assert bf_2026 == date(2026, 11, 27)
    assert bf_2026.weekday() == 4

    # 2024: Nov 29
    bf_2024 = get_black_friday_date(2024)
    assert bf_2024 == date(2024, 11, 29)
    assert bf_2024.weekday() == 4

def test_major_retail_holidays():
    """Verify default retail holiday definitions and multipliers."""
    holidays = get_major_retail_holidays(2026)
    assert len(holidays) >= 6
    names = [h["name"] for h in holidays]
    assert any("Black Friday" in n for n in names)
    assert any("Cyber Monday" in n for n in names)
    assert any("Holiday Gifting" in n for n in names)

    # Multipliers must be realistic (between 1.1x and 2.5x)
    for h in holidays:
        assert 1.1 <= h["expected_lift_factor"] <= 2.5

def test_promotion_manager_lift():
    """Verify PromotionManager lift computation for holidays and custom promos."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            seed_database(db, num_days=30)

        manager = PromotionManager(db)

        # Baseline non-holiday day: lift factor should be 1.0
        normal_day = date(2026, 4, 15)
        lift_normal = manager.get_lift_multiplier_for_date(normal_day)
        assert lift_normal == 1.0

        # Black Friday day: lift factor should be >= 1.7
        bf_day = get_black_friday_date(2026)
        lift_bf = manager.get_lift_multiplier_for_date(bf_day)
        assert lift_bf >= 1.7

        # Add custom merchant promotion
        custom_promo = PromotionEvent(
            name="Spring Flash 30% Off",
            start_date=date(2026, 4, 14),
            end_date=date(2026, 4, 16),
            discount_pct=30.0,
            expected_lift_factor=1.45,
            sku_scope="ALL",
            is_active=True
        )
        db.add(custom_promo)
        db.commit()

        lift_with_promo = manager.get_lift_multiplier_for_date(normal_day)
        assert lift_with_promo == 1.45

        # Cleanup
        db.delete(custom_promo)
        db.commit()
    finally:
        db.close()
