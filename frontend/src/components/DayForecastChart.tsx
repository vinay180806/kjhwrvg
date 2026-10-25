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
      <div className="bg-[#11212D] border border-[#253745] rounded-xl p-6 h-96 flex items-center justify-center">
        <div className="text-[#9BA8AB] text-sm animate-pulse flex items-center space-x-2">
          <Sparkles className="h-4 w-4 text-[#10B981] animate-spin" />
          <span>Loading delivery day forecast & actuals...</span>
        </div>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = dayData.slots.map((s) => {
    const timeStr = s.start_time.slice(11, 16);
    return {
      time: timeStr,
      fullTime: s.start_time,
      forecast: s.forecast_mw,
      actual: s.actual_mw,
      lowerBand: s.lower_band_mw,
      upperBand: s.upper_band_mw,
      bandSpan:
        s.lower_band_mw != null && s.upper_band_mw != null
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
        <div className="bg-[#06141B]/95 border border-[#4A5C6A] rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs min-w-[220px]">
          <div className="flex items-center justify-between border-b border-[#253745] pb-2 mb-2">
            <span className="font-mono font-bold text-white text-sm">{label} UTC</span>
            <span className="text-[10px] text-[#9BA8AB] bg-[#11212D] px-1.5 py-0.5 rounded border border-[#253745]">
              SP {data.period || 'N/A'}
            </span>
          </div>

          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between items-center text-[#06B6D4]">
              <span>Cutoff Forecast:</span>
              <span className="font-bold">
                {data.forecast != null ? `${data.forecast.toLocaleString()} MW` : 'Missing'}
              </span>
            </div>

            <div className="flex justify-between items-center text-[#10B981]">
              <span>Actual Generation:</span>
              <span className="font-bold">
                {data.actual != null ? `${data.actual.toLocaleString()} MW` : 'N/A'}
              </span>
            </div>

            {data.error != null && (
              <div className="flex justify-between items-center text-[#CCD0CF] pt-1 border-t border-[#253745]">
                <span>Signed Error:</span>
                <span className={`font-bold ${data.error > 0 ? 'text-[#E2856E]' : 'text-[#06B6D4]'}`}>
                  {data.error > 0 ? `+${data.error}` : data.error} MW
                </span>
              </div>
            )}

            {data.lowerBand != null && data.upperBand != null && (
              <div className="flex justify-between items-center text-[#9BA8AB] text-[10px] pt-1">
                <span>P10 - P90 Band:</span>
                <span>{data.lowerBand} - {data.upperBand} MW</span>
              </div>
            )}

            {data.publishTime && (
              <div className="text-[10px] text-[#9BA8AB] pt-1 border-t border-[#253745]/80">
                Vintage: {data.publishTime.slice(11, 16)} UTC ({data.leadHours}h lead)
              </div>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#253745] text-[10px] text-[#10B981] flex items-center justify-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>Click slot to inspect forecast vintages</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#11212D] border border-[#253745] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#253745] gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-tight">
              48-Settlement-Period Wind Forecast vs Actual Generation
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#06141B] text-[#CCD0CF] font-mono border border-[#253745]">
              {dayData.delivery_date}
            </span>
          </div>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Elexon BMRS half-hourly curve aligned with D-1 {dayData.cutoff_time} London cutoff
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-[#06B6D4]" />
            <span className="text-[#CCD0CF]">Forecast (MW)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span className="text-[#CCD0CF]">Actual (MW)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-2 w-5 rounded bg-[#4A5C6A]/40 border border-[#4A5C6A]/60" />
            <span className="text-[#9BA8AB]">P10-P90 Envelope</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-80 w-full mt-4 bg-[#06141B] rounded-lg p-2 border border-[#253745]">
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
            <CartesianGrid strokeDasharray="2 3" stroke="#253745" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="time"
              stroke="#9BA8AB"
              tick={{ fontSize: 10, fill: '#9BA8AB', fontFamily: 'JetBrains Mono' }}
              interval={3}
              tickLine={false}
            />
            <YAxis
              stroke="#9BA8AB"
              tick={{ fontSize: 10, fill: '#9BA8AB', fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`}
              unit=" MW"
              width={65}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Empirical P10-P90 Band */}
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
              stroke="#4A5C6A"
              strokeDasharray="2 2"
              strokeOpacity={0.6}
              fill="#4A5C6A"
              fillOpacity={0.15}
              name="Empirical P10-P90 Band"
            />

            {/* Actual Wind Generation Line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#10B981', stroke: '#06141B', strokeWidth: 2 }}
              name="Actual Generation"
              connectNulls={false}
            />

            {/* Cutoff Forecast Wind Line */}
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#06B6D4"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#06B6D4' }}
              activeDot={{ r: 5, fill: '#06B6D4', stroke: '#06141B', strokeWidth: 2 }}
              name="Cutoff-Aligned Forecast"
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Caption & Metadata Footer */}
      <div className="mt-3 pt-3 border-t border-[#253745] text-[11px] text-[#9BA8AB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" />
          <span>
            <strong className="text-white">Decision Cutoff Applied:</strong> {dayData.cutoff_datetime_iso.replace('T', ' ')} London (D-{dayData.days_before}).
            Zero lookahead leakage guaranteed.
          </span>
        </div>
        <div className="text-[#9BA8AB] font-mono text-[10px]">
          Available Slots: <span className="text-[#10B981]">{dayData.available_forecasts_count}/48</span>
          {dayData.missing_forecasts_count > 0 && (
            <span className="text-[#E2856E] ml-2">({dayData.missing_forecasts_count} missing half-hours)</span>
          )}
        </div>
      </div>
    </div>
  );
};
