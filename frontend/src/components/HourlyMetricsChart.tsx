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
      <div className="bg-[#11212D] border border-[#253745] rounded-xl p-5 h-80 flex items-center justify-center animate-pulse">
        <span className="text-xs text-[#9BA8AB]">Loading hourly error profile...</span>
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
        <div className="bg-[#06141B]/95 border border-[#4A5C6A] rounded-xl p-3 shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="font-bold text-white mb-1.5 border-b border-[#253745] pb-1">{p.label} (London Time)</div>
          <div className="text-[#06B6D4]">Hourly MAE: <span className="font-bold">{p.mae !== null ? `${p.mae} MW` : 'N/A'}</span></div>
          <div className="text-[#E2856E]">Hourly Bias: <span className="font-bold">{p.bias !== null ? `${p.bias > 0 ? '+' : ''}${p.bias} MW` : 'N/A'}</span></div>
          <div className="text-[#9BA8AB] text-[10px] mt-1">Sample Slots: {p.count}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#11212D] border border-[#253745] rounded-xl p-5 shadow-lg flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#253745]">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Intraday Error Profile by Hour of Day</h3>
          <p className="text-xs text-[#9BA8AB] mt-0.5">Identifies peak-demand and ramp hours with highest forecast uncertainty</p>
        </div>
        <div className="text-xs font-mono text-[#9BA8AB]">00:00 to 23:00</div>
      </div>

      <div className="h-64 w-full mt-3 bg-[#06141B] rounded-lg p-2 border border-[#253745]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 3" stroke="#253745" vertical={false} opacity={0.6} />
            <XAxis
              dataKey="hour"
              stroke="#9BA8AB"
              tick={{ fontSize: 10, fill: '#9BA8AB', fontFamily: 'JetBrains Mono' }}
              interval={2}
              tickLine={false}
            />
            <YAxis
              stroke="#9BA8AB"
              tick={{ fontSize: 10, fill: '#9BA8AB', fontFamily: 'JetBrains Mono' }}
              unit=" MW"
              width={55}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#4A5C6A" strokeDasharray="2 2" />
            <Bar dataKey="mae" fill="#CCD0CF" radius={[3, 3, 0, 0]} fillOpacity={0.85} name="MAE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-[11px] text-[#9BA8AB] mt-2 text-center font-mono">
        Higher MAE during morning ramp (07:00-09:00) and evening peak (17:00-19:00) requires conservative procurement buffers.
      </div>
    </div>
  );
};
