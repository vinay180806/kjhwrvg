import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DayForecastResponse } from '../types';
import { Eye, Info, Sparkles } from 'lucide-react';

interface DayForecastChartProps {
  dayData: DayForecastResponse | null;
  isLoading: boolean;
  onInspectSlot: (slotIso: string) => void;
}

export const DayForecastChart: React.FC<DayForecastChartProps> = ({
  dayData,
  isLoading,
  onInspectSlot,
}) => {
  if (isLoading || !dayData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-96 flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
          <span>Loading delivery day forecast & actuals...</span>
        </div>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = dayData.slots.map((s) => {
    // Extract HH:MM
    const timeStr = s.start_time.slice(11, 16);
    return {
      time: timeStr,
      fullTime: s.start_time,
      forecast: s.forecast_mw,
      actual: s.actual_mw,
      lowerBand: s.lower_band_mw,
      upperBand: s.upper_band_mw,
      bandSpan: (s.lower_band_mw !== null && s.upper_band_mw !== null && s.upper_band_mw !== undefined && s.lower_band_mw !== undefined)
        ? Math.max(0, s.upper_band_mw - s.lower_band_mw)
        : null,
      error: s.error_mw,
      publishTime: s.publish_time,
      leadHours: s.lead_hours,
      period: s.settlement_period,
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-mono font-bold text-white text-sm">{label} UTC</span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              Period {data.period || 'N/A'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-cyan-400">
              <span>Cutoff Forecast:</span>
              <span className="font-bold">
                {data.forecast !== null && data.forecast !== undefined ? `${data.forecast.toLocaleString()} MW` : 'Missing'}
              </span>
            </div>

            <div className="flex justify-between items-center text-emerald-400">
              <span>Actual Generation:</span>
              <span className="font-bold">
                {data.actual !== null && data.actual !== undefined ? `${data.actual.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            {data.error !== null && data.error !== undefined && (
              <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-slate-800">
                <span>Signed Error:</span>
                <span className={`font-bold ${data.error > 0 ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {data.error > 0 ? `+${data.error}` : data.error} MW
                </span>
              </div>
            )}

            {data.lowerBand !== null && data.upperBand !== null && (
              <div className="flex justify-between items-center text-slate-400 text-[10px] pt-1">
                <span>P10 - P90 Band:</span>
                <span>{data.lowerBand} - {data.upperBand} MW</span>
              </div>
            )}

            {data.publishTime && (
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                Vintage: {data.publishTime.slice(11, 16)} UTC ({data.leadHours}h lead)
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-emerald-400/80 flex items-center justify-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>Click slot to inspect forecast vintages</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              Day-Ahead Wind Forecast vs Actual Generation
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {dayData.delivery_date}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            48 half-hour settlement periods aligned with decision cutoff on D-1
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">Forecast (MW)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">Actual (MW)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2.5 w-6 rounded bg-cyan-500/20 border border-cyan-500/30" />
            <span className="text-slate-400">P10-P90 Band</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={(state) => {
              if (state && state.activePayload && state.activePayload.length) {
                const clicked = state.activePayload[0].payload;
                onInspectSlot(clicked.fullTime);
              }
            }}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
              interval={3}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              unit=" MW"
              width={65}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Empirical Uncertainty Range: Stacked Area representation */}
            <Area
              type="monotone"
              dataKey="lowerBand"
              stackId="band"
              stroke="none"
              fill="transparent"
            />
            <Area
              type="monotone"
              dataKey="bandSpan"
              stackId="band"
              stroke="#38bdf8"
              strokeDasharray="2 2"
              strokeOpacity={0.4}
              fill="#38bdf8"
              fillOpacity={0.08}
              name="Empirical P10-P90 Band"
            />

            {/* Actual Wind Generation Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
              name="Actual Generation"
              connectNulls={false}
            />

            {/* Cutoff Forecast Wind Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#38bdf8"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#38bdf8' }}
              activeDot={{ r: 5, fill: '#38bdf8', stroke: '#082f49', strokeWidth: 2 }}
              name="Cutoff-Aligned Forecast"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Caption & Metadata Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
          <span>
            <strong className="text-slate-300">Decision Cutoff Applied:</strong> {dayData.cutoff_datetime_iso.replace('T', ' ')} London (D-{dayData.days_before}).
            Only forecasts published on or before cutoff are included.
          </span>
        </div>
        <div className="text-slate-400 font-mono text-[10px]">
          Slots Available: <span className="text-emerald-400">{dayData.available_forecasts_count}/48</span>
          {dayData.missing_forecasts_count > 0 && (
            <span className="text-amber-400 ml-2">({dayData.missing_forecasts_count} missing slots)</span>
          )}
        </div>
      </div>
    </div>
  );
};
