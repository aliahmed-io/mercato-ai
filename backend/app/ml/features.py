import pandas as pd
import numpy as np
from typing import List, Tuple

class TimeSeriesFeatureEngineer:
    """
    Constructs calendar, strictly lagged, and historical rolling window features.
    Guarantees NO future leakage by applying .shift(1) before any rolling aggregations.
    """

    LAG_DAYS = [1, 2, 3, 7, 14, 21, 28]
    ROLLING_WINDOWS = [7, 14, 28]

    @classmethod
    def create_features(cls, df_daily: pd.DataFrame, target_col: str = "quantity") -> pd.DataFrame:
        """
        Creates time-series feature matrix for a single product or group of products.
        Expects columns: ['date', 'sku', target_col].
        """
        df = df_daily.copy()
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values(["sku", "date"]).reset_index(drop=True)

        feature_dfs = []
        for sku, group in df.groupby("sku"):
            g = group.copy().set_index("date").sort_index()

            # Calendar features
            g["day_of_week"] = g.index.day_of_week
            g["is_weekend"] = (g["day_of_week"] >= 5).astype(int)
            g["day_of_month"] = g.index.day
            g["month"] = g.index.month
            g["quarter"] = g.index.quarter
            g["is_month_start"] = g.index.is_month_start.astype(int)
            g["is_month_end"] = g.index.is_month_end.astype(int)

            # Major Retail Shopping Holidays (Black Friday, Cyber Monday, Christmas Peak, New Year)
            is_nov = g["month"] == 11
            is_fri = g["day_of_week"] == 4
            is_mon = g["day_of_week"] == 0
            is_bf = is_nov & is_fri & (g["day_of_month"] >= 23) & (g["day_of_month"] <= 29)
            is_cm = is_nov & is_mon & (g["day_of_month"] >= 26) & (g["day_of_month"] <= 30)
            is_xmas = (g["month"] == 12) & (g["day_of_month"] >= 15) & (g["day_of_month"] <= 24)
            is_ny = (g["month"] == 1) & (g["day_of_month"] <= 3)
            g["is_retail_holiday"] = (is_bf | is_cm | is_xmas | is_ny).astype(int)

            # Strict Lag features (history only)
            for lag in cls.LAG_DAYS:
                g[f"lag_{lag}"] = g[target_col].shift(lag)

            # Rolling stats on strictly lagged series (shift 1 avoids leaking current day)
            lagged_series = g[target_col].shift(1)
            for window in cls.ROLLING_WINDOWS:
                g[f"rolling_mean_{window}"] = lagged_series.rolling(window=window, min_periods=3).mean()
                g[f"rolling_std_{window}"] = lagged_series.rolling(window=window, min_periods=3).std().fillna(0.0)
                g[f"rolling_max_{window}"] = lagged_series.rolling(window=window, min_periods=3).max()
                g[f"rolling_min_{window}"] = lagged_series.rolling(window=window, min_periods=3).min()
                # Non-zero demand frequency (useful for intermittent retail demand)
                g[f"rolling_active_days_{window}"] = (
                    (lagged_series > 0).rolling(window=window, min_periods=3).sum() / window
                )

            # Exponential Moving Average (strictly lagged)
            g["ewm_7"] = lagged_series.ewm(span=7, min_periods=3).mean()
            g["ewm_14"] = lagged_series.ewm(span=14, min_periods=3).mean()

            feature_dfs.append(g.reset_index())

        result = pd.concat(feature_dfs, ignore_index=True)
        return result

    @classmethod
    def get_feature_column_names(cls) -> List[str]:
        """Returns the list of feature column names used for training."""
        calendar_cols = [
            "day_of_week", "is_weekend", "day_of_month", "month", "quarter",
            "is_month_start", "is_month_end", "is_retail_holiday"
        ]
        lag_cols = [f"lag_{l}" for l in cls.LAG_DAYS]
        rolling_cols = []
        for w in cls.ROLLING_WINDOWS:
            rolling_cols.extend([
                f"rolling_mean_{w}", f"rolling_std_{w}", f"rolling_max_{w}",
                f"rolling_min_{w}", f"rolling_active_days_{w}"
            ])
        ema_cols = ["ewm_7", "ewm_14"]
        return calendar_cols + lag_cols + rolling_cols + ema_cols

    @classmethod
    def prepare_train_test_split(
        cls,
        df_features: pd.DataFrame,
        horizon_days: int = 7,
        val_days: int = 14,
        target_col: str = "quantity"
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Chronological chronological split into Train, Validation, and Test sets.
        Ensures NO SHUFFLE and NO DATA LEAKAGE.
        Test set is the final `horizon_days`.
        Validation set is the preceding `val_days`.
        Train set is everything before validation (excluding initial NaN rows from lags).
        """
        df = df_features.copy().sort_values("date").reset_index(drop=True)
        max_date = df["date"].max()

        test_start_date = max_date - pd.Timedelta(days=horizon_days - 1)
        val_start_date = test_start_date - pd.Timedelta(days=val_days)

        # Drop initial NaN rows caused by 28-day lags
        feature_cols = cls.get_feature_column_names()
        df_valid = df.dropna(subset=feature_cols).copy()

        train_set = df_valid[df_valid["date"] < val_start_date].copy()
        val_set = df_valid[(df_valid["date"] >= val_start_date) & (df_valid["date"] < test_start_date)].copy()
        test_set = df_valid[df_valid["date"] >= test_start_date].copy()

        return train_set, val_set, test_set
