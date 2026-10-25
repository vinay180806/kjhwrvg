import React from 'react';
import { MetricsSummary } from '../types';
import { Activity, AlertTriangle, TrendingUp, HelpCircle, Layers, CheckCircle2 } from 'lucide-react';

interface KpiGridProps {
  metrics: MetricsSummary | null;
  isLoading: boolean;
}

export const KpiGrid: React.FC<KpiGridProps> = ({ metrics, isLoading }) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 animate-pulse h-24" />
        ))}
      </div>
    );
  }

  const isOverforecast = (metrics.bias_mw ?? 0) > 0;

  const cards = [
    {
      title: 'MAE',
      value: metrics.mae_mw !== null ? `${metrics.mae_mw.toLocaleString()} MW` : 'N/A',
      sub: 'Mean Absolute Error',
      icon: Activity,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      tooltip: 'MAE = mean(|forecast - actual|). Average magnitude of forecast deviation in megawatts.',
    },
    {
      title: 'RMSE',
      value: metrics.rmse_mw !== null ? `${metrics.rmse_mw.toLocaleString()} MW` : 'N/A',
      sub: 'Root Mean Squared Error',
      icon: TrendingUp,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      tooltip: 'RMSE penalizes large forecast outliers heavily. High RMSE indicates volatile forecast spikes.',
    },
    {
      title: 'Bias (Mean Error)',
      value: metrics.bias_mw !== null ? `${metrics.bias_mw > 0 ? '+' : ''}${metrics.bias_mw.toLocaleString()} MW` : 'N/A',
      sub: isOverforecast ? 'Over-forecast' : 'Under-forecast',
      icon: AlertTriangle,
      color: isOverforecast ? 'text-amber-400' : 'text-emerald-400',
      bgColor: isOverforecast ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20',
      tooltip: 'Bias = mean(forecast - actual). Positive means over-forecast (wind generation was lower than expected, requiring additional procurement).',
    },
    {
      title: 'Normalized MAE',
      value: metrics.normalized_mae !== null ? `${(metrics.normalized_mae * 100).toFixed(1)}%` : 'N/A',
      sub: 'Relative to Mean Generation',
      icon: HelpCircle,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/10 border-violet-500/20',
      tooltip: 'Normalized MAE = MAE / mean(actual wind). Measures relative error independent of installed wind capacity.',
    },
    {
      title: 'P90 Error',
      value: metrics.p90_abs_error_mw !== null ? `${metrics.p90_abs_error_mw.toLocaleString()} MW` : 'N/A',
      sub: '90th Percentile Tail Risk',
      icon: Layers,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      tooltip: '90% of slots experienced an absolute forecast error less than this value. Used to size reserve thermal buffers.',
    },
    {
      title: 'Evaluated Slots',
      value: `${metrics.count_used.toLocaleString()}`,
      sub: `${metrics.count_missing} missing slots reported`,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      tooltip: 'Total half-hour delivery slots with valid paired forecast & actual data. Missing slots are tracked without silent filling.',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className="group relative bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`p-1.5 rounded-md ${card.bgColor} ${card.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-white font-mono tracking-tight">{card.value}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate">{card.sub}</div>
            </div>

            {/* Custom Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-slate-800 text-slate-200 text-[11px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-slate-700">
              {card.tooltip}
            </div>
          </div>
        );
      })}
    </div>
  );
};
