import React from 'react';
import { HelpCircle, Scale, ShieldAlert, BookOpen, Database } from 'lucide-react';

export const AssumptionsPanel: React.FC = () => {
  return (
    <div className="bg-[#11212D] border border-[#253745] rounded-xl p-6 shadow-lg">
      <div className="flex items-center space-x-2.5 pb-4 border-b border-[#253745]">
        <div className="p-1.5 rounded bg-[#06141B] border border-[#253745] text-[#10B981]">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Methodological Assumptions & Operating Notes
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            Institutional operational framework designed for energy utility day-ahead trading desks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Assumption 1: Cutoff */}
        <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#06B6D4] mb-2">
              <Scale className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Decision Cutoff (09:00 D-1)</h3>
            </div>
            <p className="text-xs text-[#CCD0CF] leading-relaxed">
              Default cutoff is set to <strong>09:00 London local time on Day D-1</strong>.
              UK day-ahead wholesale power auction gate closures occur in the morning
              (EPEX SPOT GB Day-Ahead gate at 09:20; Nord Pool GB at 09:50). A 09:00 cutoff
              leaves a realistic 20-50 minute operational safety buffer to compute net residual
              procurement and submit binding bids.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#253745] text-[10px] text-[#9BA8AB] font-mono">
            Configurable via cutoff time & days before controls.
          </div>
        </div>

        {/* Assumption 2: Error Convention */}
        <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#E2856E] mb-2">
              <ShieldAlert className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Error Sign Convention</h3>
            </div>
            <p className="text-xs text-[#CCD0CF] leading-relaxed">
              Defined uniformly as: <code className="text-[#E2856E] font-mono">error = forecast - actual (MW)</code>.
              <br /><br />
              <strong>Positive (+):</strong> Over-forecast. Actual wind outturn was lower than predicted.
              The utility faces an electricity deficit and must procure additional balancing power.
              <br />
              <strong>Negative (-):</strong> Under-forecast. Actual wind exceeded predicted levels.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#253745] text-[10px] text-[#9BA8AB] font-mono">
            Standard convention applied across all API endpoints & charts.
          </div>
        </div>

        {/* Assumption 3: Uncertainty Band */}
        <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#CCD0CF] mb-2">
              <HelpCircle className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Empirical P10-P90 Bands</h3>
            </div>
            <p className="text-xs text-[#CCD0CF] leading-relaxed">
              Uncertainty bands reflect the <strong>empirical 10th and 90th percentiles of historical signed residuals</strong>{' '}
              <code className="text-[#06B6D4] font-mono">(actual - forecast)</code> observed across the evaluated historical dataset.
              <br /><br />
              <strong>Caveat:</strong> This is an in-sample empirical baseline estimate designed to quantify historical dispersion,
              not an operational physics-based numerical weather ensemble model. Lower bound is clamped at 0 MW.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#253745] text-[10px] text-[#9BA8AB] font-mono">
            Bounds = max(0, forecast + P10_res) to forecast + P90_res.
          </div>
        </div>

        {/* Assumption 4: Data Scope */}
        <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[#10B981] mb-2">
              <Database className="h-4 w-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Elexon BMRS Scope</h3>
            </div>
            <p className="text-xs text-[#CCD0CF] leading-relaxed">
              Data strictly limited to national-level wind power from <strong>Elexon BMRS</strong>:
              <br /><br />
              • <strong>Actuals:</strong> FUELHH stream (<code className="text-[#10B981] font-mono">fuelType=WIND</code>).
              <br />
              • <strong>Forecasts:</strong> WINDFOR stream (<code className="text-[#06B6D4] font-mono">generation</code>).
              <br />
              • <strong>Scope:</strong> January 2026 delivery days (2026-01-02 to 2026-02-01). No synthetic or external data injected.
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-[#253745] text-[10px] text-[#9BA8AB] font-mono">
            Zero lookahead leakage: max publishTime &le; cutoff.
          </div>
        </div>
      </div>
    </div>
  );
};
