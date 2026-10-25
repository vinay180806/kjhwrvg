import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { DaysMetricsResponse } from '../types';

interface DailyMetricsChartProps {
  data: DaysMetricsResponse | null;
  isLoading: boolean;
}

export const DailyMetricsChart: React.FC<DailyMetricsChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="bg-[#11212D] border border-[#253745] rounded-xl p-5 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-[#9BA8AB]">Loading daily metrics breakdown...</span>
      </div>
    );
  }

  const chartData = data.days.map((d) => ({
    date: d.delivery_date.slice(5),
    fullDate: d.delivery_date,
    mae: d.metrics.mae_mw,
    bias: d.metrics.bias_mw,
    count: d.metrics.count_used,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-[#06141B]/95 border border-[#4A5C6A] rounded-xl p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="font-bold text-white mb-1.5 border-b border-[#253745] pb-1">{p.fullDate}</div>
          <div className="text-[#06B6D4]">MAE: <span className="font-bold">{p.mae !== null ? `${p.mae} MW` : 'N/A'}</span></div>
          <div className="text-[#E2856E]">Bias: <span className="font-bold">{p.bias !== null ? `${p.bias > 0 ? '+' : ''}${p.bias} MW` : 'N/A'}</span></div>
          <div className="text-[#9BA8AB] text-[10px] mt-1">Evaluated Slots: {p.count}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#11212D] border border-[#253745] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Daily Error Dynamics (MAE & Bias)</h3>
          <p className="text-xs text-[#9BA8AB] mt-0.5">Tracking day-to-day forecast volatility across January</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-[#06B6D4]" />
            <span className="text-[#CCD0CF]">MAE (MW)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-[#E2856E]" />
            <span className="text-[#CCD0CF]">Bias (MW)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full mt-3 bg-[#06141B] rounded-lg p-2 border border-[#253745]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="#253745" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#9BA8AB"
              tick={{ fontSize: 10, fill: '#9BA8AB', fontFamily: 'JetBrains Mono' }}
              interval="preserveStartEnd"
              tickLine={false}
            />
            <YAxis
              stroke="#9BA8AB"
              tick={{ fontSize: 10, fill: '#9BA8AB', fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => `${v}`}
              unit=" MW"
              width={55}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#4A5C6A" strokeDasharray="2 2" />
            <Bar dataKey="mae" fill="#06B6D4" radius={[3, 3, 0, 0]} fillOpacity={0.8} />
            <Line type="monotone" dataKey="bias" stroke="#E2856E" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-[#9BA8AB] mt-2 text-center font-mono">
        Bars indicate Mean Absolute Error; coral line indicates Bias (+ indicates over-forecast deficit).
      </div>
    </div>
  );
};
