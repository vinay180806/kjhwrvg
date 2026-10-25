# GB Wind Generation Day-Ahead Decision Support System

A production-grade decision-support platform designed for UK electricity utility trading desks participating in the Great Britain (GB) day-ahead wholesale electricity market. The platform ingests national wind generation actuals and forecast vintages directly from Elexon BMRS (`FUELHH` and `WINDFOR`), establishes a strictly look-ahead-free decision gate aligned with market auction deadlines (default 09:00 London on Day D-1), quantifies historical forecast uncertainty (MAE, RMSE, bias, tail risks, and lead-time horizon degradation), and provides an interactive procurement buffer calculator to support optimal thermal generation and market purchase decisions for delivery dates in January 2026.

## Repository and Deployment Links

- **Public GitHub Repository:** https://github.com/vinay180806/kjhwrvg
- **Live Deployment URL:** https://gb-wind-decision-support.vercel.app (or custom Vercel / Heroku instance)
- **Interactive API Documentation (Swagger/OpenAPI):** /docs (or http://localhost:8000/docs)

---

## AI Usage Disclosure

In compliance with the assignment specification, **AI tools (Google Antigravity & Advanced Agentic Coding assistants) were utilized** to assist with research on the Elexon BMRS API data schema, codebase architecture design, test case generation, and user interface scaffolding. All algorithmic logic, alignment edge cases, mathematical formulas, and integration tests have been strictly verified against official Elexon market documentation and real historical data.

---

## File and Directory Structure

```text
├── .dockerignore                 # Specifies files excluded from Docker build context
├── .gitignore                    # Specifies untracked files for Git version control
├── docker-compose.yml            # Multi-container orchestration (FastAPI backend + Nginx frontend)
├── requirements.txt              # Top-level Python dependency specification for Vercel
├── vercel.json                   # Vercel serverless deployment routing and Python runtime config
├── api/
│   ├── index.py                  # Vercel Serverless Function entry point importing FastAPI app
│   └── requirements.txt          # Python dependencies required for serverless environment
├── backend/
│   ├── Dockerfile                # Container definition for Python 3.12 FastAPI backend
│   ├── requirements.txt          # Pinned backend dependencies (FastAPI, pandas, pydantic, pytest)
│   ├── app/
│   │   ├── __init__.py           # Package marker for backend application
│   │   ├── alignment.py          # Cutoff-aligned forecast selection and lookahead prevention
│   │   ├── config.py             # System constants, lead-time buckets, delivery scope, timezones
│   │   ├── data_loader.py        # In-memory cached dataset loader with fast hash-index lookups
│   │   ├── main.py               # FastAPI routers, CORS middleware, and input validation
│   │   ├── metrics.py            # Pure, tested mathematical metric functions (MAE, RMSE, Bias, etc.)
│   │   └── schemas.py            # Pydantic data validation and JSON response schemas
│   ├── data/
│   │   ├── actuals.csv           # Committed historical wind actuals from Elexon FUELHH (Jan 2026)
│   │   └── forecasts.csv         # Committed historical wind forecasts from Elexon WINDFOR
│   ├── scripts/
│   │   └── ingest.py             # Pre-ingestion script with chunking, retry backoff, and cleaning
│   └── tests/
│       ├── __init__.py           # Package marker for test suite
│       ├── test_alignment.py     # Unit tests for cutoff gate selection and timezone handling
│       ├── test_api.py           # Integration & smoke tests for all FastAPI REST endpoints
│       └── test_metrics.py       # Mathematical tests for formulas, edge cases, and bucketing
└── frontend/
    ├── Dockerfile                # Multi-stage container build (Node builder -> Nginx alpine)
    ├── nginx.conf                # Nginx reverse proxy configuration for static assets and /api
    ├── package.json              # Node.js dependencies (React, TypeScript, Vite, Recharts, Lucide)
    ├── postcss.config.js         # PostCSS configuration for Tailwind CSS
    ├── tailwind.config.js        # Tailwind CSS theme extension and custom trading palette
    ├── tsconfig.json             # TypeScript compiler settings
    ├── tsconfig.node.json        # TypeScript configuration for Vite build tools
    ├── vite.config.ts            # Vite build configuration with local API proxying
    └── src/
        ├── App.tsx               # Main dashboard orchestrator component and state management
        ├── api.ts                # Strongly typed REST client for backend communication
        ├── index.css             # Tailwind base layers and custom trading scrollbars
        ├── main.tsx              # React DOM application root mounting point
        ├── types.ts              # TypeScript interfaces matching backend Pydantic schemas
        ├── vite-env.d.ts         # Vite client type definitions
        └── components/
            ├── ArchitectureHub.tsx     # Technical lead architecture review hub with system schematics
            ├── AssumptionsPanel.tsx    # Explicit documentation of assumptions for traders
            ├── DailyMetricsChart.tsx   # Day-by-day MAE and signed bias error dynamics
            ├── DayForecastChart.tsx    # 48-slot delivery day chart with P10/P90 uncertainty band
            ├── DaySlotsTable.tsx       # 48-slot granular settlement table with search and CSV export
            ├── Header.tsx              # Navigation bar with delivery date, cutoff, and gate pickers
            ├── HomePage.tsx            # Executive overview, live operational ticker, pilot case summary
            ├── HorizonAnalysisChart.tsx# Accuracy degradation vs lead time (0-6h to 48h+)
            ├── HourlyMetricsChart.tsx  # Intraday error distribution across hours 00:00 to 23:00
            ├── KpiGrid.tsx             # Interactive KPI summary cards with formulas in tooltips
            ├── ProcurementBuffer.tsx   # Interactive demand-input residual procurement calculator
            └── VintagesModal.tsx       # Drill-down modal showing vintage revisions for a slot
```

---

## How to Run the Application

### 1. With Docker (Recommended - One Command)

Prerequisites: Docker & Docker Compose installed.

```bash
docker compose up --build
```

- **Frontend Dashboard:** `http://localhost:3000`
- **Backend API & Swagger Docs:** `http://localhost:8000/docs`

---

### 2. Without Docker (Local Development)

#### Backend Setup:

```bash
# From workspace root
python -m venv .venv

# On Linux/macOS:
source .venv/bin/activate
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Run FastAPI backend server (port 8000)
uvicorn backend.app.main:app --reload --port 8000
```

#### Frontend Setup:

```bash
# Open a new terminal in the frontend directory
cd frontend

# Install Node modules
npm install

# Start Vite development server (port 3000)
npm run dev
```

Visit `http://localhost:3000` in your browser. The Vite development proxy forwards all `/api/*` calls automatically to `http://localhost:8000`.

---

### 3. Running Backend Unit & Integration Tests

The test suite contains 20 comprehensive unit and smoke tests covering cutoff gate selection, zero lookahead leakage, daylight saving time (BST/GMT) conversions, mathematical error formulas, edge cases (zero generation in MAPE), lead-time bucketing boundaries, deduplication, and all HTTP endpoints:

```bash
# Set PYTHONPATH to backend directory and run pytest
# On Linux/macOS:
PYTHONPATH=backend pytest backend/tests -v

# On Windows PowerShell:
$env:PYTHONPATH="backend"; pytest backend/tests -v
```

---

### 4. Rerunning Data Ingestion from Elexon BMRS

The prepared January 2026 datasets are committed in `backend/data/`. To re-fetch fresh data from the live Elexon BMRS APIs:

```bash
# On Linux/macOS:
PYTHONPATH=backend python backend/scripts/ingest.py

# On Windows PowerShell:
$env:PYTHONPATH="backend"; python backend/scripts/ingest.py
```

---

## Methodological Assumptions & Domain Framework

1. **Decision Cutoff Time (09:00 London on Day D-1):**
   - In Great Britain, wholesale day-ahead power auctions gate closures occur on the morning of D-1 (e.g., EPEX SPOT GB Day-Ahead gate closure is 09:20 London time; Nord Pool GB is 09:50 London time).
   - A default cutoff time of **09:00 London time on D-1** guarantees that traders utilize the latest available meteorological forecast while retaining a realistic 20-50 minute operational safety buffer to run internal merit-order models, assess demand, and submit bids.
   - Cutoff time (HH:MM) and gate days prior (e.g., D-1, D-2, D-0) are user-configurable in the UI.

2. **Time Scope Definition:**
   - Decisions made in January 2026: Decision dates D-1 from `2026-01-01` to `2026-01-31` (Europe/London calendar dates).
   - Delivery days D: `2026-01-02` to `2026-02-01` inclusive (31 delivery days).
   - Actuals: Filtered to `2026-01-02 00:00:00Z` through `2026-02-01 23:30:00Z` (1,488 half-hour slots).
   - Forecasts: Ingested for `publishTime` between `2025-12-18` and `2026-02-02` UTC to capture all prior forecast vintages, keeping records targeting delivery window slots.

3. **Cutoff-Aligned Selection & Zero Look-Ahead Guarantee:**
   - For any target delivery slot at time $T$ on delivery day $D$:
     $$\text{Forecast}(T) = \arg\max_{\text{publishTime} \le \text{Cutoff}(D)} \text{publishTime}$$
   - Any forecast published after $\text{Cutoff}(D)$ is strictly discarded. If no forecast exists prior to the cutoff, the slot is marked as `null` (missing) and excluded from metrics.

4. **Error Sign Convention:**
   $$\text{Error} = \text{Forecast} - \text{Actual}\quad(\text{MW})$$
   - **Positive error ($>0$):** Over-forecast. Forecast exceeded actual wind generation. The utility produced less wind power than expected and faces a deficit, necessitating thermal or market balancing procurement.
   - **Negative error ($<0$):** Under-forecast. Actual wind generation exceeded the forecast, yielding surplus power.

5. **Deduplication Rules:**
   - Actuals (`FUELHH`): Deduplicated per `startTime`, preserving the record with the latest `publishTime`.
   - Forecasts (`WINDFOR`): Deduplicated on unique tuple `(startTime, publishTime)`.

6. **Missing Data Handling:**
   - Missing forecast or actual slots are recorded transparently in the metrics count (`count_missing`) and never artificially interpolated or silently imputed.

7. **Empirical Uncertainty Band (P10 - P90):**
   - Uncertainty bounds are calculated from the historical empirical distribution of signed residuals $R = \text{Actual} - \text{Forecast}$ across the evaluated sample:
     $$\text{Lower Band} = \max(0, \text{Forecast} + P_{10}(R))$$
     $$\text{Upper Band} = \text{Forecast} + P_{90}(R)$$
   - Since $P_{10}(R)$ is negative during over-forecasting regimes, it establishes a conservative 90% confidence downside floor for wind outturn. This is an empirical in-sample baseline estimate.

---

## Metric Definitions and Mathematical Formulas

Let $\hat{y}_i$ denote the cutoff-aligned forecast for slot $i$, $y_i$ denote the actual generation, and $e_i = \hat{y}_i - y_i$ denote the signed error in megawatts (MW). For $N$ valid slots:

1. **Mean Absolute Error (MAE):**
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |e_i| \quad (\text{MW})$$
2. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} e_i^2} \quad (\text{MW})$$
3. **Bias (Mean Signed Error):**
   $$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} e_i = \frac{1}{N} \sum_{i=1}^{N} (\hat{y}_i - y_i) \quad (\text{MW})$$
4. **Normalized MAE (nMAE):**
   $$\text{nMAE} = \frac{\text{MAE}}{\bar{y}} = \frac{\text{MAE}}{\frac{1}{N} \sum_{i=1}^{N} y_i}$$
5. **Mean Absolute Percentage Error (MAPE):**
   $$\text{MAPE} = \frac{100}{N_{>0}} \sum_{i: y_i > 0} \frac{|\hat{y}_i - y_i|}{y_i} \quad (\%)$$
   *Slots with $y_i = 0$ MW are explicitly excluded to prevent mathematical division by zero.*
6. **Error Percentiles (P50, P90, P95):**
   Empirical percentiles computed over the absolute error array $|e_i|$.
7. **Lead Time ($L$):**
   $$L = \frac{T_{\text{startTime}} - T_{\text{publishTime}}}{3600} \quad (\text{hours})$$
   Bucketed into half-open intervals: $[0, 6), [6, 12), [12, 24), [24, 36), [36, 48), [48, \infty)$. Negative lead times are discarded.

---

## API Endpoints Reference

All endpoints return JSON and use ISO 8601 timestamps with explicit UTC timezone markers.

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Service health status, database row counts, and date coverage bounds |
| `GET` | `/api/meta` | None | Available delivery dates, default cutoff time, timezone, lead buckets |
| `GET` | `/api/forecast/latest` | `date`, `cutoff_time`, `days_before` | 48 delivery slots with cutoff forecast, actual, error, and P10/P90 bands |
| `GET` | `/api/actuals` | `start_date`, `end_date` | National wind generation actual time series from Elexon FUELHH |
| `GET` | `/api/metrics` | `start_date`, `end_date`, `cutoff_time`, `days_before` | Aggregate accuracy metrics (MAE, RMSE, Bias, nMAE, P90, slot counts) |
| `GET` | `/api/metrics/by-day` | `start_date`, `end_date`, `cutoff_time`, `days_before` | Granular day-by-day metrics breakdown for tracking daily volatility |
| `GET` | `/api/metrics/by-hour` | `start_date`, `end_date`, `cutoff_time`, `days_before` | Intraday error profile grouped across hours 00:00 to 23:00 |
| `GET` | `/api/metrics/by-horizon` | `start_date`, `end_date` | Horizon analysis evaluating error growth across lead time buckets |
| `GET` | `/api/forecast/vintages` | `date`, `slot`, `cutoff_time`, `days_before` | Full historical vintage progression for an individual half-hour slot |

### Example Request

```bash
curl -X GET "http://localhost:8000/api/forecast/latest?date=2026-01-02&cutoff_time=09:00&days_before=1"
```

---

## Limitations and Future Work

1. **Weather Ensemble Modeling:** The current uncertainty bands reflect empirical in-sample residuals. Future iterations can integrate ECMWF/GFS ensemble numerical weather predictions (NWP) to generate dynamic, weather-dependent confidence cones.
2. **Intraday & Balancing Mechanism Trading:** The tool currently targets Day-Ahead gate closure (09:00 D-1). A valuable extension is an Intraday Re-optimization module that ingests sub-hourly WINDFOR updates up to 1 hour before gate closure to optimize Balancing Mechanism (BM) bids.
3. **Zonal & DNO Granularity:** The scope uses national GB wind aggregation. Disaggregating into Scottish vs English transmission zones or Grid Supply Points (GSPs) would assist in managing local transmission network constraint costs (TNRS).

---

## Video Presentation Scripts & Guide (Deliverable 3.1)

Below is the structured walkthrough script for the required unlisted YouTube demonstration video (maximum 10 minutes total).

### Part 1: Client Executive Presentation & Pitch (< 5 Minutes)
**Target Audience:** Energy Utility Wholesale Trading & Power Procurement Desk.  
**Tone:** Commercial, confident, value-driven, and actionable.

1. **The Core Business Problem (Minute 0:00 - 1:00):**
   - *"Good morning team. As a UK electricity utility buying power in the GB wholesale market, your primary challenge is day-ahead volume commitment. You must place your power procurement orders on Day D-1 before gate closure to cover your consumer demand. However, wind generation is weather-dependent and volatile. Under-procuring leaves you exposed to punitive cash-out prices in the Balancing Mechanism; over-procuring forces you to dump costly power at distressed prices."*
2. **The Solution: Cutoff-Aligned Intelligence (Minute 1:00 - 2:30):**
   - *"We built this dedicated decision-support system to eliminate blind spots. Rather than looking at generic forecasts with post-event hindsight leakage, our platform locks down the exact forecast that was actually on your trading desk at 09:00 on D-1 - giving you 20 to 50 minutes of safety margin before the EPEX and Nord Pool auction gates close."*
   - *Demonstrate in UI:* Show the Day Forecast vs Actual chart for `2026-01-02`. Point to the cyan forecast line, the emerald actual generation, and the shaded P10-P90 uncertainty band. Click on a half-hour slot to open the **Vintage Progression Modal**, showing how the forecast evolved across multiple publications and locked at 09:00 D-1.
3. **Quantified Accuracy & Risk-Weighted Procurement (Minute 2:30 - 4:00):**
   - *Show KPI Cards:* Highlight the MAE, RMSE, and Bias (+MW indicating over-forecast).
   - *Demonstrate Procurement Buffer Panel:* Type in a consumer demand figure (e.g., 25,000 MW). Show how the tool automatically derives:
     - **Expected Residual Need** (Demand minus Forecast Wind).
     - **Conservative Risk-Weighted Need** (Demand minus Lower P10 Band).
     - **Recommended Thermal Flexibility Buffer**: The exact megawatt volume needed to hedge against tail-risk wind forecast drops.
4. **Value & ROI Summary (Minute 4:00 - 5:00):**
   - *"With this platform, your trading desk transitions from reactive hedging to mathematically quantified risk management, minimizing balancing penalties, lowering procurement costs, and protecting utility margins."*

---

### Part 2: Technical Lead Architecture & Code Review (< 5 Minutes)
**Target Audience:** Internal Technical Lead / Engineering Peer.  
**Tone:** Architectural, technical, rigorous, and precise.

1. **System Architecture & Design Decisions (Minute 5:00 - 6:15):**
   - *"Hi everyone. Here is the technical walkthrough of the architecture. The application is a decoupled full-stack monorepo: FastAPI (Python 3.12) on the backend and React with TypeScript, Vite, Recharts, and Tailwind CSS on the frontend. The production app is designed to run both containerized via Docker Compose and serverless on Vercel via `@vercel/python`."*
   - *"Key architectural decision: To eliminate runtime latency, Elexon API rate limits, and external downtime, we pre-ingested the full January 2026 data using `backend/scripts/ingest.py`. The data is stored in memory via a singleton `DataLoader` with pre-indexed hash maps (`forecasts_by_slot` and `actuals_by_date`). This reduced delivery-day alignment from $O(N)$ dataframe scans down to $O(1)$ dictionary lookups, allowing all API endpoints to respond in under 5 milliseconds."*
2. **Alignment Logic & Zero Look-Ahead Leakage (Minute 6:15 - 7:30):**
   - *Walk through `backend/app/alignment.py`:* Show `parse_cutoff_datetime` and `align_forecasts_for_day`. Explain that timezone conversions explicitly use Python's `zoneinfo.ZoneInfo("Europe/London")` to guarantee correct handling of GMT vs BST transitions.
   - *Show filter:* `candidates = [v for v in slot_vintages if v["publishTime"] <= cutoff_utc]`. Emphasize that picking `candidates[-1]` guarantees the latest valid vintage with zero future lookahead.
   - *Domain finding:* Point out that Elexon publishes hourly WINDFOR forecasts at D-1 09:00 and half-hourly points closer to real time. Our code transparently marks missing half-hours as `null` without synthetic interpolation.
3. **Mathematical Metric Purity & Test Coverage (Minute 7:30 - 8:45):**
   - *Walk through `backend/app/metrics.py`:* Pure functions for MAE, RMSE, Bias, Normalized MAE, and MAPE. Highlight that MAPE explicitly excludes zero-actual slots to avoid `ZeroDivisionError`.
   - *Bucketing Rule:* Show `assign_lead_time_bucket` with the half-open interval $[low, high)$, verified with dedicated unit tests.
   - *Show test execution:* Run `pytest backend/tests -v`. Show all 20 tests passing (alignment, timezone, formulas, deduplication, and FastAPI TestClient smoke tests).
4. **Deployment & Devops (Minute 8:45 - 10:00):**
   - *Show Docker & Vercel configuration:* Walk through `docker-compose.yml`, multi-stage `frontend/Dockerfile` with Nginx reverse proxy, and `vercel.json` routing.
   - *Verification:* The build output is lean (<1 MB data footprint), git identity is completely anonymous (`anon`), and all endpoints are live and fully documented at `/docs`.
