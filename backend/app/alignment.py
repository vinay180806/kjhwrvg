"""Fast, indexed alignment logic for cutoff-aligned day-ahead forecasts."""

from __future__ import annotations

from datetime import date, datetime, time, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import pandas as pd

from app.config import DEFAULT_CUTOFF_TIME, DEFAULT_DAYS_BEFORE, LONDON_TZ
from app.data_loader import DataLoader, get_data_loader
from app.metrics import compute_error


def parse_cutoff_datetime(
    delivery_date_str: str,
    cutoff_time_str: str = DEFAULT_CUTOFF_TIME,
    days_before: int = DEFAULT_DAYS_BEFORE,
) -> datetime:
    """Compute the cutoff datetime in Europe/London timezone, then return as timezone-aware datetime.
    
    For delivery day D (London local date) and days_before (e.g. 1):
    Decision day = D - days_before
    Cutoff timestamp = Decision day at cutoff_time in Europe/London.
    """
    delivery_dt = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
    decision_date = delivery_dt - timedelta(days=days_before)
    
    parts = cutoff_time_str.strip().split(":")
    hour = int(parts[0])
    minute = int(parts[1]) if len(parts) > 1 else 0

    cutoff_local = datetime(
        decision_date.year,
        decision_date.month,
        decision_date.day,
        hour,
        minute,
        0,
        tzinfo=LONDON_TZ,
    )
    return cutoff_local


def align_forecasts_for_day(
    delivery_date_str: str,
    cutoff_time_str: str = DEFAULT_CUTOFF_TIME,
    days_before: int = DEFAULT_DAYS_BEFORE,
    p10_res: Optional[float] = None,
    p90_res: Optional[float] = None,
    loader: Optional[DataLoader] = None,
) -> Dict[str, Any]:
    """Produce the cutoff-aligned 48 slots for a single delivery day using pre-indexed data."""
    if loader is None:
        loader = get_data_loader()

    cutoff_dt = parse_cutoff_datetime(delivery_date_str, cutoff_time_str, days_before)
    cutoff_utc = cutoff_dt.astimezone(timezone.utc)

    # Actuals for delivery_date
    actuals_day = loader.get_actuals_for_day(delivery_date_str)
    
    if not actuals_day.empty:
        slot_times = actuals_day["startTime"].tolist()
        actual_map = {
            row["startTime"]: (row["generation"], row["settlementPeriod"])
            for _, row in actuals_day.iterrows()
        }
    else:
        day_date = datetime.strptime(delivery_date_str, "%Y-%m-%d").date()
        start_day_london = datetime(day_date.year, day_date.month, day_date.day, 0, 0, tzinfo=LONDON_TZ)
        start_day_utc = start_day_london.astimezone(timezone.utc)
        slot_times = [pd.to_datetime(start_day_utc + timedelta(minutes=30 * i), utc=True) for i in range(48)]
        actual_map = {}

    slots: List[Dict[str, Any]] = []
    available_forecasts = 0
    missing_forecasts = 0

    for slot_time in slot_times:
        slot_iso = slot_time.strftime("%Y-%m-%dT%H:%M:%SZ")
        actual_val, period = actual_map.get(slot_time, (None, None))

        # Query candidates using fast pre-indexed list (sorted by publishTime)
        slot_vintages = loader.get_forecasts_for_slot(slot_time)
        candidates = [v for v in slot_vintages if v["publishTime"] <= cutoff_utc]

        if candidates:
            # Last candidate is the latest publishTime <= cutoff
            best = candidates[-1]
            fc_val = float(best["generation"])
            pub_time = best["publishTime"].strftime("%Y-%m-%dT%H:%M:%SZ")
            lead_h = round(float(best["lead_hours"]), 2)
            available_forecasts += 1

            err = compute_error(fc_val, float(actual_val)) if actual_val is not None else None
            lower_b = max(0.0, round(fc_val + p10_res, 2)) if p10_res is not None else None
            upper_b = round(fc_val + p90_res, 2) if p90_res is not None else None
        else:
            fc_val = None
            pub_time = None
            lead_h = None
            err = None
            lower_b = None
            upper_b = None
            missing_forecasts += 1

        slots.append({
            "start_time": slot_iso,
            "settlement_period": int(period) if period is not None else None,
            "forecast_mw": fc_val,
            "actual_mw": float(actual_val) if actual_val is not None else None,
            "publish_time": pub_time,
            "lead_hours": lead_h,
            "error_mw": round(err, 2) if err is not None else None,
            "lower_band_mw": lower_b,
            "upper_band_mw": upper_b,
        })

    return {
        "delivery_date": delivery_date_str,
        "cutoff_time": cutoff_time_str,
        "days_before": days_before,
        "cutoff_datetime_iso": cutoff_dt.isoformat(),
        "total_slots": len(slots),
        "available_forecasts_count": available_forecasts,
        "missing_forecasts_count": missing_forecasts,
        "slots": slots,
    }


def align_forecasts_range(
    start_date: str,
    end_date: str,
    cutoff_time_str: str = DEFAULT_CUTOFF_TIME,
    days_before: int = DEFAULT_DAYS_BEFORE,
    loader: Optional[DataLoader] = None,
) -> Tuple[List[float], List[float], List[Dict[str, Any]]]:
    """Align forecasts for all delivery days in range."""
    if loader is None:
        loader = get_data_loader()

    valid_dates = [d for d in loader.available_delivery_dates if start_date <= d <= end_date]
    
    all_paired_fc: List[float] = []
    all_paired_act: List[float] = []
    all_slots: List[Dict[str, Any]] = []

    for d in valid_dates:
        day_res = align_forecasts_for_day(d, cutoff_time_str, days_before, loader=loader)
        for s in day_res["slots"]:
            all_slots.append(s)
            if s["forecast_mw"] is not None and s["actual_mw"] is not None:
                all_paired_fc.append(s["forecast_mw"])
                all_paired_act.append(s["actual_mw"])

    return all_paired_fc, all_paired_act, all_slots
