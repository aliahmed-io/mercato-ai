import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional
from datetime import datetime

NON_PRODUCT_CODES = {
    "POST", "D", "DOT", "M", "BANK CHARGES", "AMAZONFEE", "CRUK", "S", "B", "GIFT"
}

class RetailDataPreprocessor:
    """
    Cleans, validates, and transforms raw retail transaction records into
    a regularized daily time series without leakage.
    """

    def __init__(self, remove_returns: bool = True, clean_non_products: bool = True):
        self.remove_returns = remove_returns
        self.clean_non_products = clean_non_products
        self.audit_log: Dict[str, int] = {}

    def clean_transactions(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Cleans raw retail transaction rows according to documented rules:
        1. Remove rows with null SKU, Date, or Quantity.
        2. Filter out non-merchandise administrative codes.
        3. Handle returns and negative quantities.
        4. Remove exact duplicate rows.
        5. Normalize column names and types.
        """
        total_initial = len(df)
        self.audit_log["initial_rows"] = total_initial

        # Standardize column names
        df = df.copy()
        col_map = {c: c.strip().lower().replace(" ", "_") for c in df.columns}
        df = df.rename(columns=col_map)

        # Expected canonical columns: invoice_no, stock_code / sku, description, quantity, invoice_date, unit_price, customer_id, country
        sku_col = next((c for c in ["sku", "stockcode", "stock_code", "product_id"] if c in df.columns), None)
        date_col = next((c for c in ["invoicedate", "invoice_date", "date", "timestamp"] if c in df.columns), None)
        qty_col = next((c for c in ["quantity", "qty", "units"] if c in df.columns), None)
        price_col = next((c for c in ["unitprice", "unit_price", "price"] if c in df.columns), None)
        invoice_col = next((c for c in ["invoiceno", "invoice_no", "invoice"] if c in df.columns), None)

        desc_col = next((c for c in ["description", "product_name", "product_description", "name", "item_name", "title"] if c in df.columns), None)
        cat_col = next((c for c in ["category", "department", "dept", "product_category", "type"] if c in df.columns), None)

        if not sku_col or not date_col or not qty_col:
            raise ValueError(f"Missing required columns. Found: {list(df.columns)}. Expected SKU, Date, Quantity.")

        # Rename to canonical
        rename_dict = {
            sku_col: "sku",
            date_col: "invoice_date",
            qty_col: "quantity",
        }
        if price_col:
            rename_dict[price_col] = "unit_price"
        if invoice_col:
            rename_dict[invoice_col] = "invoice_no"
        if desc_col:
            rename_dict[desc_col] = "description"
        if cat_col:
            rename_dict[cat_col] = "category"
        df = df.rename(columns=rename_dict)

        if "unit_price" not in df.columns:
            df["unit_price"] = 10.0
        if "invoice_no" not in df.columns:
            df["invoice_no"] = [f"INV-{i}" for i in range(len(df))]

        # Drop null identifiers
        df = df.dropna(subset=["sku", "invoice_date", "quantity"])
        self.audit_log["after_null_removal"] = len(df)

        # Clean SKU strings
        df["sku"] = df["sku"].astype(str).str.strip().str.upper()

        # Filter out administrative non-product codes
        if self.clean_non_products:
            df = df[~df["sku"].isin(NON_PRODUCT_CODES)]
            # Filter codes with only letters or unusual punctuation
            df = df[df["sku"].str.len() >= 2]
            self.audit_log["after_admin_code_filter"] = len(df)

        # Parse invoice dates with flexible mixed format
        df["invoice_date"] = pd.to_datetime(df["invoice_date"], errors="coerce", format="mixed")
        df = df.dropna(subset=["invoice_date"])

        # Convert quantity and price
        df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0).astype(int)
        df["unit_price"] = pd.to_numeric(df["unit_price"], errors="coerce").fillna(0.0).astype(float)

        # Flag returns: Invoice starts with 'C' or quantity < 0
        df["invoice_no"] = df["invoice_no"].astype(str).str.strip()
        df["is_return"] = df["invoice_no"].str.startswith("C") | (df["quantity"] < 0)

        # Drop exact duplicate records
        df = df.drop_duplicates()
        self.audit_log["after_dedup"] = len(df)

        # Filter returns if requested (for demand forecasting, positive gross demand is modeled)
        if self.remove_returns:
            df = df[~df["is_return"] & (df["quantity"] > 0) & (df["unit_price"] > 0)]
            self.audit_log["after_return_filtering"] = len(df)

        df["total_amount"] = df["quantity"] * df["unit_price"]
        return df

    def aggregate_daily_demand(self, df_clean: pd.DataFrame, sku: Optional[str] = None) -> pd.DataFrame:
        """
        Aggregates transaction data to daily sales per product.
        Fills missing calendar dates with 0 to ensure continuous daily time series.
        """
        df = df_clean.copy()
        if sku:
            df = df[df["sku"] == sku]

        if df.empty:
            return pd.DataFrame(columns=["date", "sku", "quantity", "revenue", "order_count"])

        df["date"] = df["invoice_date"].dt.date

        # Group by date and sku
        daily = df.groupby(["date", "sku"]).agg(
            quantity=("quantity", "sum"),
            revenue=("total_amount", "sum"),
            order_count=("invoice_no", "nunique")
        ).reset_index()

        daily["date"] = pd.to_datetime(daily["date"])

        # Regularize frequency per SKU
        regularized_frames = []
        for product_sku, group in daily.groupby("sku"):
            min_date = group["date"].min()
            max_date = group["date"].max()
            full_date_idx = pd.date_range(min_date, max_date, freq="D", name="date")

            group_indexed = group.set_index("date").reindex(full_date_idx)
            group_indexed["sku"] = product_sku
            group_indexed["quantity"] = group_indexed["quantity"].fillna(0.0)
            group_indexed["revenue"] = group_indexed["revenue"].fillna(0.0)
            group_indexed["order_count"] = group_indexed["order_count"].fillna(0).astype(int)

            regularized_frames.append(group_indexed.reset_index())

        if not regularized_frames:
            return pd.DataFrame()

        result = pd.concat(regularized_frames, ignore_index=True)
        return result.sort_values(["sku", "date"]).reset_index(drop=True)
