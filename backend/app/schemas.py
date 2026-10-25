"""Pydantic schemas for API request and response data."""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    actuals_count: int
    forecasts_count: int
    actuals_min_time: Optional[str]
    actuals_max_time: Optional[str]
    forecasts_min_time: Optional[str]
    forecasts_max_time: Optional[str]


class MetaResponse(BaseModel):
    available_delivery_dates: List[str]
    min_delivery_date: str
    max_delivery_date: str
    min_decision_date: str
    max_decision_date: str
    default_cutoff_time: str
    default_days_before: int
    timezone: str
    lead_time_buckets: List[str]
    error_convention: str = Field(
        default="error = forecast - actual (MW). Positive value indicates over-forecast."
    )


class SlotForecast(BaseModel):
    start_time: str
    settlement_period: Optional[int] = None
    forecast_mw: Optional[float] = None
    actual_mw: Optional[float] = None
    publish_time: Optional[str] = None
    lead_hours: Optional[float] = None
    error_mw: Optional[float] = None  # forecast - actual
    lower_band_mw: Optional[float] = None  # P10 bound
    upper_band_mw: Optional[float] = None  # P90 bound


class DayForecastResponse(BaseModel):
    delivery_date: str
    cutoff_time: str
    days_before: int
    cutoff_datetime_iso: str
    total_slots: int
    available_forecasts_count: int
    missing_forecasts_count: int
    slots: List[SlotForecast]


class ActualRecord(BaseModel):
    start_time: str
    settlement_date: str
    settlement_period: int
    actual_mw: float


class MetricsSummary(BaseModel):
    count_used: int
    count_missing: int
    mae_mw: Optional[float]
    rmse_mw: Optional[float]
    bias_mw: Optional[float]
    normalized_mae: Optional[float]
    mape_percent: Optional[float]
    p50_abs_error_mw: Optional[float]
    p90_abs_error_mw: Optional[float]
    p95_abs_error_mw: Optional[float]
    p10_signed_error_mw: Optional[float]
    p90_signed_error_mw: Optional[float]


class OverallMetricsResponse(BaseModel):
    start_date: str
    end_date: str
    cutoff_time: str
    days_before: int
    metrics: MetricsSummary


class DayMetricItem(BaseModel):
    delivery_date: str
    metrics: MetricsSummary


class DaysMetricsResponse(BaseModel):
    start_date: str
    end_date: str
    cutoff_time: str
    days_before: int
    days: List[DayMetricItem]


class HourMetricItem(BaseModel):
    hour: int
    label: str  # e.g. "00:00 - 01:00"
    metrics: MetricsSummary


class HoursMetricsResponse(BaseModel):
    start_date: str
    end_date: str
    cutoff_time: str
    days_before: int
    hours: List[HourMetricItem]


class HorizonMetricItem(BaseModel):
    bucket: str
    min_hours: float
    max_hours: Optional[float]
    count: int
    mae_mw: Optional[float]
    rmse_mw: Optional[float]
    bias_mw: Optional[float]
    p90_abs_error_mw: Optional[float]


class HorizonMetricsResponse(BaseModel):
    start_date: str
    end_date: str
    total_samples: int
    buckets: List[HorizonMetricItem]
    takeaway: str


class VintageItem(BaseModel):
    publish_time: str
    generation_mw: float
    lead_hours: float
    is_used_at_cutoff: bool


class SlotVintagesResponse(BaseModel):
    delivery_date: str
    start_time: str
    actual_mw: Optional[float]
    cutoff_datetime_iso: str
    vintages: List[VintageItem]
