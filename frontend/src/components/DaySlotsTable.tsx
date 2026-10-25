import React, { useState } from 'react';
import { DayForecastResponse } from '../types';
import { Download, Search, Eye, AlertCircle } from 'lucide-react';

interface DaySlotsTableProps {
  dayData: DayForecastResponse | null;
  onInspectSlot: (slotIso: string) => void;
}

export const DaySlotsTable: React.FC<DaySlotsTableProps> = ({ dayData, onInspectSlot }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'missing'>('all');

  if (!dayData || !dayData.slots) return null;

  const filteredSlots = dayData.slots.filter((s) => {
    const matchesSearch =
      s.start_time.includes(searchTerm) ||
      (s.settlement_period && s.settlement_period.toString().includes(searchTerm));

    if (!matchesSearch) return false;
    if (filterMode === 'available') return s.forecast_mw !== null;
    if (filterMode === 'missing') return s.forecast_mw === null;
    return true;
  });

  const exportCsv = () => {
    const headers = [
      'StartTimeUTC',
      'SettlementPeriod',
      'CutoffForecastMW',
      'ActualGenerationMW',
      'SignedErrorMW',
      'LowerBandMW',
      'UpperBandMW',
      'PublishTimeUTC',
      'LeadHours',
    ];

    const rows = dayData.slots.map((s) => [
      s.start_time,
      s.settlement_period ?? '',
      s.forecast_mw ?? '',
      s.actual_mw ?? '',
      s.error_mw ?? '',
      s.lower_band_mw ?? '',
      s.upper_band_mw ?? '',
      s.publish_time ?? '',
      s.lead_hours ?? '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `wind_day_ahead_${dayData.delivery_date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Granular 48 Settlement Periods Data Grid
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Half-hour settlement breakdown for {dayData.delivery_date} with audit trail
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter time / period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['all', 'available', 'missing'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] capitalize transition ${
                  filterMode === mode
                    ? 'bg-slate-800 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={exportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-mono transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 overflow-x-auto max-h-96">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Slot (UTC)</th>
              <th className="py-2.5 px-3">Period</th>
              <th className="py-2.5 px-3">Forecast (MW)</th>
              <th className="py-2.5 px-3">Actual (MW)</th>
              <th className="py-2.5 px-3">Error (MW)</th>
              <th className="py-2.5 px-3">P10 - P90 Band</th>
              <th className="py-2.5 px-3">Publish Time</th>
              <th className="py-2.5 px-3">Lead Time</th>
              <th className="py-2.5 px-3 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredSlots.map((s) => (
              <tr key={s.start_time} className="hover:bg-slate-800/40 text-slate-300 transition">
                <td className="py-2.5 px-3 font-semibold text-white">
                  {s.start_time.slice(11, 16)}
                </td>
                <td className="py-2.5 px-3 text-slate-400">{s.settlement_period || '-'}</td>
                <td className="py-2.5 px-3">
                  {s.forecast_mw != null ? (
                    <span className="font-bold text-cyan-400">{s.forecast_mw.toLocaleString()} MW</span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-amber-400 text-[11px]">
                      <AlertCircle className="h-3 w-3" />
                      <span>Missing</span>
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {s.actual_mw != null ? (
                    <span className="font-bold text-emerald-400">{s.actual_mw.toLocaleString()} MW</span>
                  ) : (
                    <span className="text-slate-500">N/A</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {s.error_mw != null ? (
                    <span className={`font-semibold ${s.error_mw > 0 ? 'text-amber-400' : 'text-indigo-400'}`}>
                      {s.error_mw > 0 ? `+${s.error_mw}` : s.error_mw} MW
                    </span>
                  ) : (
                    <span className="text-slate-500">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                  {s.lower_band_mw !== null && s.upper_band_mw !== null
                    ? `${s.lower_band_mw} - ${s.upper_band_mw} MW`
                    : '-'}
                </td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                  {s.publish_time ? s.publish_time.slice(11, 16) : '-'}
                </td>
                <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                  {s.lead_hours !== null ? `${s.lead_hours} hrs` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onInspectSlot(s.start_time)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    title="Inspect vintages for this slot"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
