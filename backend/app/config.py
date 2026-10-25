"""Application configuration and constants."""

from __future__ import annotations

from pathlib import Path
from typing import List, Tuple
from zoneinfo import ZoneInfo

# Base Directories
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
DATA_DIR = BACKEND_DIR / "data"

ACTUALS_CSV_PATH = DATA_DIR / "actuals.csv"
FORECASTS_CSV_PATH = DATA_DIR / "forecasts.csv"

# Timezone
LONDON_TZ = ZoneInfo("Europe/London")

# Scope dates (London date format YYYY-MM-DD)
MIN_DELIVERY_DATE = "2026-01-02"
MAX_DELIVERY_DATE = "2026-02-01"

MIN_DECISION_DATE = "2026-01-01"
MAX_DECISION_DATE = "2026-01-31"

DEFAULT_CUTOFF_TIME = "09:00"
DEFAULT_DAYS_BEFORE = 1

# Lead-time buckets: [low_hours, high_hours, label]
# Rule: low <= lead_hours < high.
# E.g. exactly 6.0h lands in bucket "6-12h". Negative lead times are discarded.
LEAD_TIME_BUCKETS: List[Tuple[float, float | None, str]] = [
    (0.0, 6.0, "0-6h"),
    (6.0, 12.0, "6-12h"),
    (12.0, 24.0, "12-24h"),
    (24.0, 36.0, "24-36h"),
    (36.0, 48.0, "36-48h"),
    (48.0, None, "48h+"),
]
