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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11212D] border border-[#4A5C6A] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#253745] flex items-center justify-between bg-[#06141B]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-[#11212D] border border-[#253745] text-[#10B981]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Forecast Evolution across Vintages
              </h3>
              <p className="text-xs text-[#9BA8AB] font-mono">
                Target Slot: {slotIso.slice(0, 10)} {slotIso.slice(11, 16)} UTC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#11212D] hover:bg-[#253745] text-[#9BA8AB] hover:text-white transition cursor-pointer border border-[#253745]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {isLoading && (
            <div className="py-12 text-center text-[#9BA8AB] flex items-center justify-center space-x-2">
              <Sparkles className="h-4 w-4 text-[#10B981] animate-spin" />
              <span>Loading forecast vintage history...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-[#3d1f19] border border-[#E2856E]/40 text-[#E2856E] text-xs">
              {error}
            </div>
          )}

          {data && (
            <>
              {/* Summary Banner */}
              <div className="grid grid-cols-2 gap-3 bg-[#06141B] p-3 rounded-lg border border-[#253745] text-xs font-mono">
                <div>
                  <span className="text-[#9BA8AB]">Actual Outturn:</span>{' '}
                  <span className="font-bold text-[#10B981]">
                    {data.actual_mw !== null ? `${data.actual_mw.toLocaleString()} MW` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[#9BA8AB]">Decision Cutoff:</span>{' '}
                  <span className="font-bold text-[#06B6D4]">
                    {data.cutoff_datetime_iso.slice(0, 10)} {data.cutoff_datetime_iso.slice(11, 16)}
                  </span>
                </div>
              </div>

              {/* Vintages Table */}
              <div className="border border-[#253745] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#06141B] text-[#9BA8AB] border-b border-[#253745]">
                    <tr>
                      <th className="py-2.5 px-3">Publish Time (UTC)</th>
                      <th className="py-2.5 px-3">Forecast (MW)</th>
                      <th className="py-2.5 px-3">Lead Time</th>
                      <th className="py-2.5 px-3 text-right">Gate Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#253745]/60">
                    {data.vintages.map((v, i) => (
                      <tr
                        key={i}
                        className={`transition ${
                          v.is_used_at_cutoff
                            ? 'bg-[#06B6D4]/10 font-semibold text-[#06B6D4] border-l-2 border-l-[#06B6D4]'
                            : 'hover:bg-[#192c3a] text-[#CCD0CF]'
                        }`}
                      >
                        <td className="py-2.5 px-3">{v.publish_time.replace('T', ' ').replace('Z', '')}</td>
                        <td className="py-2.5 px-3 font-bold text-white">{v.generation_mw.toLocaleString()} MW</td>
                        <td className="py-2.5 px-3 text-[#9BA8AB]">{v.lead_hours} hrs</td>
                        <td className="py-2.5 px-3 text-right">
                          {v.is_used_at_cutoff ? (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#06B6D4]/20 text-[#06B6D4] text-[10px] border border-[#06B6D4]/40">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Locked at Cutoff</span>
                            </span>
                          ) : (
                            <span className="text-[#9BA8AB] text-[10px]">
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
