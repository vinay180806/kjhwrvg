import {
  DayForecastResponse,
  DaysMetricsResponse,
  HorizonMetricsResponse,
  HoursMetricsResponse,
  MetaData,
  OverallMetricsResponse,
  SlotVintagesResponse,
} from './types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '') + '/api';

export async function fetchMeta(): Promise<MetaData> {
  const res = await fetch(`${API_BASE}/meta`);
  if (!res.ok) throw new Error(`Failed to load metadata: ${res.statusText}`);
  return res.json();
}

export async function fetchDayForecast(
  date: string,
  cutoffTime: string = '09:00',
  daysBefore: number = 1
): Promise<DayForecastResponse> {
  const params = new URLSearchParams({
    date,
    cutoff_time: cutoffTime,
    days_before: daysBefore.toString(),
  });
  const res = await fetch(`${API_BASE}/forecast/latest?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to load forecast for ${date}`);
  }
  return res.json();
}

export async function fetchOverallMetrics(
  startDate: string,
  endDate: string,
  cutoffTime: string = '09:00',
  daysBefore: number = 1
): Promise<OverallMetricsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
    days_before: daysBefore.toString(),
  });
  const res = await fetch(`${API_BASE}/metrics?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load overall metrics');
  }
  return res.json();
}

export async function fetchDaysMetrics(
  startDate: string,
  endDate: string,
  cutoffTime: string = '09:00',
  daysBefore: number = 1
): Promise<DaysMetricsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
    days_before: daysBefore.toString(),
  });
  const res = await fetch(`${API_BASE}/metrics/by-day?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load daily metrics');
  }
  return res.json();
}

export async function fetchHoursMetrics(
  startDate: string,
  endDate: string,
  cutoffTime: string = '09:00',
  daysBefore: number = 1
): Promise<HoursMetricsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    cutoff_time: cutoffTime,
    days_before: daysBefore.toString(),
  });
  const res = await fetch(`${API_BASE}/metrics/by-hour?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load hourly metrics');
  }
  return res.json();
}

export async function fetchHorizonMetrics(
  startDate: string,
  endDate: string
): Promise<HorizonMetricsResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  const res = await fetch(`${API_BASE}/metrics/by-horizon?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load horizon metrics');
  }
  return res.json();
}

export async function fetchSlotVintages(
  date: string,
  slot?: string,
  cutoffTime: string = '09:00',
  daysBefore: number = 1
): Promise<SlotVintagesResponse> {
  const params = new URLSearchParams({
    date,
    cutoff_time: cutoffTime,
    days_before: daysBefore.toString(),
  });
  if (slot) params.append('slot', slot);
  const res = await fetch(`${API_BASE}/forecast/vintages?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to load forecast vintages');
  }
  return res.json();
}
