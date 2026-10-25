import React, { useEffect, useState, useCallback } from 'react';
import {
  DayForecastResponse,
  DaysMetricsResponse,
  HorizonMetricsResponse,
  HoursMetricsResponse,
  MetaData,
  OverallMetricsResponse,
} from './types';
import {
  fetchDayForecast,
  fetchDaysMetrics,
  fetchHorizonMetrics,
  fetchHoursMetrics,
  fetchMeta,
  fetchOverallMetrics,
} from './api';
import { Header } from './components/Header';
import { KpiGrid } from './components/KpiGrid';
import { DayForecastChart } from './components/DayForecastChart';
import { DailyMetricsChart } from './components/DailyMetricsChart';
import { HourlyMetricsChart } from './components/HourlyMetricsChart';
import { HorizonAnalysisChart } from './components/HorizonAnalysisChart';
import { ProcurementBuffer } from './components/ProcurementBuffer';
import { AssumptionsPanel } from './components/AssumptionsPanel';
import { VintagesModal } from './components/VintagesModal';
import { AlertCircle, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [meta, setMeta] = useState<MetaData | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-02');
  const [startDate, setStartDate] = useState<string>('2026-01-02');
  const [endDate, setEndDate] = useState<string>('2026-02-01');
  const [cutoffTime, setCutoffTime] = useState<string>('09:00');
  const [daysBefore, setDaysBefore] = useState<number>(1);

  const [dayForecast, setDayForecast] = useState<DayForecastResponse | null>(null);
  const [overallMetrics, setOverallMetrics] = useState<OverallMetricsResponse | null>(null);
  const [daysMetrics, setDaysMetrics] = useState<DaysMetricsResponse | null>(null);
  const [hoursMetrics, setHoursMetrics] = useState<HoursMetricsResponse | null>(null);
  const [horizonMetrics, setHorizonMetrics] = useState<HorizonMetricsResponse | null>(null);

  const [inspectingSlot, setInspectingSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial metadata fetch
  useEffect(() => {
    fetchMeta()
      .then((m) => {
        setMeta(m);
        if (m.available_delivery_dates.length > 0) {
          setSelectedDate(m.available_delivery_dates[0]);
          setStartDate(m.min_delivery_date);
          setEndDate(m.max_delivery_date);
          setCutoffTime(m.default_cutoff_time);
          setDaysBefore(m.default_days_before);
        }
      })
      .catch((err) => {
        console.error('Meta fetch failed:', err);
        setError('Failed to connect to the backend API. Please ensure the server is running.');
      });
  }, []);

  // Main data load function
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [df, om, dm, hm, hzm] = await Promise.all([
        fetchDayForecast(selectedDate, cutoffTime, daysBefore),
        fetchOverallMetrics(startDate, endDate, cutoffTime, daysBefore),
        fetchDaysMetrics(startDate, endDate, cutoffTime, daysBefore),
        fetchHoursMetrics(startDate, endDate, cutoffTime, daysBefore),
        fetchHorizonMetrics(startDate, endDate),
      ]);

      setDayForecast(df);
      setOverallMetrics(om);
      setDaysMetrics(dm);
      setHoursMetrics(hm);
      setHorizonMetrics(hzm);
    } catch (err: any) {
      console.error('Data load error:', err);
      setError(err.message || 'An error occurred while loading forecast data.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, startDate, endDate, cutoffTime, daysBefore]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Header
        meta={meta}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        startDate={startDate}
        onSelectStartDate={setStartDate}
        endDate={endDate}
        onSelectEndDate={setEndDate}
        cutoffTime={cutoffTime}
        onSelectCutoffTime={setCutoffTime}
        daysBefore={daysBefore}
        onSelectDaysBefore={setDaysBefore}
        isLoading={isLoading}
        onRefresh={loadData}
      />

      {/* Error Alert Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">
        {/* KPI Cards Grid */}
        <section aria-label="Key Performance Indicators">
          <KpiGrid metrics={overallMetrics?.metrics ?? null} isLoading={isLoading} />
        </section>

        {/* Selected Day Forecast vs Actual Chart */}
        <section aria-label="Day Delivery Overview">
          <DayForecastChart
            dayData={dayForecast}
            isLoading={isLoading}
            onInspectSlot={(slot) => setInspectingSlot(slot)}
          />
        </section>

        {/* Procurement Buffer Simulation Panel */}
        <section aria-label="Procurement Decision Support">
          <ProcurementBuffer dayData={dayForecast} />
        </section>

        {/* Two-column Analytical Charts: Daily Error Dynamics & Hourly Profile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section aria-label="Daily Error Dynamics">
            <DailyMetricsChart data={daysMetrics} isLoading={isLoading} />
          </section>

          <section aria-label="Hourly Error Profile">
            <HourlyMetricsChart data={hoursMetrics} isLoading={isLoading} />
          </section>
        </div>

        {/* Horizon Degradation Analysis */}
        <section aria-label="Forecast Horizon Degradation">
          <HorizonAnalysisChart data={horizonMetrics} isLoading={isLoading} />
        </section>

        {/* Assumptions & Methodology Notes */}
        <section aria-label="Methodological Assumptions">
          <AssumptionsPanel />
        </section>
      </main>

      {/* Vintage History Modal */}
      <VintagesModal
        date={selectedDate}
        slotIso={inspectingSlot}
        cutoffTime={cutoffTime}
        daysBefore={daysBefore}
        onClose={() => setInspectingSlot(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" />
            <span>FastAPI Backend + React / Recharts • Production Decision Support</span>
          </div>
          <div>
            Built with AI tools assistance • Elexon BMRS Official Datasets (FUELHH & WINDFOR)
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
