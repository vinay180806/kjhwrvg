"""Unit tests for metric functions and lead-time bucketing."""

import pytest
import numpy as np
from app.metrics import (
    compute_error,
    compute_mae,
    compute_rmse,
    compute_bias,
    compute_mape,
    compute_normalized_mae,
    compute_percentiles,
    compute_all_metrics,
    assign_lead_time_bucket,
)
from app.config import LEAD_TIME_BUCKETS


def test_compute_error_sign_convention():
    """Verify sign convention: error = forecast - actual (MW).
    Positive = over-forecast (forecast > actual).
    Negative = under-forecast (forecast < actual).
    """
    assert compute_error(100.0, 80.0) == 20.0
    assert compute_error(80.0, 100.0) == -20.0
    assert compute_error(50.0, 50.0) == 0.0


def test_hand_computed_metrics():
    """Test metrics on a small hand-computed example:
    Forecasts: [100, 200, 150, 0]
    Actuals:   [ 80, 220, 150, 50]
    Errors:    [ 20, -20,   0, -50]
    Absolute:  [ 20,  20,   0,  50]
    
    MAE  = (20 + 20 + 0 + 50) / 4 = 90 / 4 = 22.5
    RMSE = sqrt((400 + 400 + 0 + 2500) / 4) = sqrt(3300 / 4) = sqrt(825) ≈ 28.7228
    Bias = (20 - 20 + 0 - 50) / 4 = -50 / 4 = -12.5
    Mean actual = (80 + 220 + 150 + 50) / 4 = 125.0
    Normalized MAE = 22.5 / 125.0 = 0.18
    MAPE:
      Actuals > 0 for all 4 items:
      Pct errors: [20/80=0.25, 20/220=0.090909..., 0/150=0, 50/50=1.0]
      Mean = (0.25 + 0.090909... + 0.0 + 1.0) / 4 = 1.340909... / 4 ≈ 0.335227... -> 33.52%
    """
    forecasts = [100.0, 200.0, 150.0, 0.0]
    actuals = [80.0, 220.0, 150.0, 50.0]
    errors = [20.0, -20.0, 0.0, -50.0]

    mae = compute_mae(errors)
    assert mae == pytest.approx(22.5, abs=1e-4)

    rmse = compute_rmse(errors)
    assert rmse == pytest.approx(np.sqrt(825.0), abs=1e-4)

    bias = compute_bias(errors)
    assert bias == pytest.approx(-12.5, abs=1e-4)

    nmae = compute_normalized_mae(mae, actuals)
    assert nmae == pytest.approx(0.18, abs=1e-4)

    mape = compute_mape(forecasts, actuals)
    expected_mape = ((20/80 + 20/220 + 0/150 + 50/50) / 4) * 100.0
    assert mape == pytest.approx(expected_mape, abs=1e-4)


def test_mape_zeros_excluded():
    """Verify slots with actual == 0 are excluded from MAPE calculation to prevent division by zero."""
    forecasts = [100.0, 50.0]
    actuals = [50.0, 0.0]  # second has actual == 0
    # Should only evaluate the first pair: abs(100 - 50) / 50 = 50 / 50 = 100%
    mape = compute_mape(forecasts, actuals)
    assert mape == pytest.approx(100.0, abs=1e-4)

    # If all actuals are 0, returns None
    assert compute_mape([10.0, 20.0], [0.0, 0.0]) is None


def test_percentiles_calculation():
    """Verify percentiles calculation on known distribution."""
    # 0 to 100 inclusive (101 values)
    values = list(range(101))
    pcts = compute_percentiles(values, [50, 90, 95])
    assert pcts[50] == pytest.approx(50.0, abs=1e-4)
    assert pcts[90] == pytest.approx(90.0, abs=1e-4)
    assert pcts[95] == pytest.approx(95.0, abs=1e-4)


def test_lead_time_bucketing_boundaries():
    """Test boundary rule for lead time bucketing:
    Half-open interval: [low, high) where low <= lead_hours < high.
    Buckets:
      (0.0, 6.0, '0-6h')
      (6.0, 12.0, '6-12h')
      (12.0, 24.0, '12-24h')
      (24.0, 36.0, '24-36h')
      (36.0, 48.0, '36-48h')
      (48.0, None, '48h+')
    """
    # Negative lead time dropped
    assert assign_lead_time_bucket(-0.5, LEAD_TIME_BUCKETS) is None

    # Exactly 0.0h lands in '0-6h'
    assert assign_lead_time_bucket(0.0, LEAD_TIME_BUCKETS) == "0-6h"
    assert assign_lead_time_bucket(5.99, LEAD_TIME_BUCKETS) == "0-6h"

    # Exactly 6.0h lands in '6-12h' (not '0-6h')
    assert assign_lead_time_bucket(6.0, LEAD_TIME_BUCKETS) == "6-12h"
    assert assign_lead_time_bucket(11.99, LEAD_TIME_BUCKETS) == "6-12h"

    # Exactly 12.0h lands in '12-24h'
    assert assign_lead_time_bucket(12.0, LEAD_TIME_BUCKETS) == "12-24h"

    # Exactly 24.0h lands in '24-36h'
    assert assign_lead_time_bucket(24.0, LEAD_TIME_BUCKETS) == "24-36h"

    # Exactly 36.0h lands in '36-48h'
    assert assign_lead_time_bucket(36.0, LEAD_TIME_BUCKETS) == "36-48h"

    # Exactly 48.0h lands in '48h+'
    assert assign_lead_time_bucket(48.0, LEAD_TIME_BUCKETS) == "48h+"
    assert assign_lead_time_bucket(72.5, LEAD_TIME_BUCKETS) == "48h+"
