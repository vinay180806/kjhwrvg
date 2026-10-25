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
    if (filterMode === 'available') return s.forecast_mw != null;
    if (filterMode === 'missing') return s.forecast_mw == null;
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
    <div className="bg-[#11212D] border border-[#253745] rounded-xl p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#253745] gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Granular 48 Settlement Periods Data Grid
          </h3>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Half-hour settlement breakdown for {dayData.delivery_date} with audit trail
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9BA8AB]" />
            <input
              type="text"
              placeholder="Filter time / period..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-[#06141B] border border-[#253745] rounded text-xs font-mono text-white placeholder:text-[#9BA8AB]/60 focus:outline-none focus:border-[#10B981] w-44"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center bg-[#06141B] p-1 rounded border border-[#253745] text-xs">
            {(['all', 'available', 'missing'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] capitalize transition cursor-pointer ${
                  filterMode === mode
                    ? 'bg-[#253745] text-white font-bold'
                    : 'text-[#9BA8AB] hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <button
            onClick={exportCsv}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 text-xs font-mono transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4 overflow-x-auto max-h-96 rounded-lg border border-[#253745]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#06141B] text-[#9BA8AB] sticky top-0 z-10 border-b border-[#253745]">
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
          <tbody className="divide-y divide-[#253745]/60">
            {filteredSlots.map((s) => (
              <tr key={s.start_time} className="hover:bg-[#192c3a] text-[#CCD0CF] transition">
                <td className="py-2.5 px-3 font-semibold text-white">
                  {s.start_time.slice(11, 16)}
                </td>
                <td className="py-2.5 px-3 text-[#9BA8AB]">{s.settlement_period || '-'}</td>
                <td className="py-2.5 px-3">
                  {s.forecast_mw != null ? (
                    <span className="font-bold text-[#06B6D4]">{s.forecast_mw.toLocaleString()} MW</span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[#E2856E] text-[11px]">
                      <AlertCircle className="h-3 w-3" />
                      <span>Missing</span>
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {s.actual_mw != null ? (
                    <span className="font-bold text-[#10B981]">{s.actual_mw.toLocaleString()} MW</span>
                  ) : (
                    <span className="text-[#9BA8AB]">N/A</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {s.error_mw != null ? (
                    <span className={`font-semibold ${s.error_mw > 0 ? 'text-[#E2856E]' : 'text-[#06B6D4]'}`}>
                      {s.error_mw > 0 ? `+${s.error_mw}` : s.error_mw} MW
                    </span>
                  ) : (
                    <span className="text-[#9BA8AB]">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3 text-[#9BA8AB] text-[11px]">
                  {s.lower_band_mw != null && s.upper_band_mw != null
                    ? `${s.lower_band_mw} - ${s.upper_band_mw} MW`
                    : '-'}
                </td>
                <td className="py-2.5 px-3 text-[#9BA8AB] text-[11px]">
                  {s.publish_time ? s.publish_time.slice(11, 16) : '-'}
                </td>
                <td className="py-2.5 px-3 text-[#9BA8AB] text-[11px]">
                  {s.lead_hours != null ? `${s.lead_hours} hrs` : '-'}
                </td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onInspectSlot(s.start_time)}
                    className="p-1 rounded bg-[#06141B] hover:bg-[#253745] text-[#CCD0CF] hover:text-white transition cursor-pointer border border-[#253745]"
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
