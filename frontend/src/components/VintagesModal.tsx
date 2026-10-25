import React, { useEffect, useState } from 'react';
import { SlotVintagesResponse } from '../types';
import { fetchSlotVintages } from '../api';
import { X, History, CheckCircle2, Sparkles } from 'lucide-react';

interface VintagesModalProps {
  date: string;
  slotIso: string | null;
  cutoffTime: string;
  daysBefore: number;
  onClose: () => void;
}

export const VintagesModal: React.FC<VintagesModalProps> = ({
  date,
  slotIso,
  cutoffTime,
  daysBefore,
  onClose,
}) => {
  const [data, setData] = useState<SlotVintagesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slotIso) return;
    setIsLoading(true);
    setError(null);
    fetchSlotVintages(date, slotIso, cutoffTime, daysBefore)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [date, slotIso, cutoffTime, daysBefore]);

  if (!slotIso) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Forecast Evolution across Vintages
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Target Slot: {slotIso.slice(0, 10)} {slotIso.slice(11, 16)} UTC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isLoading && (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-400 animate-spin" />
              <span>Loading forecast vintage history...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Summary Banner */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400">Actual Outturn:</span>{' '}
                  <span className="font-bold text-emerald-400">
                    {data.actual_mw !== null ? `${data.actual_mw.toLocaleString()} MW` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Decision Cutoff:</span>{' '}
                  <span className="font-bold text-cyan-400">
                    {data.cutoff_datetime_iso.slice(0, 10)} {data.cutoff_datetime_iso.slice(11, 16)}
                  </span>
                </div>
              </div>

              {/* Vintages Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Publish Time (UTC)</th>
                      <th className="py-2.5 px-3">Forecast (MW)</th>
                      <th className="py-2.5 px-3">Lead Time</th>
                      <th className="py-2.5 px-3 text-right">Gate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.vintages.map((v, i) => (
                      <tr
                        key={i}
                        className={`transition ${
                          v.is_used_at_cutoff
                            ? 'bg-cyan-500/10 font-semibold text-cyan-300 border-l-2 border-l-cyan-400'
                            : 'hover:bg-slate-800/30 text-slate-300'
                        }`}
                      >
                        <td className="py-2.5 px-3">{v.publish_time.replace('T', ' ').replace('Z', '')}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{v.generation_mw.toLocaleString()} MW</td>
                        <td className="py-2.5 px-3 text-slate-400">{v.lead_hours} hrs</td>
                        <td className="py-2.5 px-3 text-right">
                          {v.is_used_at_cutoff ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 text-[10px] border border-cyan-400/30">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Locked at Cutoff</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">
                              {v.lead_hours < 24 ? 'Intraday Revision' : 'Prior Vintage'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
