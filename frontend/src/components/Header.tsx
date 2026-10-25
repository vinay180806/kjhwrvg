import React from 'react';
import { Wind, Clock, Calendar, RefreshCw } from 'lucide-react';
import { MetaData } from '../types';

interface HeaderProps {
  meta: MetaData | null;
  selectedDate: string;
  onSelectDate: (d: string) => void;
  startDate: string;
  onSelectStartDate: (d: string) => void;
  endDate: string;
  onSelectEndDate: (d: string) => void;
  cutoffTime: string;
  onSelectCutoffTime: (t: string) => void;
  daysBefore: number;
  onSelectDaysBefore: (db: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  meta,
  selectedDate,
  onSelectDate,
  startDate,
  onSelectStartDate,
  endDate,
  onSelectEndDate,
  cutoffTime,
  onSelectCutoffTime,
  daysBefore,
  onSelectDaysBefore,
  isLoading,
  onRefresh,
}) => {
  const dates = meta?.available_delivery_dates || [];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wind className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  GB Wind Day-Ahead Decision Support
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                  Elexon BMRS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                UK Wholesale Electricity Market Procurement • January 2026 Focus
              </p>
            </div>
          </div>

          {/* Global Parameters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-2 rounded-xl border border-slate-800">
            {/* Delivery Day Picker */}
            <div className="flex items-center space-x-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400 font-medium">Delivery Day (D):</span>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-emerald-500"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Cutoff Time */}
            <div className="flex items-center space-x-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400 font-medium">Cutoff:</span>
              <input
                type="text"
                pattern="^\d{2}:\d{2}$"
                value={cutoffTime}
                onChange={(e) => onSelectCutoffTime(e.target.value)}
                placeholder="09:00"
                className="w-16 bg-slate-900 border border-slate-700 text-white rounded px-2 py-1 text-xs font-mono text-center focus:outline-none focus:border-cyan-500"
                title="Format HH:MM in London Local Time"
              />
              <span className="text-slate-500 text-[10px]">London</span>
            </div>

            {/* Days Before */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-400 font-medium">Gate:</span>
              <select
                value={daysBefore}
                onChange={(e) => onSelectDaysBefore(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>D-1 (Day-Ahead)</option>
                <option value={2}>D-2 (Two-Days)</option>
                <option value={0}>D-0 (Intraday)</option>
              </select>
            </div>

            {/* Metric Range */}
            <div className="hidden sm:flex items-center space-x-1 text-xs border-l border-slate-800 pl-3">
              <span className="text-slate-400">Eval:</span>
              <select
                value={startDate}
                onChange={(e) => onSelectStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-[11px] font-mono"
              >
                {dates.map((d) => (
                  <option key={`start-${d}`} value={d}>
                    {d.slice(5)}
                  </option>
                ))}
              </select>
              <span className="text-slate-600">to</span>
              <select
                value={endDate}
                onChange={(e) => onSelectEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-[11px] font-mono"
              >
                {dates.map((d) => (
                  <option key={`end-${d}`} value={d}>
                    {d.slice(5)}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="Refresh Analytics"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
