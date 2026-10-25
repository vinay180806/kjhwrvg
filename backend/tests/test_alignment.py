"""Unit tests for cutoff-alignment and timezone logic."""

from datetime import datetime, timezone
from zoneinfo import ZoneInfo
import pandas as pd
import pytest

from app.alignment import (
    align_forecasts_for_day,
    parse_cutoff_datetime,
)
from app.config import LONDON_TZ
from app.data_loader import DataLoader


def test_cutoff_datetime_conversion_winter_and_summer():
    """Verify cutoff timestamp calculation in Europe/London.
    - In January (GMT / UTC+0): 09:00 London == 09:00 UTC.
    - In July (BST / UTC+1): 09:00 London == 08:00 UTC.
    """
    cutoff_winter = parse_cutoff_datetime("2026-01-02", "09:00", days_before=1)
    assert cutoff_winter.tzinfo == LONDON_TZ
    assert cutoff_winter.year == 2026
    assert cutoff_winter.month == 1
    assert cutoff_winter.day == 1
    assert cutoff_winter.hour == 9
    assert cutoff_winter.minute == 0
    cutoff_winter_utc = cutoff_winter.astimezone(timezone.utc)
    assert cutoff_winter_utc.hour == 9
    assert cutoff_winter_utc.utcoffset().total_seconds() == 0

    cutoff_summer = parse_cutoff_datetime("2026-07-15", "09:00", days_before=1)
    cutoff_summer_utc = cutoff_summer.astimezone(timezone.utc)
    assert cutoff_summer_utc.hour == 8


def test_alignment_picks_latest_before_cutoff_and_no_lookahead():
    """Verify that:
    1. Cutoff-alignment selects the forecast with maximum publishTime <= cutoff.
    2. Forecasts published AFTER cutoff are strictly ignored (no lookahead leakage).
    """
    target_slot = pd.to_datetime("2026-01-02T12:00:00Z", utc=True)
    mock_loader = DataLoader.__new__(DataLoader)
    mock_loader.available_delivery_dates = ["2026-01-02"]
    
    mock_loader.actuals_df = pd.DataFrame([{
        "startTime": target_slot,
        "publishTime": pd.to_datetime("2026-01-02T12:30:00Z", utc=True),
        "generation": 1450.0,
        "settlementDate": "2026-01-02",
        "settlementPeriod": 25,
    }])
    mock_loader.actuals_by_date = {"2026-01-02": mock_loader.actuals_df}
    
    mock_loader.forecasts_by_slot = {
        target_slot: [
            {
                "publishTime": pd.to_datetime("2026-01-01T06:00:00Z", utc=True),
                "generation": 1200.0,
                "lead_hours": 30.0,
            },
            {
                "publishTime": pd.to_datetime("2026-01-01T08:30:00Z", utc=True),
                "generation": 1500.0,
                "lead_hours": 27.5,
            },
            {
                "publishTime": pd.to_datetime("2026-01-01T09:30:00Z", utc=True),
                "generation": 2200.0,
                "lead_hours": 26.5,
            },
            {
                "publishTime": pd.to_datetime("2026-01-02T11:00:00Z", utc=True),
                "generation": 2500.0,
                "lead_hours": 1.0,
            },
        ]
    }

    res = align_forecasts_for_day("2026-01-02", "09:00", days_before=1, loader=mock_loader)
    slot_res = res["slots"][0]

    # Must select Vintage 2 (1500 MW, 2026-01-01T08:30:00Z)
    assert slot_res["forecast_mw"] == 1500.0
    assert slot_res["publish_time"] == "2026-01-01T08:30:00Z"
    # Actual was 1450.0 -> error = 1500.0 - 1450.0 = 50.0 MW
    assert slot_res["error_mw"] == 50.0


def test_alignment_returns_missing_when_no_forecast_before_cutoff():
    """Verify that if all forecasts were published after cutoff, the slot is marked as missing (null)."""
    target_slot = pd.to_datetime("2026-01-02T12:00:00Z", utc=True)
    mock_loader = DataLoader.__new__(DataLoader)
    mock_loader.available_delivery_dates = ["2026-01-02"]
    
    mock_loader.actuals_df = pd.DataFrame([{
        "startTime": target_slot,
        "publishTime": pd.to_datetime("2026-01-02T12:30:00Z", utc=True),
        "generation": 1450.0,
        "settlementDate": "2026-01-02",
        "settlementPeriod": 25,
    }])
    mock_loader.actuals_by_date = {"2026-01-02": mock_loader.actuals_df}
    
    # Only post-cutoff forecasts
    mock_loader.forecasts_by_slot = {
        target_slot: [
            {
                "publishTime": pd.to_datetime("2026-01-01T10:00:00Z", utc=True),
                "generation": 2000.0,
                "lead_hours": 26.0,
            }
        ]
    }

    res = align_forecasts_for_day("2026-01-02", "09:00", days_before=1, loader=mock_loader)
    slot_res = res["slots"][0]

    assert slot_res["forecast_mw"] is None
    assert slot_res["publish_time"] is None
    assert slot_res["error_mw"] is None
    assert res["missing_forecasts_count"] == 1
    assert res["available_forecasts_count"] == 0


def test_deduplication_logic():
    """Verify deduplication rules:
    - Actuals: per startTime, keep latest publishTime.
    - Forecasts: unique per (startTime, publishTime).
    """
    t1 = "2026-01-02T00:00:00Z"
    df_actuals = pd.DataFrame([
        {"startTime": t1, "publishTime": "2026-01-02T00:30:00Z", "generation": 100},
        {"startTime": t1, "publishTime": "2026-01-02T01:00:00Z", "generation": 120},
    ])
    df_actuals["startTime"] = pd.to_datetime(df_actuals["startTime"], utc=True)
    df_actuals["publishTime"] = pd.to_datetime(df_actuals["publishTime"], utc=True)
    dedup_act = df_actuals.sort_values(by=["startTime", "publishTime"]).drop_duplicates(subset=["startTime"], keep="last")
    assert len(dedup_act) == 1
    assert dedup_act.iloc[0]["generation"] == 120

    df_forecasts = pd.DataFrame([
        {"startTime": t1, "publishTime": "2026-01-01T08:00:00Z", "generation": 110},
        {"startTime": t1, "publishTime": "2026-01-01T08:00:00Z", "generation": 110},
    ])
    dedup_fc = df_forecasts.drop_duplicates(subset=["startTime", "publishTime"])
    assert len(dedup_fc) == 1
