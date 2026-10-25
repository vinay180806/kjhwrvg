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
    <header className="bg-[#06141B]/95 border-b border-[#253745] sticky top-0 z-40 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        {/* Top Operational Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
          {/* Brand & Market Telemetry Badge */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('home')}>
            <div className="h-9 w-9 rounded bg-[#11212D] border border-[#253745] flex items-center justify-center text-[#CCD0CF] shrink-0 shadow-sm">
              <Wind className="h-5 w-5 text-[#10B981]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold tracking-wider text-white font-sans">
                  VORTEX<span className="text-[#CCD0CF]">POWER</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#11212D] text-[#9BA8AB] font-mono border border-[#253745]">
                  UK
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#11212D] border border-[#253745] text-[10px] font-mono text-[#CCD0CF]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Elexon BMRS Live</span>
                </span>
              </div>
              <p className="text-[11px] text-[#9BA8AB]">
                Day-Ahead Renewable Analytics & Dispatch Intelligence
              </p>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 bg-[#11212D] p-1.5 rounded-lg border border-[#253745] shadow-sm">
            {/* Delivery Date Picker */}
            <div className="flex items-center space-x-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5 text-[#10B981]" />
              <span className="text-[#9BA8AB] text-[11px]">Delivery (D):</span>
              <select
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-[#06141B] border border-[#253745] text-white rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#10B981]"
              >
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Cutoff Time */}
            <div className="flex items-center space-x-1 text-xs border-l border-[#253745] pl-2">
              <Clock className="h-3.5 w-3.5 text-[#06B6D4]" />
              <span className="text-[#9BA8AB] text-[11px]">Cutoff:</span>
              <input
                type="text"
                pattern="^\d{2}:\d{2}$"
                value={cutoffTime}
                onChange={(e) => onSelectCutoffTime(e.target.value)}
                className="w-14 bg-[#06141B] border border-[#253745] text-white rounded px-1.5 py-1 text-xs font-mono text-center focus:outline-none focus:border-[#06B6D4]"
                title="Format HH:MM in London Time"
              />
              <span className="text-[#9BA8AB] text-[10px]">Lon</span>
            </div>

            {/* Days Before */}
            <div className="flex items-center space-x-1 text-xs border-l border-[#253745] pl-2">
              <span className="text-[#9BA8AB] text-[11px]">Gate:</span>
              <select
                value={daysBefore}
                onChange={(e) => onSelectDaysBefore(Number(e.target.value))}
                className="bg-[#06141B] border border-[#253745] text-white rounded px-1.5 py-1 text-xs font-mono focus:outline-none focus:border-[#06B6D4]"
              >
                <option value={1}>D-1 (Day-Ahead)</option>
                <option value={2}>D-2 (48h Ahead)</option>
                <option value={0}>D-0 (Intraday)</option>
              </select>
            </div>

            {/* Metric Eval Range */}
            <div className="hidden md:flex items-center space-x-1 text-xs border-l border-[#253745] pl-2">
              <span className="text-[#9BA8AB] text-[11px]">Eval:</span>
              <select
                value={startDate}
                onChange={(e) => onSelectStartDate(e.target.value)}
                className="bg-[#06141B] border border-[#253745] text-white rounded px-1.5 py-1 text-[11px] font-mono"
              >
                {dates.map((d) => (
                  <option key={`start-${d}`} value={d}>
                    {d.slice(5)}
                  </option>
                ))}
              </select>
              <span className="text-[#9BA8AB] text-[10px]">to</span>
              <select
                value={endDate}
                onChange={(e) => onSelectEndDate(e.target.value)}
                className="bg-[#06141B] border border-[#253745] text-white rounded px-1.5 py-1 text-[11px] font-mono"
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
              className="p-1 rounded bg-[#192c3a] hover:bg-[#253745] text-[#CCD0CF] hover:text-white transition disabled:opacity-50 cursor-pointer border border-[#253745]"
              title="Refresh Feed"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#10B981]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Bottom Navigation Tabs */}
        <div className="flex items-center space-x-1 mt-2 overflow-x-auto pb-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#11212D] text-white font-semibold border-b-2 border-[#CCD0CF] shadow-sm'
                    : 'text-[#9BA8AB] hover:text-white hover:bg-[#11212D]/60'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#10B981]' : 'text-[#9BA8AB]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
