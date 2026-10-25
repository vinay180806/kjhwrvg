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
          <div key={i} className="bg-[#11212D] border border-[#253745] rounded-xl p-4 animate-pulse h-24" />
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
      color: 'text-[#06B6D4]',
      bgColor: 'bg-[#06B6D4]/10 border-[#06B6D4]/20',
      barColor: 'bg-[#06B6D4]',
      barWidth: '65%',
      tooltip: 'MAE = mean(|forecast - actual|). Average magnitude of forecast deviation in megawatts.',
    },
    {
      title: 'RMSE',
      value: metrics.rmse_mw !== null ? `${metrics.rmse_mw.toLocaleString()} MW` : 'N/A',
      sub: 'Root Mean Squared Error',
      icon: TrendingUp,
      color: 'text-[#CCD0CF]',
      bgColor: 'bg-[#253745] border-[#4A5C6A]',
      barColor: 'bg-[#CCD0CF]',
      barWidth: '78%',
      tooltip: 'RMSE penalizes large forecast outliers heavily. High RMSE indicates volatile forecast spikes.',
    },
    {
      title: 'Bias (Mean Error)',
      value: metrics.bias_mw !== null ? `${metrics.bias_mw > 0 ? '+' : ''}${metrics.bias_mw.toLocaleString()} MW` : 'N/A',
      sub: isOverforecast ? 'Over-forecast Deficit' : 'Under-forecast Surplus',
      icon: AlertTriangle,
      color: isOverforecast ? 'text-[#E2856E]' : 'text-[#10B981]',
      bgColor: isOverforecast ? 'bg-[#3d1f19] border-[#E2856E]/40' : 'bg-[#10B981]/10 border-[#10B981]/20',
      barColor: isOverforecast ? 'bg-[#E2856E]' : 'bg-[#10B981]',
      barWidth: '45%',
      tooltip: 'Bias = mean(forecast - actual). Positive means over-forecast (wind generation was lower than expected, requiring additional procurement).',
    },
    {
      title: 'Normalized MAE',
      value: metrics.normalized_mae !== null ? `${(metrics.normalized_mae * 100).toFixed(1)}%` : 'N/A',
      sub: 'Relative to Mean Generation',
      icon: HelpCircle,
      color: 'text-[#9BA8AB]',
      bgColor: 'bg-[#192c3a] border-[#253745]',
      barColor: 'bg-[#9BA8AB]',
      barWidth: `${Math.min(100, Math.round((metrics.normalized_mae ?? 0.2) * 100))}%`,
      tooltip: 'Normalized MAE = MAE / mean(actual wind). Measures relative error independent of installed wind capacity.',
    },
    {
      title: 'P90 Error',
      value: metrics.p90_abs_error_mw !== null ? `${metrics.p90_abs_error_mw.toLocaleString()} MW` : 'N/A',
      sub: '90th Percentile Tail Risk',
      icon: Layers,
      color: 'text-[#E2856E]',
      bgColor: 'bg-[#3d1f19] border-[#E2856E]/40',
      barColor: 'bg-[#E2856E]',
      barWidth: '90%',
      tooltip: '90% of slots experienced an absolute forecast error less than this value. Used to size reserve thermal buffers.',
    },
    {
      title: 'Evaluated Slots',
      value: `${metrics.count_used.toLocaleString()}`,
      sub: `${metrics.count_missing} missing slots reported`,
      icon: CheckCircle2,
      color: 'text-[#10B981]',
      bgColor: 'bg-[#10B981]/10 border-[#10B981]/20',
      barColor: 'bg-[#10B981]',
      barWidth: '100%',
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
            className="group relative bg-[#11212D] border border-[#253745] hover:border-[#4A5C6A] rounded-xl p-3.5 transition-all shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#9BA8AB]">{card.title}</span>
                <div className={`p-1.5 rounded border ${card.bgColor} ${card.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="text-lg font-bold text-white font-mono tracking-tight">{card.value}</div>
              <div className="text-[11px] text-[#9BA8AB] mt-0.5 truncate">{card.sub}</div>
            </div>

            {/* Metric Level Micro-Bar */}
            <div className="w-full bg-[#06141B] h-1 rounded-full mt-2.5 overflow-hidden border border-[#253745]/50">
              <div className={`${card.barColor} h-full rounded-full`} style={{ width: card.barWidth }} />
            </div>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-[#06141B] text-[#CCD0CF] text-[11px] rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 border border-[#4A5C6A]">
              {card.tooltip}
            </div>
          </div>
        );
      })}
    </div>
  );
};
