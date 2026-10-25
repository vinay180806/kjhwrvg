import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { HoursMetricsResponse } from '../types';

interface HourlyMetricsChartProps {
  data: HoursMetricsResponse | null;
  isLoading: boolean;
}

export const HourlyMetricsChart: React.FC<HourlyMetricsChartProps> = ({ data, isLoading }) => {
  if (isLoading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-500">Loading hourly error profile...</span>
      </div>
    );
  }

  const chartData = data.hours.map((h) => ({
    hour: `${h.hour.toString().padStart(2, '0')}:00`,
    label: h.label,
    mae: h.metrics.mae_mw,
    bias: h.metrics.bias_mw,
    count: h.metrics.count_used,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">{p.label} (London Time)</div>
          <div className="text-cyan-400">Hourly MAE: <span className="font-bold">{p.mae !== null ? `${p.mae} MW` : 'N/A'}</span></div>
          <div className="text-amber-400">Hourly Bias: <span className="font-bold">{p.bias !== null ? `${p.bias > 0 ? '+' : ''}${p.bias} MW` : 'N/A'}</span></div>
          <div className="text-slate-400 text-[10px] mt-1">Sample Slots: {p.count}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Intraday Error Profile by Hour of Day</h3>
          <p className="text-xs text-slate-400 mt-0.5">Identifies peak-demand and ramp hours with highest forecast uncertainty</p>
        </div>
        <div className="text-xs font-mono text-slate-400">00:00 to 23:00</div>
      </div>

      <div className="h-64 w-full mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              interval={2}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'monospace' }}
              unit=" MW"
              width={55}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#475569" strokeDasharray="2 2" />
            <Bar dataKey="mae" fill="#818cf8" radius={[4, 4, 0, 0]} fillOpacity={0.85} name="MAE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-slate-400 mt-2 text-center">
        Higher MAE during morning ramp (07:00-09:00) and evening peak (17:00-19:00) requires conservative procurement buffers.
      </div>
    </div>
  );
};
