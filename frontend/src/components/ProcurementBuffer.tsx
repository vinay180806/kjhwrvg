import React, { useState } from 'react';
import { DayForecastResponse } from '../types';
import { ShoppingCart, ShieldCheck, ArrowRight, Zap, Info } from 'lucide-react';

interface ProcurementBufferProps {
  dayData: DayForecastResponse | null;
}

export const ProcurementBuffer: React.FC<ProcurementBufferProps> = ({ dayData }) => {
  const [demandMw, setDemandMw] = useState<number>(25000);

  if (!dayData || dayData.slots.length === 0) {
    return null;
  }

  const validSlots = dayData.slots.filter(
    (s) => s.forecast_mw != null && s.lower_band_mw != null
  );

  const avgForecast =
    validSlots.length > 0
      ? validSlots.reduce((acc, s) => acc + (s.forecast_mw || 0), 0) / validSlots.length
      : 0;

  const avgLowerBand =
    validSlots.length > 0
      ? validSlots.reduce((acc, s) => acc + (s.lower_band_mw || 0), 0) / validSlots.length
      : 0;

  const expectedProcurement = Math.max(0, Math.round(demandMw - avgForecast));
  const conservativeProcurement = Math.max(0, Math.round(demandMw - avgLowerBand));
  const bufferMargin = Math.max(0, conservativeProcurement - expectedProcurement);

  return (
    <div className="bg-[#11212D] border border-[#253745] rounded-xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#253745] gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded bg-[#06141B] border border-[#253745] text-[#CCD0CF]">
            <ShoppingCart className="h-5 w-5 text-[#E2856E]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Day-Ahead Wholesale Procurement Buffer Calculator
            </h2>
            <p className="text-xs text-[#9BA8AB] mt-0.5">
              Simulate required thermal dispatch & market procurement beyond wind generation for {dayData.delivery_date}
            </p>
          </div>
        </div>

        {/* User Input Demand */}
        <div className="flex items-center space-x-2 bg-[#06141B] px-3 py-1.5 rounded-lg border border-[#253745]">
          <span className="text-xs text-[#9BA8AB] font-medium">Expected Demand:</span>
          <input
            type="number"
            min={1000}
            max={60000}
            step={500}
            value={demandMw}
            onChange={(e) => setDemandMw(Number(e.target.value))}
            className="w-24 bg-[#11212D] border border-[#253745] rounded px-2 py-1 text-xs font-mono text-white text-right font-bold focus:outline-none focus:border-[#06B6D4]"
          />
          <span className="text-xs font-mono text-[#9BA8AB]">MW</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#9BA8AB] mb-1">
            <span className="uppercase text-[10px] tracking-wider font-mono">Expected Residual Procurement</span>
            <Zap className="h-3.5 w-3.5 text-[#06B6D4]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {expectedProcurement.toLocaleString()} <span className="text-sm font-normal text-[#9BA8AB]">MW</span>
          </div>
          <div className="text-[11px] text-[#9BA8AB] mt-1 font-mono">
            Demand ({demandMw.toLocaleString()} MW) - Expected Wind ({Math.round(avgForecast).toLocaleString()} MW)
          </div>
        </div>

        <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#9BA8AB] mb-1">
            <span className="uppercase text-[10px] tracking-wider font-mono">Conservative Risk-Weighted Need</span>
            <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#10B981]">
            {conservativeProcurement.toLocaleString()} <span className="text-sm font-normal text-[#9BA8AB]">MW</span>
          </div>
          <div className="text-[11px] text-[#9BA8AB] mt-1 font-mono">
            Demand ({demandMw.toLocaleString()} MW) - Lower P10 Wind ({Math.round(avgLowerBand).toLocaleString()} MW)
          </div>
        </div>

        <div className="bg-[#3d1f19]/40 border border-[#E2856E]/40 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#E2856E] mb-1">
            <span className="uppercase text-[10px] tracking-wider font-mono font-bold">Recommended Thermal Buffer</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#E2856E]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#E2856E]">
            +{bufferMargin.toLocaleString()} <span className="text-sm font-normal text-[#E2856E]">MW</span>
          </div>
          <div className="text-[11px] text-[#CCD0CF] mt-1 font-mono">
            Downside P10 reserve cushion to avoid imbalance cash-out penalty
          </div>
        </div>
      </div>

      {/* Hourly Schedule Table */}
      <div className="mt-5 overflow-x-auto rounded-lg border border-[#253745]">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#06141B] text-[#9BA8AB] border-b border-[#253745]">
            <tr>
              <th className="py-2 px-3">Time (UTC)</th>
              <th className="py-2 px-3">Period</th>
              <th className="py-2 px-3">Wind Forecast</th>
              <th className="py-2 px-3">Lower Band (P10)</th>
              <th className="py-2 px-3">Expected Procurement</th>
              <th className="py-2 px-3">Conservative Procurement</th>
              <th className="py-2 px-3 text-right">Required Buffer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#253745]/60">
            {dayData.slots.slice(0, 8).map((s) => {
              const fc = s.forecast_mw ?? 0;
              const lb = s.lower_band_mw ?? 0;
              const expNeed = Math.max(0, Math.round(demandMw - fc));
              const consNeed = Math.max(0, Math.round(demandMw - lb));
              const buf = Math.max(0, consNeed - expNeed);

              return (
                <tr key={s.start_time} className="hover:bg-[#192c3a] text-[#CCD0CF] transition">
                  <td className="py-2 px-3 font-semibold text-white">{s.start_time.slice(11, 16)}</td>
                  <td className="py-2 px-3 text-[#9BA8AB]">{s.settlement_period || '-'}</td>
                  <td className="py-2 px-3 text-[#06B6D4]">
                    {s.forecast_mw != null ? `${s.forecast_mw.toLocaleString()} MW` : 'Missing'}
                  </td>
                  <td className="py-2 px-3 text-[#9BA8AB]">
                    {s.lower_band_mw != null ? `${s.lower_band_mw.toLocaleString()} MW` : 'Missing'}
                  </td>
                  <td className="py-2 px-3">{expNeed.toLocaleString()} MW</td>
                  <td className="py-2 px-3 text-[#10B981] font-semibold">{consNeed.toLocaleString()} MW</td>
                  <td className="py-2 px-3 text-right text-[#E2856E] font-bold">+{buf.toLocaleString()} MW</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-[11px] text-[#9BA8AB] p-2 bg-[#06141B] border-t border-[#253745] flex items-center space-x-1">
          <Info className="h-3 w-3 text-[#06B6D4]" />
          <span>Showing first 8 settlement periods. Demand figures are client-specified inputs (no synthetic demand data fabricated).</span>
        </div>
      </div>
    </div>
  );
};
