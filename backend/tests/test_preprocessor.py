import pandas as pd
import pytest
from backend.app.ml.preprocessor import RetailDataPreprocessor

def test_return_and_cancellation_filtering():
    raw_data = {
        "InvoiceNo": ["536365", "C536366", "536367", "536368", "536368"],
        "StockCode": ["85123A", "85123A", "POST", "71053", "71053"],  # Includes cancellation C536366, admin code POST, duplicate 536368
        "Quantity": [6, -6, 1, 10, 10],
        "InvoiceDate": ["2023-01-01 08:26", "2023-01-01 08:28", "2023-01-01 08:30", "2023-01-01 08:34", "2023-01-01 08:34"],
        "UnitPrice": [2.55, 2.55, 18.0, 3.39, 3.39]
    }
    df = pd.DataFrame(raw_data)
    preprocessor = RetailDataPreprocessor(remove_returns=True, clean_non_products=True)
    df_clean = preprocessor.clean_transactions(df)

    # 1. Cancelled invoice 'C536366' should be filtered
    assert not any(df_clean["invoice_no"].str.startswith("C"))
    # 2. Administrative code 'POST' should be filtered
    assert "POST" not in df_clean["sku"].values
    # 3. Duplicate row should be removed
    assert len(df_clean) == 2  # Only 85123A and one instance of 71053 remain
    # 4. Quantities must be positive
    assert all(df_clean["quantity"] > 0)

def test_daily_demand_calendar_regularization():
    raw_data = {
        "invoice_no": ["101", "102"],
        "sku": ["SKU1", "SKU1"],
        "quantity": [5, 10],
        "unit_price": [10.0, 10.0],
        "invoice_date": ["2023-01-01 10:00", "2023-01-03 10:00"]  # Misses Jan 2nd
    }
    df = pd.DataFrame(raw_data)
    preprocessor = RetailDataPreprocessor()
    df_clean = preprocessor.clean_transactions(df)
    daily = preprocessor.aggregate_daily_demand(df_clean)

    # Jan 1, Jan 2, Jan 3 should all be present (3 days total)
    assert len(daily) == 3
    # Jan 2 should have quantity 0.0 (not missing)
    jan2_row = daily[daily["date"] == pd.to_datetime("2023-01-02")]
    assert len(jan2_row) == 1
    assert jan2_row.iloc[0]["quantity"] == 0.0
