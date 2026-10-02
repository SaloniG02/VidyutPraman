import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Activity,
  QrCode,
  Clock,
  ShieldCheck,
  FileText,
  Zap,
  Gauge,
  Thermometer,
  Layers,
  Download,
  Share2
} from 'lucide-react';
import { Battery, LifecycleEvent, ChainVerificationResult } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';

interface BatteryDetailsViewProps {
  battery: Battery;
  events: LifecycleEvent[];
  verification?: ChainVerificationResult;
  onBack: () => void;
  onNavigateTab: (tab: any, batteryId?: string) => void;
  language: Language;
}

export const BatteryDetailsView: React.FC<BatteryDetailsViewProps> = ({
  battery,
  events,
  verification,
  onBack,
  onNavigateTab,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'health' | 'lifecycle' | 'documents'>('overview');

  // Build the live passport URL
  const passportUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?tab=passport&id=${battery.id}`
    : `https://vidyutpraman.in/passport/${battery.id}`;

  const isEvReady = battery.lifecycleStatus === 'EV_READY';
  const isSecondLife = battery.lifecycleStatus === 'SECOND_LIFE_READY';
  const isRecycling = battery.lifecycleStatus === 'RECYCLING_REQUIRED';

  return (
    <div id="battery-details-view" className="space-y-6 pb-16">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 hover:text-emerald-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Registry</span>
      </button>

      {/* Header Banner matching Mockup */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-8 h-8 fill-current" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-black text-white font-mono tracking-tight">
                {battery.id}
              </h2>
              {isEvReady && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  EV Ready
                </span>
              )}
              {isSecondLife && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-500/40">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Second-Life Ready
                </span>
              )}
              {isRecycling && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-300 border border-rose-500/40">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  Recycling Required
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-200/70 mt-1 font-medium">
              {battery.manufacturer} {battery.model} | {battery.chemistry} | {battery.ratedCapacity} kWh | {battery.cycleCount} cycles
            </p>
          </div>
        </div>

        {/* QR Code preview matching mockup */}
        <div 
          onClick={() => onNavigateTab('passport', battery.id)}
          className="flex items-center space-x-3 p-2.5 rounded-xl bg-white text-slate-950 cursor-pointer hover:shadow-lg transition-all"
        >
          <div className="p-1">
            <QRCodeSVG value={passportUrl} size={64} level="M" />
          </div>
          <div className="text-left pr-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Digital Aadhaar</span>
            <span className="text-xs font-extrabold text-slate-900 block">Scan to view passport</span>
            <span className="text-[9px] text-emerald-700 font-mono block">SHA-256 Secured</span>
          </div>
        </div>
      </div>

      {/* Tabs matching mockup: Overview, Health, Lifecycle, Documents */}
      <div className="border-b border-emerald-900/40 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeSubTab === 'overview'
              ? 'border-emerald-400 text-white font-bold'
              : 'border-transparent text-emerald-400/60 hover:text-emerald-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveSubTab('health')}
          className={`pb-3 border-b-2 transition-colors ${
            activeSubTab === 'health'
              ? 'border-emerald-400 text-white font-bold'
              : 'border-transparent text-emerald-400/60 hover:text-emerald-200'
          }`}
        >
          Health & Pulse Test
        </button>
        <button
          onClick={() => setActiveSubTab('lifecycle')}
          className={`pb-3 border-b-2 transition-colors ${
            activeSubTab === 'lifecycle'
              ? 'border-emerald-400 text-white font-bold'
              : 'border-transparent text-emerald-400/60 hover:text-emerald-200'
          }`}
        >
          Lifecycle History
        </button>
        <button
          onClick={() => setActiveSubTab('documents')}
          className={`pb-3 border-b-2 transition-colors ${
            activeSubTab === 'documents'
              ? 'border-emerald-400 text-white font-bold'
              : 'border-transparent text-emerald-400/60 hover:text-emerald-200'
          }`}
        >
          Documents & Export
        </button>
      </div>

      {/* Tab 1: Overview matching mockup */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Key Information (7 cols) */}
            <div className="md:col-span-7 bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pb-2 border-b border-emerald-900/40">
                Key Information
              </h3>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-4 text-xs">
                <div>
                  <span className="text-emerald-400/70 block">Manufacturer</span>
                  <strong className="text-white font-semibold text-sm">{battery.manufacturer}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Model</span>
                  <strong className="text-white font-semibold text-sm">{battery.model}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Chemistry</span>
                  <strong className="text-white font-semibold text-sm">{battery.chemistry}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Nominal Voltage</span>
                  <strong className="text-white font-semibold text-sm font-mono">{battery.nominalVoltage} V</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Rated Capacity</span>
                  <strong className="text-white font-semibold text-sm font-mono">{battery.ratedCapacity} kWh</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Cycle Count</span>
                  <strong className="text-white font-semibold text-sm font-mono">{battery.cycleCount}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Manufacturing Date</span>
                  <strong className="text-white font-semibold text-sm">{battery.manufacturingDate}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Current Owner</span>
                  <strong className="text-white font-semibold text-sm truncate block">{battery.currentOwner}</strong>
                </div>
              </div>
            </div>

            {/* Health Summary with Circular Gauge (5 cols) matching Mockup */}
            <div className="md:col-span-5 bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl flex flex-col justify-between items-center text-center">
              <div className="w-full text-left pb-2 border-b border-emerald-900/40">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
                  Health Summary
                </h3>
              </div>

              {/* Circular Gauge */}
              <div className="my-4 relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-[#071615]"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={
                      battery.aiEstimatedSoh >= 80
                        ? 'text-emerald-400'
                        : battery.aiEstimatedSoh >= 65
                        ? 'text-amber-400'
                        : 'text-rose-500'
                    }
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - battery.aiEstimatedSoh / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {battery.aiEstimatedSoh}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider">
                    SOH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-2 border-t border-emerald-900/40 text-xs">
                <div>
                  <span className="text-emerald-400/70 block">Estimated RUL</span>
                  <strong className="text-white font-mono text-sm">~{battery.estimatedRul} cycles</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Confidence</span>
                  <strong className="text-white font-mono text-sm">{battery.confidence}%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle Suitability Card matching Mockup */}
          <div className={`rounded-2xl p-5 border flex items-center space-x-4 shadow-lg ${
            isEvReady
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : isSecondLife
              ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isEvReady ? 'bg-emerald-500 text-slate-950' : isSecondLife ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
            }`}>
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {battery.lifecycleReason || (isEvReady ? 'Battery is suitable for continued EV use.' : 'Battery classified for secondary circular routing.')}
              </h4>
              <p className="text-xs opacity-80 mt-0.5">
                Classification based on internal impedance ({battery.internalResistance} Ω), voltage sag ({battery.voltageSag} V), and {battery.confidence}% confidence screening.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('assessment', battery.id)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>Run Controlled Pulse Assessment</span>
            </button>
            <button
              onClick={() => onNavigateTab('passport', battery.id)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#081b18] hover:bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-xs font-bold transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Open Digital Passport</span>
            </button>
            <button
              onClick={() => onNavigateTab('lifecycle', battery.id)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#081b18] hover:bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-xs font-bold transition-all cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Inspect SHA-256 Chain</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Health & Pulse Test */}
      {activeSubTab === 'health' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5">
              <span className="text-xs text-emerald-400 font-semibold block">Internal Resistance (R_int)</span>
              <span className="text-2xl font-black text-white font-mono block mt-1">{battery.internalResistance} Ω</span>
              <p className="text-[11px] text-emerald-400/70 mt-1">Measured via ΔV / ΔI pulse</p>
            </div>
            <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5">
              <span className="text-xs text-emerald-400 font-semibold block">Voltage Sag (ΔV)</span>
              <span className="text-2xl font-black text-white font-mono block mt-1">{battery.voltageSag} V</span>
              <p className="text-[11px] text-emerald-400/70 mt-1">Transient sag under 50A load</p>
            </div>
            <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5">
              <span className="text-xs text-emerald-400 font-semibold block">Temperature Rise (ΔT)</span>
              <span className="text-2xl font-black text-white font-mono block mt-1">{battery.temperatureRise} °C</span>
              <p className="text-[11px] text-emerald-400/70 mt-1">Thermal delta during pulse step</p>
            </div>
          </div>

          <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 mb-4 pb-2 border-b border-emerald-900/40">
              BMS Telemetry vs AI Assessment Comparison
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-emerald-400/70 block">BMS Reported SOH</span>
                <strong className="text-white text-lg font-mono">{battery.bmsSoh}%</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-emerald-400/70 block">AI Estimated SOH</span>
                <strong className="text-emerald-400 text-lg font-mono">{battery.aiEstimatedSoh}%</strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-emerald-400/70 block">Delta Difference</span>
                <strong className="text-white text-lg font-mono">
                  {Math.round(Math.abs(battery.bmsSoh - battery.aiEstimatedSoh) * 10) / 10}%
                </strong>
              </div>
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-emerald-400/70 block">Verification Status</span>
                <span className="inline-block mt-1 font-bold text-emerald-300">
                  {battery.verificationStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Lifecycle History */}
      {activeSubTab === 'lifecycle' && (
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              SHA-256 Tamper-Evident Event Chain ({events.length} blocks)
            </h4>
            <span className="text-xs font-mono text-emerald-300">
              Genesis: 00000000...0000
            </span>
          </div>

          <div className="space-y-3">
            {events.map((e, idx) => (
              <div key={e.id} className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold">
                      Block #{idx + 1}
                    </span>
                    <strong className="text-xs text-white">{e.eventType}</strong>
                    <span className="text-xs text-emerald-300/80">• {e.actor}</span>
                  </div>
                  <p className="text-[11px] font-mono text-emerald-400/80 break-all">
                    Hash: 0x{e.hash}
                  </p>
                  <p className="text-[10px] font-mono text-emerald-600 break-all">
                    Prev: 0x{e.prevHash}
                  </p>
                </div>
                <span className="text-[10px] text-emerald-400/60 shrink-0">
                  {new Date(e.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Documents */}
      {activeSubTab === 'documents' && (
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 space-y-4">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pb-2 border-b border-emerald-900/40">
            Battery Aadhaar Documents & Certifications
          </h4>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-[#071615] border border-emerald-900/60 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-emerald-400" />
                <div>
                  <h5 className="text-xs font-bold text-white">Digital Battery Passport PDF</h5>
                  <p className="text-[11px] text-emerald-400/70">Cryptographically verifiable technical Aadhaar sheet</p>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('passport', battery.id)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
