export interface MetaData {
  available_delivery_dates: string[];
  min_delivery_date: string;
  max_delivery_date: string;
  min_decision_date: string;
  max_decision_date: string;
  default_cutoff_time: string;
  default_days_before: number;
  timezone: string;
  lead_time_buckets: string[];
  error_convention: string;
}

export interface SlotForecast {
  start_time: string;
  settlement_period?: number | null;
  forecast_mw?: number | null;
  actual_mw?: number | null;
  publish_time?: string | null;
  lead_hours?: number | null;
  error_mw?: number | null;
  lower_band_mw?: number | null;
  upper_band_mw?: number | null;
}

export interface DayForecastResponse {
  delivery_date: string;
  cutoff_time: string;
  days_before: number;
  cutoff_datetime_iso: string;
  total_slots: number;
  available_forecasts_count: number;
  missing_forecasts_count: number;
  slots: SlotForecast[];
}

export interface MetricsSummary {
  count_used: number;
  count_missing: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  normalized_mae: number | null;
  mape_percent: number | null;
  p50_abs_error_mw: number | null;
  p90_abs_error_mw: number | null;
  p95_abs_error_mw: number | null;
  p10_signed_error_mw: number | null;
  p90_signed_error_mw: number | null;
}

export interface OverallMetricsResponse {
  start_date: string;
  end_date: string;
  cutoff_time: string;
  days_before: number;
  metrics: MetricsSummary;
}

export interface DayMetricItem {
  delivery_date: string;
  metrics: MetricsSummary;
}

export interface DaysMetricsResponse {
  start_date: string;
  end_date: string;
  cutoff_time: string;
  days_before: number;
  days: DayMetricItem[];
}

export interface HourMetricItem {
  hour: number;
  label: string;
  metrics: MetricsSummary;
}

export interface HoursMetricsResponse {
  start_date: string;
  end_date: string;
  cutoff_time: string;
  days_before: number;
  hours: HourMetricItem[];
}

export interface HorizonMetricItem {
  bucket: string;
  min_hours: number;
  max_hours: number | null;
  count: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  p90_abs_error_mw: number | null;
}

export interface HorizonMetricsResponse {
  start_date: string;
  end_date: string;
  total_samples: number;
  buckets: HorizonMetricItem[];
  takeaway: string;
}

export interface VintageItem {
  publish_time: string;
  generation_mw: number;
  lead_hours: number;
  is_used_at_cutoff: boolean;
}

export interface SlotVintagesResponse {
  delivery_date: string;
  start_time: string;
  actual_mw: number | null;
  cutoff_datetime_iso: string;
  vintages: VintageItem[];
}
