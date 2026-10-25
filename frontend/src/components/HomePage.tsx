import React from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Cpu,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { MetaData, OverallMetricsResponse } from '../types';

interface HomePageProps {
  meta: MetaData | null;
  overallMetrics: OverallMetricsResponse | null;
  onNavigateTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  meta,
  overallMetrics,
  onNavigateTab,
}) => {
  const m = overallMetrics?.metrics;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#11212D] via-[#0b1922] to-[#06141B] border border-[#253745] p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-80 h-80 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded bg-[#06141B] border border-[#253745] text-[#10B981] text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
            </span>
            <span>UK Wholesale Electricity Market • Day-Ahead Operations</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            GB Wind Generation <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-[#06B6D4] to-[#CCD0CF]">
              Day-Ahead Decision Support Engine
            </span>
          </h1>

          <p className="text-[#CCD0CF] text-sm sm:text-base leading-relaxed max-w-3xl">
            A specialized decision intelligence portal built for energy utilities buying power in the Great Britain wholesale market.
            Eliminate lookahead leakage at gate closure, quantify empirical wind forecast errors, and calculate risk-weighted thermal procurement buffers for January 2026 delivery.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('studio')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-[#10B981] hover:bg-[#10B981]/90 text-[#06141B] font-semibold text-xs sm:text-sm transition-all shadow-lg shadow-[#10B981]/20 cursor-pointer"
            >
              <span>Launch Day-Ahead Studio</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => onNavigateTab('buffer')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-[#192c3a] hover:bg-[#253745] text-white font-medium text-xs sm:text-sm transition-all border border-[#253745] cursor-pointer"
            >
              <Zap className="h-4 w-4 text-[#E2856E]" />
              <span>Simulate Procurement Buffer</span>
            </button>

            <button
              onClick={() => onNavigateTab('analytics')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-[#11212D] hover:bg-[#192c3a] text-[#CCD0CF] hover:text-white font-medium text-xs sm:text-sm transition-all border border-[#253745] cursor-pointer"
            >
              <BarChart3 className="h-4 w-4 text-[#06B6D4]" />
              <span>Quantitative Analytics</span>
            </button>

            <button
              onClick={() => onNavigateTab('architecture')}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-[#11212D] hover:bg-[#192c3a] text-[#9BA8AB] hover:text-white font-medium text-xs sm:text-sm transition-all border border-[#253745] cursor-pointer"
            >
              <Cpu className="h-4 w-4 text-[#CCD0CF]" />
              <span>Tech Lead Review</span>
            </button>
          </div>
        </div>

        {/* Live Market Operational Ticker */}
        <div className="mt-8 pt-6 border-t border-[#253745] grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#06141B] p-3 rounded-lg border border-[#253745]">
            <div className="text-[11px] text-[#9BA8AB] font-medium">Market Auction Gates</div>
            <div className="text-sm font-bold font-mono text-white mt-1">EPEX 09:20 / NP 09:50</div>
            <div className="text-[10px] text-[#9BA8AB] mt-0.5">London Local Time D-1</div>
          </div>

          <div className="bg-[#06141B] p-3 rounded-lg border border-[#253745]">
            <div className="text-[11px] text-[#9BA8AB] font-medium">Applied Decision Cutoff</div>
            <div className="text-sm font-bold font-mono text-[#06B6D4] mt-1">
              {meta?.default_cutoff_time || '09:00'} London (D-{meta?.default_days_before ?? 1})
            </div>
            <div className="text-[10px] text-[#10B981] mt-0.5">20-50 min safety margin</div>
          </div>

          <div className="bg-[#06141B] p-3 rounded-lg border border-[#253745]">
            <div className="text-[11px] text-[#9BA8AB] font-medium">Evaluated January Slots</div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {m ? `${m.count_used.toLocaleString()} slots` : '1,488 slots'}
            </div>
            <div className="text-[10px] text-[#9BA8AB] mt-0.5">31 delivery days (48 HH/day)</div>
          </div>

          <div className="bg-[#06141B] p-3 rounded-lg border border-[#253745]">
            <div className="text-[11px] text-[#9BA8AB] font-medium">Official Data Pipeline</div>
            <div className="text-sm font-bold font-mono text-[#10B981] mt-1">Elexon BMRS Verified</div>
            <div className="text-[10px] text-[#9BA8AB] mt-0.5">FUELHH & WINDFOR streams</div>
          </div>
        </div>
      </section>

      {/* 4 Interactive Feature Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigateTab('studio')}
          className="group bg-[#11212D] border border-[#253745] hover:border-[#10B981]/50 rounded-xl p-5 transition-all shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded bg-[#06141B] border border-[#253745] text-[#10B981] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#10B981] transition-colors">
              Zero Lookahead Alignment
            </h3>
            <p className="text-xs text-[#9BA8AB] mt-1.5 leading-relaxed">
              Strictly locks the latest forecast published on or before the 09:00 D-1 auction cutoff. Prevents retrospective bias and mimics true trading desk conditions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#253745] text-xs font-mono text-[#10B981] flex items-center space-x-1">
            <span>Explore 48 Slots</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('analytics')}
          className="group bg-[#11212D] border border-[#253745] hover:border-[#06B6D4]/50 rounded-xl p-5 transition-all shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded bg-[#06141B] border border-[#253745] text-[#06B6D4] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#06B6D4] transition-colors">
              Horizon Degradation Analytics
            </h3>
            <p className="text-xs text-[#9BA8AB] mt-1.5 leading-relaxed">
              Analyzes error growth across all forecast vintages from 0-6 hours up to 48+ hours out. Quantifies the precision gain of deciding at D-1 09:00 vs earlier dates.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#253745] text-xs font-mono text-[#06B6D4] flex items-center space-x-1">
            <span>View Horizon Curves</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('buffer')}
          className="group bg-[#11212D] border border-[#253745] hover:border-[#E2856E]/50 rounded-xl p-5 transition-all shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded bg-[#06141B] border border-[#253745] text-[#E2856E] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#E2856E] transition-colors">
              Procurement Buffer Calculator
            </h3>
            <p className="text-xs text-[#9BA8AB] mt-1.5 leading-relaxed">
              Input expected client electricity demand to dynamically compute net residual procurement and the conservative P10 thermal buffer needed to prevent cash-out penalties.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#253745] text-xs font-mono text-[#E2856E] flex items-center space-x-1">
            <span>Calculate Reserves</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('architecture')}
          className="group bg-[#11212D] border border-[#253745] hover:border-[#CCD0CF]/50 rounded-xl p-5 transition-all shadow-md cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded bg-[#06141B] border border-[#253745] text-[#CCD0CF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white group-hover:text-[#CCD0CF] transition-colors">
              Technical Architecture & Review
            </h3>
            <p className="text-xs text-[#9BA8AB] mt-1.5 leading-relaxed">
              Full architectural overview for internal review: FastAPI backend, Vite React frontend, memory hash indexing, and pure mathematical metric suites.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[#253745] text-xs font-mono text-[#CCD0CF] flex items-center space-x-1">
            <span>Review Architecture</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </section>

      {/* Market Mechanism Flowchart */}
      <section className="bg-[#11212D] border border-[#253745] rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="max-w-3xl mb-6">
          <h2 className="text-lg font-bold text-white tracking-tight">
            UK Day-Ahead Electricity Market Procurement Lifecycle
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-1">
            How our decision-support platform integrates into an energy utility trading workflow:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          <div className="bg-[#06141B] p-4 rounded-lg border border-[#253745] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#06B6D4] font-bold mb-1">STAGE 1: D-1 09:00</div>
              <h4 className="text-xs font-bold text-white">Forecast Freeze & Alignment</h4>
              <p className="text-[11px] text-[#9BA8AB] mt-1">
                Elexon WINDFOR forecasts published on or before 09:00 London are locked. Lookahead leakage is eliminated.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] text-[#10B981] font-mono">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              <span>Locked Forecast Ready</span>
            </div>
          </div>

          <div className="bg-[#06141B] p-4 rounded-lg border border-[#253745] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#E2856E] font-bold mb-1">STAGE 2: D-1 09:05</div>
              <h4 className="text-xs font-bold text-white">Net Residual & P10 Buffer</h4>
              <p className="text-[11px] text-[#9BA8AB] mt-1">
                Trading desk inputs expected customer demand. Tool derives expected residual and conservative P10 downside buffer.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] text-[#E2856E] font-mono">
              <ShieldCheck className="h-3 w-3 mr-1" />
              <span>Risk Hedged</span>
            </div>
          </div>

          <div className="bg-[#06141B] p-4 rounded-lg border border-[#253745] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#CCD0CF] font-bold mb-1">STAGE 3: D-1 09:20</div>
              <h4 className="text-xs font-bold text-white">Day-Ahead Auction Bidding</h4>
              <p className="text-[11px] text-[#9BA8AB] mt-1">
                Trader submits binding buy orders to EPEX SPOT and Nord Pool day-ahead auctions before gate closure.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] text-[#CCD0CF] font-mono">
              <Clock className="h-3 w-3 mr-1" />
              <span>Gate Closed</span>
            </div>
          </div>

          <div className="bg-[#06141B] p-4 rounded-lg border border-[#253745] flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-[#10B981] font-bold mb-1">STAGE 4: DAY D</div>
              <h4 className="text-xs font-bold text-white">Physical Delivery & Settlement</h4>
              <p className="text-[11px] text-[#9BA8AB] mt-1">
                Actual generation outturn is recorded via FUELHH. Balancing Mechanism cash-out exposure is minimized.
              </p>
            </div>
            <div className="mt-3 flex items-center text-[10px] text-[#10B981] font-mono">
              <Zap className="h-3 w-3 mr-1" />
              <span>Balanced Outturn</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pilot Project Summary Box for Part 1 Pitch */}
      <section className="bg-gradient-to-r from-[#11212D] via-[#0b1922] to-[#06141B] border border-[#10B981]/20 rounded-xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono text-[#10B981] font-semibold uppercase tracking-wider">
              Pilot Project Executive Pitch (Deliverable 3.1 Part 1)
            </div>
            <h3 className="text-xl font-bold text-white">
              Demonstrated Commercial Value for UK Electricity Utility
            </h3>
            <p className="text-xs text-[#CCD0CF] leading-relaxed">
              In this pilot project evaluation across January 2026, our platform proved that locking forecasts at D-1 09:00 provides high accuracy while maintaining sufficient operational lead time. Sizing dispatchable thermal reserves to the empirical P10 wind shortfall prevents costly imbalance exposure during volatile winter peak demand.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('studio')}
              className="px-4 py-2.5 rounded bg-[#10B981] hover:bg-[#10B981]/90 text-[#06141B] font-bold text-xs font-mono transition-all cursor-pointer"
            >
              Open Day-Ahead Studio
            </button>
            <button
              onClick={() => onNavigateTab('buffer')}
              className="px-4 py-2.5 rounded bg-[#192c3a] hover:bg-[#253745] text-[#CCD0CF] font-bold text-xs font-mono transition-all border border-[#253745] cursor-pointer"
            >
              Open Buffer Calculator
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
