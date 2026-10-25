import React from 'react';
import {
  Wind,
  Clock,
  Calendar,
  RefreshCw,
  Home,
  BarChart2,
  TrendingUp,
  Zap,
  Cpu,
} from 'lucide-react';
import { MetaData } from '../types';

interface HeaderProps {
  meta: MetaData | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
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
  activeTab,
  onSelectTab,
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

  const navItems = [
    { id: 'home', label: 'Home Overview', icon: Home },
    { id: 'studio', label: 'Day-Ahead Studio', icon: BarChart2 },
    { id: 'analytics', label: 'Quant Analytics', icon: TrendingUp },
    { id: 'buffer', label: 'Procurement Buffer', icon: Zap },
    { id: 'architecture', label: 'Tech Lead Review', icon: Cpu },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Row: Brand & Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-tight text-white">
                  GB Wind Day-Ahead Engine
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                  Elexon BMRS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                UK Wholesale Electricity Market Procurement Portal
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
            {/* Delivery Date Picker */}
            <div className="flex items-center space-x-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-400 text-[11px]">Delivery (D):</span>
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
            <div className="flex items-center space-x-1 text-xs border-l border-slate-800 pl-2">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-slate-400 text-[11px]">Cutoff:</span>
              <input
                type="text"
                pattern="^\d{2}:\d{2}$"
                value={cutoffTime}
                onChange={(e) => onSelectCutoffTime(e.target.value)}
                className="w-14 bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs font-mono text-center focus:outline-none focus:border-cyan-500"
                title="Format HH:MM in London Time"
              />
              <span className="text-slate-500 text-[10px]">Lon</span>
            </div>

            {/* Days Before */}
            <div className="flex items-center space-x-1 text-xs border-l border-slate-800 pl-2">
              <span className="text-slate-400 text-[11px]">Gate:</span>
              <select
                value={daysBefore}
                onChange={(e) => onSelectDaysBefore(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white rounded px-1.5 py-1 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value={1}>D-1 (Day-Ahead)</option>
                <option value={2}>D-2 (48h Ahead)</option>
                <option value={0}>D-0 (Intraday)</option>
              </select>
            </div>

            {/* Metric Eval Range */}
            <div className="hidden md:flex items-center space-x-1 text-xs border-l border-slate-800 pl-2">
              <span className="text-slate-400 text-[11px]">Range:</span>
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
              <span className="text-slate-600 text-[10px]">to</span>
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

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Row: Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-2.5 overflow-x-auto pb-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
