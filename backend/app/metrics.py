"""Pure metric functions for forecast accuracy evaluation."""

from __future__ import annotations

import math
from typing import Dict, List, Optional, Sequence, Tuple
import numpy as np


def compute_error(forecast: float, actual: float) -> float:
    """Compute forecast error.
    
    Convention: error = forecast - actual (MW)
    A positive error means over-forecast (model expected more wind than was generated).
    """
    return forecast - actual


def compute_mae(errors: Sequence[float]) -> Optional[float]:
    """Mean Absolute Error (MW): mean(|forecast - actual|)."""
    if not errors:
        return None
    return float(np.mean(np.abs(errors)))


def compute_rmse(errors: Sequence[float]) -> Optional[float]:
    """Root Mean Squared Error (MW): sqrt(mean((forecast - actual)^2))."""
    if not errors:
        return None
    return float(np.sqrt(np.mean(np.square(errors))))


def compute_bias(errors: Sequence[float]) -> Optional[float]:
    """Mean Signed Error (MW): mean(forecast - actual). Positive = over-forecast."""
    if not errors:
        return None
    return float(np.mean(errors))


def compute_mape(forecasts: Sequence[float], actuals: Sequence[float]) -> Optional[float]:
    """Mean Absolute Percentage Error (%).
    
    Calculated as mean(|forecast - actual| / actual) * 100 over slots where actual > 0.
    Slots with actual == 0 are strictly excluded to avoid division by zero.
    """
    pairs = [(f, a) for f, a in zip(forecasts, actuals) if a > 0]
    if not pairs:
        return None
    pct_errors = [abs(f - a) / a for f, a in pairs]
    return float(np.mean(pct_errors) * 100.0)


def compute_normalized_mae(mae: Optional[float], actuals: Sequence[float]) -> Optional[float]:
    """Normalized MAE: MAE / mean(actual). Returns None if mean(actual) <= 0 or mae is None."""
    if mae is None or not actuals:
        return None
    mean_actual = float(np.mean(actuals))
    if mean_actual <= 0:
        return None
    return float(mae / mean_actual)


def compute_percentiles(values: Sequence[float], percentiles: Sequence[float]) -> Dict[float, Optional[float]]:
    """Compute empirical percentiles for a sequence of values."""
    if not values:
        return {p: None for p in percentiles}
    arr = np.array(values)
    return {p: float(np.percentile(arr, p)) for p in percentiles}


def compute_all_metrics(
    forecasts: Sequence[float],
    actuals: Sequence[float],
) -> Dict[str, Optional[float]]:
    """Compute comprehensive accuracy metrics over paired forecast and actual values."""
    if len(forecasts) != len(actuals) or len(forecasts) == 0:
        return {
            "mae_mw": None,
            "rmse_mw": None,
            "bias_mw": None,
            "normalized_mae": None,
            "mape_percent": None,
            "p50_abs_error_mw": None,
            "p90_abs_error_mw": None,
            "p95_abs_error_mw": None,
            "p10_signed_error_mw": None,
            "p90_signed_error_mw": None,
        }

    errors = [compute_error(f, a) for f, a in zip(forecasts, actuals)]
    abs_errors = [abs(e) for e in errors]
    
    # Signed residual for bands: (actual - forecast)
    signed_residuals = [a - f for f, a in zip(forecasts, actuals)]

    mae = compute_mae(errors)
    rmse = compute_rmse(errors)
    bias = compute_bias(errors)
    mape = compute_mape(forecasts, actuals)
    nmae = compute_normalized_mae(mae, actuals)

    abs_pcts = compute_percentiles(abs_errors, [50, 90, 95])
    res_pcts = compute_percentiles(signed_residuals, [10, 90])

    return {
        "mae_mw": round(mae, 2) if mae is not None else None,
        "rmse_mw": round(rmse, 2) if rmse is not None else None,
        "bias_mw": round(bias, 2) if bias is not None else None,
        "normalized_mae": round(nmae, 4) if nmae is not None else None,
        "mape_percent": round(mape, 2) if mape is not None else None,
        "p50_abs_error_mw": round(abs_pcts[50], 2) if abs_pcts[50] is not None else None,
        "p90_abs_error_mw": round(abs_pcts[90], 2) if abs_pcts[90] is not None else None,
        "p95_abs_error_mw": round(abs_pcts[95], 2) if abs_pcts[95] is not None else None,
        "p10_signed_error_mw": round(res_pcts[10], 2) if res_pcts[10] is not None else None,
        "p90_signed_error_mw": round(res_pcts[90], 2) if res_pcts[90] is not None else None,
    }


def assign_lead_time_bucket(
    lead_hours: float,
    buckets: Sequence[Tuple[float, float | None, str]],
) -> Optional[str]:
    """Assign lead time in hours to a defined bucket.
    
    Boundary rule: half-open interval [low, high)
    - If lead_hours < 0: returns None (negative lead time dropped)
    - low <= lead_hours < high (or lead_hours >= low if high is None)
    For example: 6.0h lands in bucket "6-12h", not "0-6h".
    """
    if lead_hours < 0:
        return None

    for low, high, label in buckets:
        if high is None:
            if lead_hours >= low:
                return label
        else:
            if low <= lead_hours < high:
                return label

    return None
