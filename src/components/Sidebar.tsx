import React from 'react';
import {
  LayoutDashboard,
  Database,
  PlusCircle,
  Activity,
  QrCode,
  Clock,
  Recycle,
  Settings,
  Zap,
  Leaf
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations.js';

export type NavTab = 
  | 'dashboard'
  | 'registry'
  | 'add-battery'
  | 'assessment'
  | 'passport'
  | 'lifecycle'
  | 'routing'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, language }) => {
  const t = TRANSLATIONS[language];

  const navItems = [
    { id: 'dashboard' as NavTab, label: t.dashboard, icon: LayoutDashboard },
    { id: 'registry' as NavTab, label: t.batteryRegistry, icon: Database },
    { id: 'add-battery' as NavTab, label: t.addBattery, icon: PlusCircle },
    { id: 'assessment' as NavTab, label: t.healthAssessment, icon: Activity },
    { id: 'passport' as NavTab, label: t.digitalPassport, icon: QrCode },
    { id: 'lifecycle' as NavTab, label: t.lifecycleHistory, icon: Clock },
    { id: 'routing' as NavTab, label: t.circularRouting, icon: Recycle },
    { id: 'settings' as NavTab, label: t.settings, icon: Settings },
  ];

  return (
    <aside 
      id="main-sidebar"
      className="w-64 bg-[#0a1b1a] border-r border-emerald-900/40 flex flex-col justify-between select-none shrink-0 no-print"
    >
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-emerald-900/30 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-bold">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              <span>{t.appName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </h1>
            <p className="text-xs font-medium text-emerald-400/80">{t.appSubtitle}</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600/90 text-white shadow-md shadow-emerald-700/20 font-semibold'
                    : 'text-emerald-200/70 hover:text-white hover:bg-emerald-950/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-emerald-400/70'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sustainable bottom footer badge matching design */}
      <div className="p-4 m-3 rounded-xl bg-gradient-to-b from-emerald-950/60 to-[#041c19] border border-emerald-800/30">
        <div className="flex items-center space-x-2 text-emerald-400 mb-1">
          <Leaf className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Circular Mission</span>
        </div>
        <p className="text-xs text-emerald-200/60 leading-relaxed">
          {language === 'hi' ? 'क्लीनर बैटरियां, हरित भारत' : 'Cleaner Batteries, Greener India'}
        </p>
        <div className="mt-2 text-[10px] text-emerald-500/80 font-mono">
          Govt. E-Mobility Standard Ready
        </div>
      </div>
    </aside>
  );
};
