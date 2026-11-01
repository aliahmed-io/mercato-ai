import math
import random
from datetime import datetime, date, timedelta
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from backend.app.db.models import Product, Transaction, DailySales, InventoryItem, utc_now
from backend.app.ml.preprocessor import RetailDataPreprocessor

SAMPLE_CATALOG = [
    {
        "sku": "APP-20241",
        "name": "Heavyweight Flannel Overshirt",
        "category": "Apparel",
        "unit_price": 145.0,
        "cost_price": 68.0,
        "description": "Premium brushed cotton overshirt with horn buttons and double chest pockets.",
        "image_url": "/products/overshirt.png",
        "base_daily_demand": 18,
        "lead_time_days": 35,
        "current_stock": 190,  # Below lead time demand + safety stock -> "Reorder now"
        "safety_stock_factor": 1.65,
        "warehouse_location": "CX Warehouse"
    },
    {
        "sku": "APP-20242",
        "name": "Ribbed Cashmere Beanie",
        "category": "Apparel",
        "unit_price": 65.0,
        "cost_price": 28.0,
        "description": "100% Mongolian cashmere 7-gauge rib knit beanie in Arctic Blue.",
        "image_url": "/products/beanie.png",
        "base_daily_demand": 26,
        "lead_time_days": 21,
        "current_stock": 75,   # Critical stockout risk! (< 21 * 26)
        "safety_stock_factor": 1.65,
        "warehouse_location": "CX Warehouse"
    },
    {
        "sku": "APP-20243",
        "name": "Wide-Leg Indigo Selvedge Denim",
        "category": "Apparel",
        "unit_price": 195.0,
        "cost_price": 92.0,
        "description": "14oz Japanese kurabo denim, relaxed high-rise silhouette with chainstitch hem.",
        "image_url": "/products/denim.png",
        "base_daily_demand": 12,
        "lead_time_days": 28,
        "current_stock": 520,  # Healthy
        "safety_stock_factor": 1.65,
        "warehouse_location": "East DC"
    },
    {
        "sku": "ACC-30110",
        "name": "Full-Grain Leather Tote Bag",
        "category": "Accessories",
        "unit_price": 280.0,
        "cost_price": 135.0,
        "description": "Vegetable-tanned Tuscan leather tote with solid brass hardware.",
        "image_url": "/products/tote.png",
        "base_daily_demand": 8,
        "lead_time_days": 45,
        "current_stock": 110,  # Watchlist
        "safety_stock_factor": 1.65,
        "warehouse_location": "CX Warehouse"
    },
    {
        "sku": "HOM-40501",
        "name": "Hand-Poured Soy Amber Candle",
        "category": "Home & Living",
        "unit_price": 38.0,
        "cost_price": 14.0,
        "description": "Cedarwood, vetiver, and smoky tobacco leaf poured in an amber apothecary jar.",
        "image_url": "/products/candle.png",
        "base_daily_demand": 34,
        "lead_time_days": 14,
        "current_stock": 180,  # Critical (< 14 * 34)
        "safety_stock_factor": 1.65,
        "warehouse_location": "Central Depot"
    },
    {
        "sku": "HOM-40504",
        "name": "Woven Linen Throw Blanket",
        "category": "Home & Living",
        "unit_price": 120.0,
        "cost_price": 52.0,
        "description": "100% Belgian flax washed linen throw with fringed edges.",
        "image_url": "/products/blanket.png",
        "base_daily_demand": 14,
        "lead_time_days": 20,
        "current_stock": 450,  # Healthy
        "safety_stock_factor": 1.65,
        "warehouse_location": "East DC"
    },
    {
        "sku": "ACC-30115",
        "name": "Suede Chelsea Boots - Olive",
        "category": "Footwear",
        "unit_price": 240.0,
        "cost_price": 110.0,
        "description": "Water-repellent Italian suede with Goodyear welted crepe sole.",
        "image_url": "/products/boots.png",
        "base_daily_demand": 10,
        "lead_time_days": 30,
        "current_stock": 95,   # Critical
        "safety_stock_factor": 1.65,
        "warehouse_location": "CX Warehouse"
    },
    {
        "sku": "HOM-40510",
        "name": "Ceramic Pour-Over Coffee Dripper",
        "category": "Home & Living",
        "unit_price": 44.0,
        "cost_price": 18.0,
        "description": "Matte speckled stoneware dripper with conical spiral extraction grooves.",
        "image_url": "/products/dripper.png",
        "base_daily_demand": 22,
        "lead_time_days": 14,
        "current_stock": 620,  # Healthy
        "safety_stock_factor": 1.65,
        "warehouse_location": "Central Depot"
    }
]

def seed_database(db: Session, num_days: int = 180) -> int:
    """
    Populates database with benchmark retail transactions, product catalog,
    inventory records, and daily sales aggregates.
    """
    # 1. Clear existing records to ensure clean reproducible demo
    db.query(DailySales).delete()
    db.query(Transaction).delete()
    db.query(InventoryItem).delete()
    db.query(Product).delete()
    db.commit()

    random.seed(42)
    np.random.seed(42)

    end_date = date.today()
    start_date = end_date - timedelta(days=num_days)

    products_to_add = []
    inventory_to_add = []

    for item in SAMPLE_CATALOG:
        prod = Product(
            sku=item["sku"],
            name=item["name"],
            category=item["category"],
            unit_price=item["unit_price"],
            cost_price=item["cost_price"],
            description=item["description"],
            image_url=item["image_url"],
            created_at=utc_now() - timedelta(days=num_days)
        )
        products_to_add.append(prod)

        inv = InventoryItem(
            sku=item["sku"],
            current_stock=item["current_stock"],
            lead_time_days=item["lead_time_days"],
            safety_stock_factor=item["safety_stock_factor"],
            warehouse_location=item["warehouse_location"],
            min_reorder_qty=50,
            last_restocked_at=utc_now() - timedelta(days=random.randint(5, 30))
        )
        inventory_to_add.append(inv)

    db.add_all(products_to_add)
    db.add_all(inventory_to_add)
    db.commit()

    # 2. Generate daily sales and realistic transaction records
    transactions_to_add = []
    daily_aggregates_to_add = []

    curr_date = start_date
    invoice_seq = 10000

    day_idx = 0
    while curr_date <= end_date:
        weekday = curr_date.weekday()  # 0=Monday, 6=Sunday
        # Weekend lift (Friday/Saturday/Sunday sales higher in retail)
        day_factor = 1.35 if weekday in [4, 5, 6] else 0.88
        # Slight upward trend over the half-year
        trend_factor = 1.0 + (day_idx / num_days) * 0.22

        for item in SAMPLE_CATALOG:
            sku = item["sku"]
            unit_price = item["unit_price"]
            base_demand = item["base_daily_demand"]

            # Seasonal wave (bi-weekly cycle + noise)
            seasonal_wave = 1.0 + 0.18 * math.sin(2 * math.pi * day_idx / 28)
            expected_demand = base_demand * day_factor * trend_factor * seasonal_wave

            # Sample daily quantity from Poisson / Negative Binomial distribution
            daily_qty = int(np.random.poisson(lam=max(1.0, expected_demand)))
            daily_revenue = round(daily_qty * unit_price, 2)

            # Split daily sales into 1-4 individual customer transactions
            orders_today = max(1, min(daily_qty, random.randint(1, 4)))
            order_qtys = []
            remaining = daily_qty
            for o in range(orders_today - 1):
                portion = random.randint(1, max(1, remaining - (orders_today - o - 1)))
                order_qtys.append(portion)
                remaining -= portion
            order_qtys.append(remaining)

            for qty in order_qtys:
                if qty > 0:
                    invoice_seq += 1
                    t = Transaction(
                        invoice_no=f"INV-{invoice_seq}",
                        invoice_date=datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=random.randint(8, 20), minutes=random.randint(0, 59)),
                        sku=sku,
                        quantity=qty,
                        unit_price=unit_price,
                        customer_id=f"CUST-{random.randint(1001, 1500)}",
                        country="United Kingdom",
                        is_return=False,
                        total_amount=round(qty * unit_price, 2)
                    )
                    transactions_to_add.append(t)

            # Introduce realistic returns (~3.5% probability of return on a day)
            if random.random() < 0.035 and daily_qty > 2:
                ret_qty = random.randint(1, min(3, daily_qty))
                invoice_seq += 1
                t_ret = Transaction(
                    invoice_no=f"C{invoice_seq}",
                    invoice_date=datetime.combine(curr_date, datetime.min.time()) + timedelta(hours=random.randint(14, 21)),
                    sku=sku,
                    quantity=-ret_qty,
                    unit_price=unit_price,
                    customer_id=f"CUST-{random.randint(1001, 1500)}",
                    country="United Kingdom",
                    is_return=True,
                    total_amount=round(-ret_qty * unit_price, 2)
                )
                transactions_to_add.append(t_ret)

            # Record clean daily aggregate for forecasting
            daily_aggregates_to_add.append(DailySales(
                date=curr_date,
                sku=sku,
                quantity_sold=float(daily_qty),
                revenue=daily_revenue,
                order_count=orders_today
            ))

        curr_date += timedelta(days=1)
        day_idx += 1

    # Bulk insert
    db.bulk_save_objects(transactions_to_add)
    db.bulk_save_objects(daily_aggregates_to_add)
    db.commit()

    return len(transactions_to_add)
