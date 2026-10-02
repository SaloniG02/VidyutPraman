import React from 'react';
import {
  Battery as BatteryIcon,
  Car,
  RotateCw,
  Recycle,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  UserCheck
} from 'lucide-react';
import { Battery } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';

interface DashboardViewProps {
  summary: any;
  batteries: Battery[];
  onNavigate: (tab: any, batteryId?: string) => void;
  language: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  batteries,
  onNavigate,
  language
}) => {
  const t = TRANSLATIONS[language];
  const safeBatteries = Array.isArray(batteries) ? batteries : [];

  const total = summary?.totalBatteries ?? safeBatteries.length ?? 24;
  const evReady = summary?.evReadyBatteries ?? safeBatteries.filter(b => b.lifecycleStatus === 'EV_READY').length ?? 16;
  const secondLife = summary?.secondLifeBatteries ?? safeBatteries.filter(b => b.lifecycleStatus === 'SECOND_LIFE_READY').length ?? 5;
  const recycling = summary?.recyclingRequiredBatteries ?? safeBatteries.filter(b => b.lifecycleStatus === 'RECYCLING_REQUIRED').length ?? 3;
  const reEvaluation = summary?.reEvaluationRequiredBatteries ?? safeBatteries.filter(b => b.lifecycleStatus === 'RE_EVALUATION_REQUIRED').length ?? 1;
  const avgSoh = summary?.averageEstimatedSoh ?? 81.4;

  return (
    <div id="dashboard-view" className="space-y-6 pb-12">
      {/* Top Welcome & Mission Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'hi' ? 'स्वागत है' : 'Operational Command'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {language === 'hi' ? 'शुभ प्रभात!' : 'Good Morning!'}
          </h2>
          <p className="text-sm text-emerald-200/70 mt-1 flex items-center gap-1.5">
            <span>{t.tagline}</span>
            <span className="text-emerald-400">🌱</span>
          </p>
        </div>

        {/* Quote Pill matching mockup */}
        <div className="self-start md:self-auto px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-800/40 text-xs text-emerald-300 font-medium flex items-center space-x-2">
          <span className="text-emerald-400 font-bold">“</span>
          <span>{t.quote}</span>
          <span className="text-emerald-400 font-bold">”</span>
        </div>
      </div>

      {/* 4 Stat Metric Cards matching Mockup */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Batteries */}
        <div 
          id="stat-total-batteries"
          onClick={() => onNavigate('registry')}
          className="cursor-pointer bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5 hover:border-emerald-500/60 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <BatteryIcon className="w-6 h-6" />
          </div>
          <span className="text-3xl font-extrabold text-white block tracking-tight">
            {total}
          </span>
          <span className="text-xs font-medium text-emerald-300/80 block mt-1">
            {t.totalBatteries}
          </span>
        </div>

        {/* EV Ready */}
        <div 
          id="stat-ev-ready"
          onClick={() => onNavigate('registry')}
          className="cursor-pointer bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5 hover:border-blue-500/60 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-950/80 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Car className="w-6 h-6" />
          </div>
          <span className="text-3xl font-extrabold text-white block tracking-tight">
            {evReady}
          </span>
          <span className="text-xs font-medium text-blue-300/80 block mt-1">
            {t.evReady}
          </span>
        </div>

        {/* Second-Life Ready */}
        <div 
          id="stat-second-life"
          onClick={() => onNavigate('registry')}
          className="cursor-pointer bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5 hover:border-amber-500/60 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-950/80 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <RotateCw className="w-6 h-6" />
          </div>
          <span className="text-3xl font-extrabold text-white block tracking-tight">
            {secondLife}
          </span>
          <span className="text-xs font-medium text-amber-300/80 block mt-1">
            {t.secondLifeReady}
          </span>
        </div>

        {/* Recycling Required */}
        <div 
          id="stat-recycling-required"
          onClick={() => onNavigate('registry')}
          className="cursor-pointer bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5 hover:border-rose-500/60 transition-all group shadow-lg"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-950/80 text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
            <Recycle className="w-6 h-6" />
          </div>
          <span className="text-3xl font-extrabold text-white block tracking-tight">
            {recycling}
          </span>
          <span className="text-xs font-medium text-rose-300/80 block mt-1">
            {t.recyclingRequired}
          </span>
        </div>
      </div>

      {/* Middle Section: Recent Activity + Sustainable Mobility Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity List (7 cols) */}
        <div className="lg:col-span-7 bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/40">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>{t.recentActivity}</span>
              </h3>
              <button 
                onClick={() => onNavigate('lifecycle')}
                className="text-xs text-emerald-400 hover:text-emerald-200 flex items-center gap-1 font-medium"
              >
                <span>View Full Chain</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Event 1 */}
              <div 
                onClick={() => onNavigate('assessment', 'BAT-2026-001')}
                className="flex items-start justify-between p-3 rounded-xl bg-[#081816] border border-emerald-900/40 hover:border-emerald-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">BAT-2026-001 assessed</h4>
                    <p className="text-[11px] text-emerald-400 font-mono">SOH: 82% (EV Ready)</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400/60 shrink-0">2 hours ago</span>
              </div>

              {/* Event 2 */}
              <div 
                onClick={() => onNavigate('registry')}
                className="flex items-start justify-between p-3 rounded-xl bg-[#081816] border border-emerald-900/40 hover:border-emerald-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-950 text-teal-400 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">New battery registered</h4>
                    <p className="text-[11px] text-teal-300 font-mono">BAT-2026-024 (Ather Energy)</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400/60 shrink-0">5 hours ago</span>
              </div>

              {/* Event 3 */}
              <div 
                onClick={() => onNavigate('lifecycle', 'BAT-2026-001')}
                className="flex items-start justify-between p-3 rounded-xl bg-[#081816] border border-emerald-900/40 hover:border-emerald-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Ownership transfer added</h4>
                    <p className="text-[11px] text-blue-300 font-mono">BAT-2025-118 • Inter-hub transfer</p>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400/60 shrink-0">1 day ago</span>
              </div>

              {/* Event 4 */}
              <div 
                onClick={() => onNavigate('assessment', 'BAT-2025-118')}
                className="flex items-start justify-between p-3 rounded-xl bg-[#081816] border border-amber-900/40 hover:border-amber-700/60 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-950 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-200">Battery flagged for review</h4>
                    <p className="text-[11px] text-amber-400/80 font-mono">BMS mismatch detected (21% diff)</p>
                  </div>
                </div>
                <span className="text-[10px] text-amber-400/60 shrink-0">1 day ago</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-emerald-900/30 flex items-center justify-between text-xs text-emerald-300/80">
            <span>Average Fleet SOH: <strong className="text-emerald-300 font-mono">{avgSoh}%</strong></span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SHA-256 Tamper Evident</span>
            </span>
          </div>
        </div>

        {/* Sustainable Mobility Banner matching Mockup (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#113832] to-[#0a231f] border border-emerald-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              National EV Mission
            </span>
            <h3 className="text-2xl font-black text-white leading-tight tracking-tight">
              {t.sustainableMobility}
            </h3>
            <p className="text-base font-semibold text-emerald-300">
              {t.sustainableMobilitySub}
            </p>
            <p className="text-xs text-emerald-100/70 mt-3 max-w-xs leading-relaxed">
              Enabling circular lifecycle routing, second-life stationary storage repurposing, and zero-waste lithium recovery for Indian electric fleets.
            </p>
          </div>

          {/* Clean Vector Graphic Illustration (EV Car, Windmills, Road, Sun) */}
          <div className="mt-6 relative h-40 w-full rounded-xl bg-gradient-to-t from-emerald-900/60 to-transparent flex items-end justify-center overflow-hidden border border-emerald-700/30">
            <svg viewBox="0 0 400 160" className="w-full h-full object-cover" preserveAspectRatio="none">
              <defs>
                <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {/* Sun */}
              <circle cx="340" cy="40" r="24" fill="#f59e0b" opacity="0.3" />
              <circle cx="340" cy="40" r="16" fill="#fbbf24" opacity="0.6" />
              {/* Windmills */}
              <line x1="80" y1="120" x2="80" y2="50" stroke="#a7f3d0" strokeWidth="2" opacity="0.7" />
              <circle cx="80" cy="50" r="3" fill="#a7f3d0" />
              <line x1="80" y1="50" x2="65" y2="35" stroke="#a7f3d0" strokeWidth="1.5" opacity="0.7" />
              <line x1="80" y1="50" x2="95" y2="38" stroke="#a7f3d0" strokeWidth="1.5" opacity="0.7" />
              <line x1="80" y1="50" x2="78" y2="70" stroke="#a7f3d0" strokeWidth="1.5" opacity="0.7" />

              <line x1="140" y1="125" x2="140" y2="65" stroke="#a7f3d0" strokeWidth="1.8" opacity="0.6" />
              <circle cx="140" cy="65" r="2.5" fill="#a7f3d0" />

              {/* Rolling Hills */}
              <path d="M0,130 Q100,85 220,110 T400,105 L400,160 L0,160 Z" fill="url(#hillGrad)" />
              
              {/* Road */}
              <path d="M0,150 Q160,135 400,145 L400,160 L0,160 Z" fill="#042f2e" />
              <line x1="20" y1="152" x2="60" y2="151" stroke="#fef08a" strokeWidth="2" strokeDasharray="6,6" />
              <line x1="100" y1="150" x2="160" y2="148" stroke="#fef08a" strokeWidth="2" strokeDasharray="6,6" />
              <line x1="220" y1="147" x2="300" y2="148" stroke="#fef08a" strokeWidth="2" strokeDasharray="6,6" />

              {/* EV Car Graphic */}
              <g transform="translate(180, 115) scale(0.75)">
                <rect x="10" y="16" width="65" height="18" rx="5" fill="#ffffff" />
                <path d="M22,16 L32,5 L58,5 L68,16 Z" fill="#38bdf8" opacity="0.9" />
                <circle cx="25" cy="34" r="7" fill="#0f172a" />
                <circle cx="25" cy="34" r="3" fill="#cbd5e1" />
                <circle cx="62" cy="34" r="7" fill="#0f172a" />
                <circle cx="62" cy="34" r="3" fill="#cbd5e1" />
                <rect x="70" y="20" width="4" height="4" rx="1" fill="#ef4444" />
                <rect x="8" y="20" width="4" height="4" rx="1" fill="#fde047" />
                <text x="35" y="14" fill="#065f46" fontSize="6" fontWeight="bold">EV</text>
              </g>
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-emerald-300 font-mono">Target: 80% Closed Loop by 2030</span>
            <button
              onClick={() => onNavigate('routing')}
              className="px-3 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
            >
              Circular Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Health Distribution & Battery Quick Access */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Fleet Health Distribution & Circular Routing Readiness</span>
            </h3>
            <p className="text-xs text-emerald-200/60 mt-0.5">
              Rapid pulse test screening categorization for registered packs
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {safeBatteries.length} Total Monitored
          </span>
        </div>

        {/* Progress distribution bar */}
        <div className="space-y-3">
          <div className="h-4 w-full bg-[#071615] rounded-full overflow-hidden flex p-0.5 border border-emerald-900/60">
            <div 
              style={{ width: `${(evReady / total) * 100}%` }} 
              className="bg-emerald-500 h-full rounded-l-full" 
              title={`EV Ready: ${evReady} packs`} 
            />
            <div 
              style={{ width: `${(secondLife / total) * 100}%` }} 
              className="bg-amber-500 h-full" 
              title={`Second Life Ready: ${secondLife} packs`} 
            />
            <div 
              style={{ width: `${(recycling / total) * 100}%` }} 
              className="bg-rose-500 h-full" 
              title={`Recycling Required: ${recycling} packs`} 
            />
            <div 
              style={{ width: `${(reEvaluation / total) * 100}%` }} 
              className="bg-purple-500 h-full rounded-r-full" 
              title={`Re-evaluation: ${reEvaluation} packs`} 
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></div>
              <span className="text-emerald-200">EV Traction ({evReady})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0"></div>
              <span className="text-amber-200">Second-Life BESS ({secondLife})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0"></div>
              <span className="text-rose-200">Recycling Recovery ({recycling})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 shrink-0"></div>
              <span className="text-purple-200">Audit / Review ({reEvaluation})</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
