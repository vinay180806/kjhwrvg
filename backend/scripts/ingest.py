"""Data ingestion script for Elexon BMRS datasets.

Fetches:
1. FUELHH stream (fuelType=WIND): Actual wind generation for UK delivery days 2026-01-02 to 2026-02-01.
2. WINDFOR stream: Wind generation forecasts published between 2025-12-18 and 2026-02-02,
   filtering to target startTime within the delivery period (2026-01-02 00:00 to 2026-02-01 23:30 UTC).

Saves cleaned datasets to:
- backend/data/actuals.csv
- backend/data/forecasts.csv
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("ingest")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
BASE_URL = "https://data.elexon.co.uk/bmrs/api/v1"

# Target delivery period in UTC
DELIVERY_START_UTC = datetime(2026, 1, 2, 0, 0, 0, tzinfo=timezone.utc)
DELIVERY_END_UTC = datetime(2026, 2, 1, 23, 30, 0, tzinfo=timezone.utc)

# Forecast publish time range
FORECAST_PUBLISH_START = datetime(2025, 12, 18, 0, 0, 0, tzinfo=timezone.utc)
FORECAST_PUBLISH_END = datetime(2026, 2, 2, 0, 0, 0, tzinfo=timezone.utc)


def create_session() -> requests.Session:
    """Create requests session with retry strategy."""
    session = requests.Session()
    retries = Retry(
        total=5,
        backoff_factor=1.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET"],
    )
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": "GB-Wind-Decision-Tool/1.0"})
    return session


def fetch_actuals(session: requests.Session) -> pd.DataFrame:
    """Fetch actual wind generation from FUELHH stream."""
    logger.info("Fetching FUELHH actuals for fuelType=WIND...")
    url = f"{BASE_URL}/datasets/FUELHH/stream"
    
    # We can fetch in 7-day chunks by settlementDate
    curr = DELIVERY_START_UTC.date()
    end_date = DELIVERY_END_UTC.date()
    all_rows: List[Dict[str, Any]] = []

    while curr <= end_date:
        chunk_end = min(curr + timedelta(days=6), end_date)
        params = {
            "settlementDateFrom": curr.isoformat(),
            "settlementDateTo": chunk_end.isoformat(),
            "fuelType": "WIND",
        }
        logger.info(f"Fetching FUELHH chunk: {params['settlementDateFrom']} to {params['settlementDateTo']}")
        resp = session.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        logger.info(f"Retrieved {len(data)} rows for chunk {curr} to {chunk_end}")
        all_rows.extend(data)
        curr = chunk_end + timedelta(days=1)
        time.sleep(0.2)

    df = pd.DataFrame(all_rows)
    if df.empty:
        raise ValueError("No FUELHH data retrieved!")

    # Parse timestamps
    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    # Filter to exact delivery window
    mask = (df["startTime"] >= DELIVERY_START_UTC) & (df["startTime"] <= DELIVERY_END_UTC)
    df = df[mask].copy()

    # Deduplicate actuals per startTime, keeping latest publishTime
    df = df.sort_values(by=["startTime", "publishTime"]).drop_duplicates(subset=["startTime"], keep="last")

    # Select relevant fields and format
    df = df[["startTime", "publishTime", "generation", "settlementDate", "settlementPeriod"]].sort_values(by="startTime")
    logger.info(f"Total actuals after dedup & filtering: {len(df)} rows. Expected: 31 * 48 = 1488.")
    return df


def fetch_forecasts(session: requests.Session) -> pd.DataFrame:
    """Fetch WINDFOR forecast vintages in chunks."""
    logger.info(f"Fetching WINDFOR stream from {FORECAST_PUBLISH_START} to {FORECAST_PUBLISH_END}...")
    url = f"{BASE_URL}/datasets/WINDFOR/stream"

    curr = FORECAST_PUBLISH_START
    all_rows: List[Dict[str, Any]] = []

    while curr < FORECAST_PUBLISH_END:
        chunk_end = min(curr + timedelta(days=5), FORECAST_PUBLISH_END)
        params = {
            "publishDateTimeFrom": curr.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "publishDateTimeTo": chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        logger.info(f"Fetching WINDFOR chunk: {params['publishDateTimeFrom']} to {params['publishDateTimeTo']}")
        
        try:
            resp = session.get(url, params=params, timeout=45)
            resp.raise_for_status()
            data = resp.json()
            logger.info(f"Retrieved {len(data)} raw forecast rows for chunk {curr} to {chunk_end}")
            all_rows.extend(data)
        except Exception as e:
            logger.error(f"Error fetching chunk {curr} to {chunk_end}: {e}")
            raise

        curr = chunk_end
        time.sleep(0.3)

    df = pd.DataFrame(all_rows)
    if df.empty:
        raise ValueError("No WINDFOR data retrieved!")

    df["startTime"] = pd.to_datetime(df["startTime"], utc=True)
    df["publishTime"] = pd.to_datetime(df["publishTime"], utc=True)
    df["generation"] = pd.to_numeric(df["generation"], errors="coerce")

    # Filter startTime to delivery window
    mask = (df["startTime"] >= DELIVERY_START_UTC) & (df["startTime"] <= DELIVERY_END_UTC)
    df = df[mask].copy()
    logger.info(f"Rows with startTime in delivery window: {len(df)}")

    # Deduplicate forecasts per (startTime, publishTime)
    df = df.drop_duplicates(subset=["startTime", "publishTime"]).sort_values(by=["startTime", "publishTime"])
    
    # Keep essential columns
    df = df[["startTime", "publishTime", "generation"]]
    logger.info(f"Total unique forecasts in window: {len(df)} rows")
    return df


def run_ingestion() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    session = create_session()

    # 1. Fetch & save actuals
    df_actuals = fetch_actuals(session)
    actuals_path = DATA_DIR / "actuals.csv"
    # Format ISO 8601 strings
    df_actuals_out = df_actuals.copy()
    df_actuals_out["startTime"] = df_actuals_out["startTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    df_actuals_out["publishTime"] = df_actuals_out["publishTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    df_actuals_out.to_csv(actuals_path, index=False)
    logger.info(f"Saved actuals to {actuals_path} ({len(df_actuals_out)} rows)")

    # 2. Fetch & save forecasts
    df_forecasts = fetch_forecasts(session)
    forecasts_path = DATA_DIR / "forecasts.csv"
    df_forecasts_out = df_forecasts.copy()
    df_forecasts_out["startTime"] = df_forecasts_out["startTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    df_forecasts_out["publishTime"] = df_forecasts_out["publishTime"].dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    df_forecasts_out.to_csv(forecasts_path, index=False)
    logger.info(f"Saved forecasts to {forecasts_path} ({len(df_forecasts_out)} rows)")

    # Also save gzipped version if desired, but let's check size
    size_mb = forecasts_path.stat().st_size / (1024 * 1024)
    logger.info(f"Forecast CSV size: {size_mb:.2f} MB")
    logger.info("Ingestion complete!")


if __name__ == "__main__":
    run_ingestion()
