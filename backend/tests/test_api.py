"""API integration and smoke tests using FastAPI TestClient."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["actuals_count"] > 0
    assert data["forecasts_count"] > 0
    assert data["actuals_min_time"] is not None
    assert data["actuals_max_time"] is not None


def test_meta_endpoint():
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.json()
    assert "2026-01-02" in data["available_delivery_dates"]
    assert data["min_delivery_date"] == "2026-01-02"
    assert data["max_delivery_date"] == "2026-02-01"
    assert data["default_cutoff_time"] == "09:00"
    assert data["default_days_before"] == 1
    assert data["timezone"] == "Europe/London"
    assert len(data["lead_time_buckets"]) == 6


def test_forecast_latest_success():
    response = client.get("/api/forecast/latest?date=2026-01-02&cutoff_time=09:00&days_before=1")
    assert response.status_code == 200
    data = response.json()
    assert data["delivery_date"] == "2026-01-02"
    assert data["cutoff_time"] == "09:00"
    assert data["total_slots"] == 48
    assert len(data["slots"]) == 48
    # Inspect first slot
    first_slot = data["slots"][0]
    assert "start_time" in first_slot
    assert "forecast_mw" in first_slot
    assert "actual_mw" in first_slot
    assert "lower_band_mw" in first_slot
    assert "upper_band_mw" in first_slot


def test_forecast_latest_invalid_date():
    response = client.get("/api/forecast/latest?date=2025-01-01")
    assert response.status_code == 400
    assert "outside the available range" in response.json()["detail"]


def test_actuals_endpoint():
    response = client.get("/api/actuals?start_date=2026-01-02&end_date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 48
    assert data[0]["settlement_date"] == "2026-01-02"
    assert data[0]["actual_mw"] >= 0


def test_metrics_overall():
    response = client.get("/api/metrics?start_date=2026-01-02&end_date=2026-01-05&cutoff_time=09:00")
    assert response.status_code == 200
    data = response.json()
    m = data["metrics"]
    assert m["count_used"] > 0
    assert m["mae_mw"] is not None
    assert m["rmse_mw"] is not None
    assert m["bias_mw"] is not None
    assert m["p90_abs_error_mw"] is not None


def test_metrics_invalid_range():
    response = client.get("/api/metrics?start_date=2026-01-10&end_date=2026-01-05")
    assert response.status_code == 400
    assert "start_date must be <= end_date" in response.json()["detail"]


def test_metrics_by_day():
    response = client.get("/api/metrics/by-day?start_date=2026-01-02&end_date=2026-01-04")
    assert response.status_code == 200
    data = response.json()
    assert len(data["days"]) == 3
    assert data["days"][0]["delivery_date"] == "2026-01-02"
    assert data["days"][0]["metrics"]["count_used"] > 0
    assert data["days"][0]["metrics"]["count_missing"] >= 0


def test_metrics_by_hour():
    response = client.get("/api/metrics/by-hour?start_date=2026-01-02&end_date=2026-01-04")
    assert response.status_code == 200
    data = response.json()
    assert len(data["hours"]) == 24
    assert data["hours"][0]["hour"] == 0
    assert data["hours"][0]["metrics"]["count_used"] > 0


def test_metrics_by_horizon():
    response = client.get("/api/metrics/by-horizon?start_date=2026-01-02&end_date=2026-01-05")
    assert response.status_code == 200
    data = response.json()
    assert len(data["buckets"]) == 6
    assert data["total_samples"] > 0
    assert len(data["takeaway"]) > 0


def test_vintages_endpoint():
    response = client.get("/api/forecast/vintages?date=2026-01-02")
    assert response.status_code == 200
    data = response.json()
    assert data["delivery_date"] == "2026-01-02"
    assert len(data["vintages"]) > 0
    # There should be exactly one vintage marked as used at cutoff (if any was <= cutoff)
    used_vintages = [v for v in data["vintages"] if v["is_used_at_cutoff"]]
    assert len(used_vintages) <= 1
