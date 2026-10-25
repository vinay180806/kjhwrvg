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

  // Calculate day totals or peak hour values
  const validSlots = dayData.slots.filter(
    (s) => s.forecast_mw !== null && s.lower_band_mw !== null
  );

  const avgForecast = validSlots.length > 0
    ? validSlots.reduce((acc, s) => acc + (s.forecast_mw || 0), 0) / validSlots.length
    : 0;

  const avgLowerBand = validSlots.length > 0
    ? validSlots.reduce((acc, s) => acc + (s.lower_band_mw || 0), 0) / validSlots.length
    : 0;

  // Expected procurement = Demand - Forecast Wind
  const expectedProcurement = Math.max(0, Math.round(demandMw - avgForecast));
  // Conservative procurement = Demand - Lower Band
  const conservativeProcurement = Math.max(0, Math.round(demandMw - avgLowerBand));
  const bufferMargin = Math.max(0, conservativeProcurement - expectedProcurement);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Day-Ahead Wholesale Procurement Buffer Calculator
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate required thermal / market procurement beyond wind generation for {dayData.delivery_date}
            </p>
          </div>
        </div>

        {/* User Input Demand */}
        <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Expected Demand:</span>
          <input
            type="number"
            min={1000}
            max={60000}
            step={500}
            value={demandMw}
            onChange={(e) => setDemandMw(Number(e.target.value))}
            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white text-right font-bold focus:outline-none focus:border-amber-400"
          />
          <span className="text-xs font-mono text-slate-400">MW</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Expected Residual Procurement</span>
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {expectedProcurement.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Demand ({demandMw.toLocaleString()} MW) - Expected Wind ({Math.round(avgForecast).toLocaleString()} MW)
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Conservative Risk-Weighted Need</span>
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {conservativeProcurement.toLocaleString()} <span className="text-sm font-normal text-slate-400">MW</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Demand ({demandMw.toLocaleString()} MW) - Lower P10 Wind ({Math.round(avgLowerBand).toLocaleString()} MW)
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span>Recommended Thermal / Flexibility Buffer</span>
            <ArrowRight className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            +{bufferMargin.toLocaleString()} <span className="text-sm font-normal text-amber-300">MW</span>
          </div>
          <div className="text-[11px] text-amber-200/70 mt-1">
            P10 reserve margin to hedge against wind forecast shortfall
          </div>
        </div>
      </div>

      {/* Hourly Schedule Table Preview */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
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
          <tbody className="divide-y divide-slate-800/60">
            {dayData.slots.slice(0, 8).map((s) => {
              const fc = s.forecast_mw ?? 0;
              const lb = s.lower_band_mw ?? 0;
              const expNeed = Math.max(0, Math.round(demandMw - fc));
              const consNeed = Math.max(0, Math.round(demandMw - lb));
              const buf = Math.max(0, consNeed - expNeed);

              return (
                <tr key={s.start_time} className="hover:bg-slate-800/40 text-slate-300">
                  <td className="py-2 px-3 font-semibold text-white">{s.start_time.slice(11, 16)}</td>
                  <td className="py-2 px-3 text-slate-400">{s.settlement_period || '-'}</td>
                  <td className="py-2 px-3 text-cyan-400">{s.forecast_mw != null ? `${s.forecast_mw.toLocaleString()} MW` : 'Missing'}</td>
                  <td className="py-2 px-3 text-slate-400">{s.lower_band_mw != null ? `${s.lower_band_mw.toLocaleString()} MW` : 'Missing'}</td>
                  <td className="py-2 px-3">{expNeed.toLocaleString()} MW</td>
                  <td className="py-2 px-3 text-emerald-400 font-semibold">{consNeed.toLocaleString()} MW</td>
                  <td className="py-2 px-3 text-right text-amber-400 font-bold">+{buf.toLocaleString()} MW</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1">
          <Info className="h-3 w-3" />
          <span>Showing first 8 settlement periods. Demand figures are client-specified inputs (no synthetic demand data fabricated).</span>
        </div>
      </div>
    </div>
  );
};
