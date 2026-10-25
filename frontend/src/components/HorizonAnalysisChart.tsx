import React, { useState } from 'react';
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from 'recharts';
import { HorizonMetricsResponse } from '../types';
import { Compass, Sparkles } from 'lucide-react';

interface HorizonAnalysisChartProps {
  data: HorizonMetricsResponse | null;
  isLoading: boolean;
}

export const HorizonAnalysisChart: React.FC<HorizonAnalysisChartProps> = ({ data, isLoading }) => {
  const [activeMetric, setActiveMetric] = useState<'mae' | 'rmse' | 'p90'>('mae');

  if (isLoading || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-slate-500">Loading forecast horizon analysis...</span>
      </div>
    );
  }

  const chartData = data.buckets.map((b) => ({
    bucket: b.bucket,
    mae: b.mae_mw,
    rmse: b.rmse_mw,
    bias: b.bias_mw,
    p90: b.p90_abs_error_mw,
    count: b.count,
  }));

  const metricConfig = {
    mae: { label: 'MAE', key: 'mae', color: '#38bdf8', unit: 'MW' },
    rmse: { label: 'RMSE', key: 'rmse', color: '#818cf8', unit: 'MW' },
    p90: { label: 'P90 Error', key: 'p90', color: '#f43f5e', unit: 'MW' },
  };

  const current = metricConfig[activeMetric];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="font-bold text-white mb-1.5 border-b border-slate-800 pb-1">
            Lead Time: {label}
          </div>
          <div className="text-cyan-400">MAE: <span className="font-bold">{p.mae !== null ? `${p.mae} MW` : 'N/A'}</span></div>
          <div className="text-indigo-400">RMSE: <span className="font-bold">{p.rmse !== null ? `${p.rmse} MW` : 'N/A'}</span></div>
          <div className="text-rose-400">P90 Tail: <span className="font-bold">{p.p90 !== null ? `${p.p90} MW` : 'N/A'}</span></div>
          <div className="text-amber-400">Bias: <span className="font-bold">{p.bias !== null ? `${p.bias > 0 ? '+' : ''}${p.bias} MW` : 'N/A'}</span></div>
          <div className="text-slate-400 text-[10px] mt-1">Total Forecast Vintages: {p.count.toLocaleString()}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Horizon Degradation: Error vs Lead Time
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluates all published vintages ({data.total_samples.toLocaleString()} forecasts)
            </p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {(['mae', 'rmse', 'p90'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`px-2.5 py-1 rounded-md font-mono transition-all ${
                activeMetric === m
                  ? 'bg-slate-800 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {metricConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full mt-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="bucket"
              stroke="#64748b"
              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
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
            <Bar
              dataKey={current.key}
              fill={current.color}
              radius={[4, 4, 0, 0]}
              fillOpacity={0.85}
              name={current.label}
            />
            <Line
              type="monotone"
              dataKey={current.key}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 3, fill: current.color }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Takeaway Box */}
      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start space-x-2.5">
        <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-slate-300">
          <strong className="text-emerald-400">Quantitative Insight:</strong> {data.takeaway}
        </div>
      </div>
    </div>
  );
};
