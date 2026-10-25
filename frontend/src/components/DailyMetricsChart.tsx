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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-500">Loading daily metrics breakdown...</span>
      </div>
    );
  }

  const chartData = data.days.map((d) => ({
    date: d.delivery_date.slice(5), // MM-DD
    fullDate: d.delivery_date,
    mae: d.metrics.mae_mw,
    bias: d.metrics.bias_mw,
    count: d.metrics.count_used,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">{p.fullDate}</div>
          <div className="text-cyan-400">MAE: <span className="font-bold">{p.mae !== null ? `${p.mae} MW` : 'N/A'}</span></div>
          <div className="text-amber-400">Bias: <span className="font-bold">{p.bias !== null ? `${p.bias > 0 ? '+' : ''}${p.bias} MW` : 'N/A'}</span></div>
          <div className="text-slate-400 text-[10px] mt-1">Evaluated Slots: {p.count}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Daily Error Dynamics (MAE & Bias)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Tracking day-to-day forecast volatility across January</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-cyan-400" />
            <span className="text-slate-300">MAE (MW)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="h-2 w-2 rounded bg-amber-400" />
            <span className="text-slate-300">Bias (MW)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              interval="preserveStartEnd"
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              tickFormatter={(v) => `${v}`}
              unit=" MW"
              width={55}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
            <Bar dataKey="mae" fill="#38bdf8" radius={[4, 4, 0, 0]} fillOpacity={0.8} />
            <Line type="monotone" dataKey="bias" stroke="#fbbf24" strokeWidth={2} dot={{ r: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-400 mt-2 text-center">
        Bars show Mean Absolute Error; orange line shows Bias (+ indicates over-forecast).
      </div>
    </div>
  );
};
