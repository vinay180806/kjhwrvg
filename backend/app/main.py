"""FastAPI Application for UK Wind Generation Day-Ahead Decision Support."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.alignment import (
    align_forecasts_for_day,
    align_forecasts_range,
    parse_cutoff_datetime,
)
from app.config import (
    DEFAULT_CUTOFF_TIME,
    DEFAULT_DAYS_BEFORE,
    LEAD_TIME_BUCKETS,
    LONDON_TZ,
    MAX_DECISION_DATE,
    MAX_DELIVERY_DATE,
    MIN_DECISION_DATE,
    MIN_DELIVERY_DATE,
)
from app.data_loader import get_data_loader
from app.metrics import (
    assign_lead_time_bucket,
    compute_all_metrics,
    compute_error,
)
from app.schemas import (
    ActualRecord,
    DayForecastResponse,
    DayMetricItem,
    DaysMetricsResponse,
    HealthResponse,
    HorizonMetricItem,
    HorizonMetricsResponse,
    HourMetricItem,
    HoursMetricsResponse,
    MetaResponse,
    MetricsSummary,
    OverallMetricsResponse,
    SlotVintagesResponse,
    VintageItem,
)

logger = logging.getLogger("main")

app = FastAPI(
    title="GB Wind Day-Ahead Decision Support API",
    description=(
        "Decision support API for UK day-ahead electricity procurement. "
        "Provides cutoff-aligned wind forecast visibility, quantitative accuracy evaluation, "
        "and empirical uncertainty bounds based on Elexon BMRS national data."
    ),
    version="1.0.0",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Return API health status and data coverage stats."""
    loader = get_data_loader()
    act = loader.actuals_df
    fc = loader.forecasts_df

    act_min = act["startTime"].min().strftime("%Y-%m-%dT%H:%M:%SZ") if not act.empty else None
    act_max = act["startTime"].max().strftime("%Y-%m-%dT%H:%M:%SZ") if not act.empty else None
    fc_min = fc["startTime"].min().strftime("%Y-%m-%dT%H:%M:%SZ") if not fc.empty else None
    fc_max = fc["startTime"].max().strftime("%Y-%m-%dT%H:%M:%SZ") if not fc.empty else None

    return HealthResponse(
        status="healthy",
        actuals_count=len(act),
        forecasts_count=len(fc),
        actuals_min_time=act_min,
        actuals_max_time=act_max,
        forecasts_min_time=fc_min,
        forecasts_max_time=fc_max,
    )


@app.get("/api/meta", response_model=MetaResponse)
def get_metadata() -> MetaResponse:
    """Return application metadata, supported dates, and default parameters."""
    loader = get_data_loader()
    return MetaResponse(
        available_delivery_dates=loader.available_delivery_dates,
        min_delivery_date=MIN_DELIVERY_DATE,
        max_delivery_date=MAX_DELIVERY_DATE,
        min_decision_date=MIN_DECISION_DATE,
        max_decision_date=MAX_DECISION_DATE,
        default_cutoff_time=DEFAULT_CUTOFF_TIME,
        default_days_before=DEFAULT_DAYS_BEFORE,
        timezone="Europe/London",
        lead_time_buckets=[b[2] for b in LEAD_TIME_BUCKETS],
    )


@app.get("/api/forecast/latest", response_model=DayForecastResponse)
def get_latest_forecast(
    date: str = Query(..., description="Delivery date (YYYY-MM-DD in Europe/London)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, pattern=r"^\d{2}:\d{2}$", description="Cutoff time HH:MM"),
    days_before: int = Query(DEFAULT_DAYS_BEFORE, ge=0, le=7, description="Decision days before delivery"),
) -> DayForecastResponse:
    """Return the cutoff-aligned 48 slots for the chosen delivery day."""
    loader = get_data_loader()
    if date not in loader.available_delivery_dates:
        raise HTTPException(
            status_code=400,
            detail=f"Delivery date {date} is outside the available range ({MIN_DELIVERY_DATE} to {MAX_DELIVERY_DATE}).",
        )

    # First compute empirical residuals across the full dataset to establish uncertainty bounds
    paired_fc, paired_act, _ = align_forecasts_range(
        MIN_DELIVERY_DATE, MAX_DELIVERY_DATE, cutoff_time, days_before, loader=loader
    )
    if paired_fc and paired_act:
        residuals = [a - f for f, a in zip(paired_fc, paired_act)]
        p10 = float(np.percentile(residuals, 10))
        p90 = float(np.percentile(residuals, 90))
    else:
        p10, p90 = None, None

    result = align_forecasts_for_day(
        date, cutoff_time, days_before, p10_res=p10, p90_res=p90, loader=loader
    )
    return DayForecastResponse(**result)


@app.get("/api/actuals", response_model=List[ActualRecord])
def get_actuals(
    start_date: Optional[str] = Query(None, description="Start delivery date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End delivery date (YYYY-MM-DD)"),
) -> List[ActualRecord]:
    """Return actual wind generation records."""
    loader = get_data_loader()
    df = loader.get_actuals(start_date=start_date, end_date=end_date)
    records: List[ActualRecord] = []
    for _, row in df.iterrows():
        records.append(
            ActualRecord(
                start_time=row["startTime"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                settlement_date=str(row["settlementDate"]),
                settlement_period=int(row["settlementPeriod"]),
                actual_mw=float(row["generation"]),
            )
        )
    return records


@app.get("/api/metrics", response_model=OverallMetricsResponse)
def get_overall_metrics(
    start_date: str = Query(MIN_DELIVERY_DATE, description="Start delivery date (YYYY-MM-DD)"),
    end_date: str = Query(MAX_DELIVERY_DATE, description="End delivery date (YYYY-MM-DD)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, pattern=r"^\d{2}:\d{2}$"),
    days_before: int = Query(DEFAULT_DAYS_BEFORE, ge=0, le=7),
) -> OverallMetricsResponse:
    """Return overall accuracy metrics over the selected date range."""
    loader = get_data_loader()
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date.")

    paired_fc, paired_act, all_slots = align_forecasts_range(
        start_date, end_date, cutoff_time, days_before, loader=loader
    )

    metrics_dict = compute_all_metrics(paired_fc, paired_act)
    count_missing = sum(1 for s in all_slots if s["forecast_mw"] is None or s["actual_mw"] is None)

    summary = MetricsSummary(
        count_used=len(paired_fc),
        count_missing=count_missing,
        **metrics_dict,
    )

    return OverallMetricsResponse(
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        days_before=days_before,
        metrics=summary,
    )


@app.get("/api/metrics/by-day", response_model=DaysMetricsResponse)
def get_metrics_by_day(
    start_date: str = Query(MIN_DELIVERY_DATE),
    end_date: str = Query(MAX_DELIVERY_DATE),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, pattern=r"^\d{2}:\d{2}$"),
    days_before: int = Query(DEFAULT_DAYS_BEFORE, ge=0, le=7),
) -> DaysMetricsResponse:
    """Return accuracy metrics grouped by delivery day."""
    loader = get_data_loader()
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date.")

    valid_dates = [d for d in loader.available_delivery_dates if start_date <= d <= end_date]
    day_items: List[DayMetricItem] = []

    for d in valid_dates:
        day_res = align_forecasts_for_day(d, cutoff_time, days_before, loader=loader)
        fc_list = [s["forecast_mw"] for s in day_res["slots"] if s["forecast_mw"] is not None and s["actual_mw"] is not None]
        act_list = [s["actual_mw"] for s in day_res["slots"] if s["forecast_mw"] is not None and s["actual_mw"] is not None]
        m = compute_all_metrics(fc_list, act_list)
        missing = day_res["missing_forecasts_count"]
        summary = MetricsSummary(
            count_used=len(fc_list),
            count_missing=missing,
            **m,
        )
        day_items.append(DayMetricItem(delivery_date=d, metrics=summary))

    return DaysMetricsResponse(
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        days_before=days_before,
        days=day_items,
    )


@app.get("/api/metrics/by-hour", response_model=HoursMetricsResponse)
def get_metrics_by_hour(
    start_date: str = Query(MIN_DELIVERY_DATE),
    end_date: str = Query(MAX_DELIVERY_DATE),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, pattern=r"^\d{2}:\d{2}$"),
    days_before: int = Query(DEFAULT_DAYS_BEFORE, ge=0, le=7),
) -> HoursMetricsResponse:
    """Return accuracy metrics grouped by hour of the day (0 to 23)."""
    loader = get_data_loader()
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date.")

    _, _, all_slots = align_forecasts_range(start_date, end_date, cutoff_time, days_before, loader=loader)
    
    # Group slots by hour of day (in London time)
    hour_buckets: Dict[int, Dict[str, List[float]]] = {
        h: {"fc": [], "act": [], "missing": 0} for h in range(24)
    }

    for s in all_slots:
        dt = datetime.fromisoformat(s["start_time"].replace("Z", "+00:00")).astimezone(LONDON_TZ)
        h = dt.hour
        if s["forecast_mw"] is not None and s["actual_mw"] is not None:
            hour_buckets[h]["fc"].append(s["forecast_mw"])
            hour_buckets[h]["act"].append(s["actual_mw"])
        else:
            hour_buckets[h]["missing"] += 1

    hour_items: List[HourMetricItem] = []
    for h in range(24):
        fc_list = hour_buckets[h]["fc"]
        act_list = hour_buckets[h]["act"]
        m = compute_all_metrics(fc_list, act_list)
        summary = MetricsSummary(
            count_used=len(fc_list),
            count_missing=hour_buckets[h]["missing"],
            **m,
        )
        hour_items.append(
            HourMetricItem(
                hour=h,
                label=f"{h:02d}:00 - {(h+1)%24:02d}:00",
                metrics=summary,
            )
        )

    return HoursMetricsResponse(
        start_date=start_date,
        end_date=end_date,
        cutoff_time=cutoff_time,
        days_before=days_before,
        hours=hour_items,
    )


@app.get("/api/metrics/by-horizon", response_model=HorizonMetricsResponse)
def get_metrics_by_horizon(
    start_date: str = Query(MIN_DELIVERY_DATE),
    end_date: str = Query(MAX_DELIVERY_DATE),
) -> HorizonMetricsResponse:
    """Horizon analysis: Evaluate forecast accuracy vs lead time across all published vintages.
    
    Uses all available forecast vintages, not just cutoff-selected forecasts.
    Lead time (hours) = startTime - publishTime. Negative lead times are discarded.
    """
    loader = get_data_loader()
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="start_date must be <= end_date.")

    # Get actuals in range mapped by startTime
    actuals_df = loader.get_actuals(start_date=start_date, end_date=end_date)
    if actuals_df.empty:
        raise HTTPException(status_code=404, detail="No actuals available for the selected range.")

    actual_map = dict(zip(actuals_df["startTime"], actuals_df["generation"]))
    target_start_times = set(actual_map.keys())

    # Get all forecasts whose startTime is in target_start_times
    fc_df = loader.forecasts_df
    matched_fc = fc_df[fc_df["startTime"].isin(target_start_times)].copy()

    # Drop negative lead times
    matched_fc = matched_fc[matched_fc["lead_hours"] >= 0.0].copy()
    matched_fc["actual_generation"] = matched_fc["startTime"].map(actual_map)
    matched_fc = matched_fc.dropna(subset=["actual_generation", "generation"])

    # Assign buckets
    matched_fc["bucket"] = matched_fc["lead_hours"].apply(
        lambda lh: assign_lead_time_bucket(lh, LEAD_TIME_BUCKETS)
    )

    bucket_results: List[HorizonMetricItem] = []
    for low, high, label in LEAD_TIME_BUCKETS:
        b_df = matched_fc[matched_fc["bucket"] == label]
        count = len(b_df)
        if count > 0:
            fc_vals = b_df["generation"].tolist()
            act_vals = b_df["actual_generation"].tolist()
            errs = [f - a for f, a in zip(fc_vals, act_vals)]
            mae = float(np.mean(np.abs(errs)))
            rmse = float(np.sqrt(np.mean(np.square(errs))))
            bias = float(np.mean(errs))
            p90 = float(np.percentile(np.abs(errs), 90))
        else:
            mae, rmse, bias, p90 = None, None, None, None

        bucket_results.append(
            HorizonMetricItem(
                bucket=label,
                min_hours=low,
                max_hours=high,
                count=count,
                mae_mw=round(mae, 2) if mae is not None else None,
                rmse_mw=round(rmse, 2) if rmse is not None else None,
                bias_mw=round(bias, 2) if bias is not None else None,
                p90_abs_error_mw=round(p90, 2) if p90 is not None else None,
            )
        )

    # Automated takeaway
    valid_buckets = [b for b in bucket_results if b.mae_mw is not None]
    if len(valid_buckets) >= 2:
        first_b = valid_buckets[0]
        last_b = valid_buckets[-1]
        pct_increase = ((last_b.mae_mw - first_b.mae_mw) / first_b.mae_mw) * 100.0 if first_b.mae_mw else 0
        takeaway = (
            f"Forecast error increases significantly with lead time: MAE expands from "
            f"{first_b.mae_mw:.0f} MW at {first_b.bucket} to {last_b.mae_mw:.0f} MW at {last_b.bucket} "
            f"(+{pct_increase:.1f}% error increase), validating that procurement decisions should be made as close to gate closure as possible."
        )
    else:
        takeaway = "Error increases progressively as lead time expands across vintages."

    return HorizonMetricsResponse(
        start_date=start_date,
        end_date=end_date,
        total_samples=len(matched_fc),
        buckets=bucket_results,
        takeaway=takeaway,
    )


@app.get("/api/forecast/vintages", response_model=SlotVintagesResponse)
def get_slot_vintages(
    date: str = Query(..., description="Delivery date (YYYY-MM-DD)"),
    slot: Optional[str] = Query(None, description="ISO timestamp of target half-hour slot (e.g. 2026-01-02T12:00:00Z)"),
    cutoff_time: str = Query(DEFAULT_CUTOFF_TIME, pattern=r"^\d{2}:\d{2}$"),
    days_before: int = Query(DEFAULT_DAYS_BEFORE, ge=0, le=7),
) -> SlotVintagesResponse:
    """Return historical forecast vintages for a specific target half-hour slot."""
    loader = get_data_loader()
    cutoff_dt = parse_cutoff_datetime(date, cutoff_time, days_before)
    cutoff_utc = cutoff_dt.astimezone(timezone.utc)

    # Determine slot timestamp
    actuals_day = loader.get_actuals(start_date=date, end_date=date)
    if actuals_day.empty:
        raise HTTPException(status_code=404, detail=f"No data available for delivery date {date}.")

    if slot is None:
        target_slot_dt = actuals_day.iloc[0]["startTime"]
        target_slot_iso = target_slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    else:
        target_slot_dt = pd.to_datetime(slot, utc=True)
        target_slot_iso = target_slot_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Get actual value
    act_match = actuals_day[actuals_day["startTime"] == target_slot_dt]
    act_val = float(act_match.iloc[0]["generation"]) if not act_match.empty else None

    # Query all vintages for this slot
    fc_df = loader.forecasts_df
    vintages_match = fc_df[fc_df["startTime"] == target_slot_dt].sort_values(by="publishTime")

    # Find the one used at cutoff: latest publishTime <= cutoff_utc
    cutoff_candidates = vintages_match[vintages_match["publishTime"] <= cutoff_utc]
    used_publish_time = cutoff_candidates.iloc[-1]["publishTime"] if not cutoff_candidates.empty else None

    items: List[VintageItem] = []
    for _, row in vintages_match.iterrows():
        is_used = (used_publish_time is not None) and (row["publishTime"] == used_publish_time)
        items.append(
            VintageItem(
                publish_time=row["publishTime"].strftime("%Y-%m-%dT%H:%M:%SZ"),
                generation_mw=float(row["generation"]),
                lead_hours=round(float(row["lead_hours"]), 2),
                is_used_at_cutoff=bool(is_used),
            )
        )

    return SlotVintagesResponse(
        delivery_date=date,
        start_time=target_slot_iso,
        actual_mw=act_val,
        cutoff_datetime_iso=cutoff_dt.isoformat(),
        vintages=items,
    )
