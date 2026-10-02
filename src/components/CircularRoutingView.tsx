import React, { useState } from 'react';
import {
  Recycle,
  Car,
  BatteryCharging,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Gauge
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations.js';

interface CircularRoutingViewProps {
  language: Language;
}

export const CircularRoutingView: React.FC<CircularRoutingViewProps> = ({ language }) => {
  const t = TRANSLATIONS[language];

  // Interactive routing sandbox state
  const [testSoh, setTestSoh] = useState<number>(74);
  const [testImpedance, setTestImpedance] = useState<number>(0.32);
  const [testTempRise, setTestTempRise] = useState<number>(6.5);
  const [testConfidence, setTestConfidence] = useState<number>(85);

  const getDecision = (soh: number, r: number, temp: number, conf: number) => {
    if (conf < 60) {
      return {
        stage: 'RE_EVALUATION_REQUIRED',
        title: 'Diagnostic Re-Evaluation Required',
        color: 'text-purple-400',
        bg: 'bg-purple-950/80 border-purple-600/50',
        application: 'Detailed EIS / Laboratory pulse test before deployment',
        policy: 'Preventive Safety Protocol'
      };
    }
    if (soh >= 80 && r <= 0.35 && temp <= 10) {
      return {
        stage: 'EV_READY',
        title: 'EV First-Life Traction Ready',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/80 border-emerald-600/50',
        application: 'Automotive 2W/3W/4W fleets, commercial deliveries, fast-charging hubs',
        policy: 'FAME II / PM E-DRIVE Compliant'
      };
    }
    if (soh >= 65 && r <= 0.55 && temp <= 15) {
      return {
        stage: 'SECOND_LIFE_READY',
        title: 'Second-Life Stationary Energy Storage Ready',
        color: 'text-amber-400',
        bg: 'bg-amber-950/80 border-amber-600/50',
        application: 'Telecom tower backup, agricultural solar pump storage, microgrids, peak shaving',
        policy: 'Circular BESS Guidelines'
      };
    }
    return {
      stage: 'RECYCLING_REQUIRED',
      title: 'Hydrometallurgical Recycling Required',
      color: 'text-rose-400',
      bg: 'bg-rose-950/80 border-rose-600/50',
      application: 'Critical mineral recovery (Lithium, Cobalt, Nickel, Manganese) via registered recyclers',
      policy: 'MoEFCC Battery Waste Management Rules 2022'
    };
  };

  const decision = getDecision(testSoh, testImpedance, testTempRise, testConfidence);

  return (
    <div id="circular-routing-view" className="space-y-6 pb-16">
      {/* Top Banner */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Recycle className="w-4 h-4" />
          <span>Circular Economy Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Circular Lifecycle Routing Matrix
        </h2>
        <p className="text-xs text-emerald-200/70 mt-1">
          Dynamic policy-driven cascading of electric vehicle packs into stationary storage and hydrometallurgical recycling.
        </p>
      </div>

      {/* 3 Cascading Pillars matching Indian Circular Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Pillar 1: EV First-Life */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Phase 1 (≥80% SOH)</span>
            <h3 className="text-base font-bold text-white mt-0.5">EV Traction Fleet</h3>
          </div>
          <p className="text-xs text-emerald-200/70 leading-relaxed">
            High dynamic power capability for acceleration and regenerative braking. Certified for automotive use with active BMS monitoring.
          </p>
          <div className="pt-2 border-t border-emerald-900/40 text-[11px] font-mono text-emerald-400">
            Target: 100,000 km / 1,500 Cycles
          </div>
        </div>

        {/* Pillar 2: Second-Life BESS */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center">
            <BatteryCharging className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Phase 2 (65–79% SOH)</span>
            <h3 className="text-base font-bold text-white mt-0.5">Stationary BESS</h3>
          </div>
          <p className="text-xs text-amber-200/70 leading-relaxed">
            Lower c-rate demands ideal for solar microgrids in rural India, telecom tower backup, and grid frequency balancing.
          </p>
          <div className="pt-2 border-t border-emerald-900/40 text-[11px] font-mono text-amber-400">
            Target: +5 to +7 Years Extension
          </div>
        </div>

        {/* Pillar 3: Hydrometallurgical Recycling */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-rose-950 text-rose-400 flex items-center justify-center">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Phase 3 (&lt;65% SOH)</span>
            <h3 className="text-base font-bold text-white mt-0.5">Closed-Loop Recovery</h3>
          </div>
          <p className="text-xs text-rose-200/70 leading-relaxed">
            Full hydrometallurgical recycling under MoEFCC rules to extract battery-grade lithium carbonate, cobalt sulfate, and nickel.
          </p>
          <div className="pt-2 border-t border-emerald-900/40 text-[11px] font-mono text-rose-400">
            Target: &gt;90% Metal Recovery Rate
          </div>
        </div>
      </div>

      {/* Interactive Routing Sandbox Simulator */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Gauge className="w-4 h-4" />
            <span>Interactive Circular Routing Sandbox</span>
          </h3>
          <span className="text-xs font-mono text-emerald-400/80">Real-time Policy Evaluation</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sliders Form (6 cols) */}
          <div className="lg:col-span-6 space-y-5">
            {/* SOH Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1.5">
                <span>State of Health (SOH):</span>
                <span className="font-mono text-emerald-400 font-bold">{testSoh}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={testSoh}
                onChange={(e) => setTestSoh(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Internal Resistance Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1.5">
                <span>Internal Resistance (R_int):</span>
                <span className="font-mono text-emerald-400 font-bold">{testImpedance} Ω</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.01"
                value={testImpedance}
                onChange={(e) => setTestImpedance(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Temperature Delta Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1.5">
                <span>Temperature Rise (ΔT):</span>
                <span className="font-mono text-emerald-400 font-bold">+{testTempRise} °C</span>
              </div>
              <input
                type="range"
                min="2.0"
                max="25.0"
                step="0.5"
                value={testTempRise}
                onChange={(e) => setTestTempRise(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Confidence Slider */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1.5">
                <span>Model Confidence Level:</span>
                <span className="font-mono text-emerald-400 font-bold">{testConfidence}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="99"
                value={testConfidence}
                onChange={(e) => setTestConfidence(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Decision Outcome Card (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div className={`p-6 rounded-2xl border space-y-4 ${decision.bg}`}>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Routing Determination
                </span>
              </div>

              <h4 className={`text-xl font-extrabold ${decision.color}`}>
                {decision.title}
              </h4>

              <div className="space-y-2 text-xs text-white/90">
                <p><strong>Target Deployment:</strong> {decision.application}</p>
                <p><strong>Regulatory Standard:</strong> {decision.policy}</p>
              </div>

              <div className="pt-2 border-t border-white/20 text-[11px] font-mono text-white/80">
                Decision rule: SOH = {testSoh}% | Rint = {testImpedance} Ω | Conf = {testConfidence}%
              </div>
            </div>

            <p className="text-xs text-emerald-400/70 mt-4 leading-relaxed">
              * Routing thresholds comply with National Electric Mobility Mission Plan guidelines and Bureau of Indian Standards (BIS IS 17855).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
