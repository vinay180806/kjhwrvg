"""Data loader module for reading, pre-indexing, and caching Elexon data."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd

from app.config import ACTUALS_CSV_PATH, FORECASTS_CSV_PATH, LONDON_TZ

logger = logging.getLogger("data_loader")


class DataLoader:
    _instance: Optional["DataLoader"] = None

    def __init__(self) -> None:
        self.actuals_df: pd.DataFrame = pd.DataFrame()
        self.forecasts_df: pd.DataFrame = pd.DataFrame()
        self.actuals_by_date: Dict[str, pd.DataFrame] = {}
        self.forecasts_by_slot: Dict[pd.Timestamp, List[Dict[str, Any]]] = {}
        self.available_delivery_dates: List[str] = []
        self._load_data()

    @classmethod
    def get_instance(cls) -> "DataLoader":
        if cls._instance is None:
            cls._instance = DataLoader()
        return cls._instance

    def _load_data(self) -> None:
        """Load actuals and forecasts from CSV files and pre-index for fast queries."""
        if not ACTUALS_CSV_PATH.exists():
            logger.warning(f"Actuals CSV not found at {ACTUALS_CSV_PATH}")
            return
        if not FORECASTS_CSV_PATH.exists():
            logger.warning(f"Forecasts CSV not found at {FORECASTS_CSV_PATH}")
            return

        logger.info(f"Loading actuals from {ACTUALS_CSV_PATH}...")
        actuals = pd.read_csv(ACTUALS_CSV_PATH)
        actuals["startTime"] = pd.to_datetime(actuals["startTime"], utc=True)
        actuals["publishTime"] = pd.to_datetime(actuals["publishTime"], utc=True)
        actuals["generation"] = pd.to_numeric(actuals["generation"], errors="coerce")
        actuals["settlementDate"] = actuals["settlementDate"].astype(str)
        actuals["settlementPeriod"] = actuals["settlementPeriod"].astype(int)
        self.actuals_df = actuals.sort_values(by="startTime").reset_index(drop=True)

        logger.info(f"Loading forecasts from {FORECASTS_CSV_PATH}...")
        forecasts = pd.read_csv(FORECASTS_CSV_PATH)
        forecasts["startTime"] = pd.to_datetime(forecasts["startTime"], utc=True)
        forecasts["publishTime"] = pd.to_datetime(forecasts["publishTime"], utc=True)
        forecasts["generation"] = pd.to_numeric(forecasts["generation"], errors="coerce")
        forecasts["lead_hours"] = (
            forecasts["startTime"] - forecasts["publishTime"]
        ).dt.total_seconds() / 3600.0
        self.forecasts_df = forecasts.sort_values(by=["startTime", "publishTime"]).reset_index(drop=True)

        # Pre-index actuals by date
        for date_str, group in self.actuals_df.groupby("settlementDate"):
            self.actuals_by_date[str(date_str)] = group.reset_index(drop=True)

        # Pre-index forecasts by startTime: list of dicts sorted by publishTime
        self.forecasts_by_slot = {}
        for slot_time, group in self.forecasts_df.groupby("startTime"):
            sorted_vintages = group.sort_values("publishTime")[["publishTime", "generation", "lead_hours"]].to_dict(orient="records")
            self.forecasts_by_slot[slot_time] = sorted_vintages

        # Extract available delivery dates (in London local time)
        london_dates = (
            self.actuals_df["startTime"]
            .dt.tz_convert(LONDON_TZ)
            .dt.strftime("%Y-%m-%d")
            .unique()
            .tolist()
        )
        self.available_delivery_dates = sorted(london_dates)
        logger.info(
            f"Loaded {len(self.actuals_df)} actuals and {len(self.forecasts_df)} forecasts. "
            f"Delivery dates: {len(self.available_delivery_dates)} days."
        )

    def get_actuals(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> pd.DataFrame:
        """Filter actuals by London delivery date range (inclusive)."""
        if self.actuals_df.empty:
            return pd.DataFrame()
        df = self.actuals_df
        if start_date:
            df = df[df["settlementDate"] >= start_date]
        if end_date:
            df = df[df["settlementDate"] <= end_date]
        return df.copy()

    def get_actuals_for_day(self, date_str: str) -> pd.DataFrame:
        """Get pre-indexed actuals for single day."""
        if date_str in self.actuals_by_date:
            return self.actuals_by_date[date_str]
        return pd.DataFrame()

    def get_forecasts_for_slot(self, slot_time: pd.Timestamp) -> List[Dict[str, Any]]:
        """Return pre-indexed forecasts for a slot sorted by publishTime."""
        return self.forecasts_by_slot.get(slot_time, [])


def get_data_loader() -> DataLoader:
    return DataLoader.get_instance()
