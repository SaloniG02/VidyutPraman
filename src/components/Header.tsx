import React, { useState } from 'react';
import {
  Search,
  Bell,
  Volume2,
  VolumeX,
  Languages,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  X
} from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations.js';
import { speakText, isSpeechSupported } from '../utils/voice.js';
import { SystemSettings } from '../types/index.js';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  language: Language;
  onToggleLanguage: (lang: Language) => void;
  settings?: SystemSettings | null;
  recentAlerts?: Array<{ id: string; message: string; type: 'info' | 'warning' | 'success'; timestamp: string }>;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  language,
  onToggleLanguage,
  settings,
  recentAlerts = []
}) => {
  const t = TRANSLATIONS[language];
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechCancel, setSpeechCancel] = useState<(() => void) | null>(null);

  const handleVoiceNarration = () => {
    if (isSpeaking && speechCancel) {
      speechCancel();
      setIsSpeaking(false);
      return;
    }

    const narrationText = language === 'hi'
      ? 'विद्युतप्रमाण - बैटरी आधार। भारतीय इलेक्ट्रिक फ्लीट के लिए डिजिटल बैटरी पासपोर्ट और सर्कुलर इकोनॉमी प्लेटफॉर्म।'
      : 'VidyutPraman — Battery Aadhaar. Secure digital battery passport and circular-economy platform for Indian electric fleets.';

    const voice = speakText(narrationText, {
      language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });

    setSpeechCancel(() => voice.cancel);
  };

  const isStoragePostgres = settings?.storageMode === 'postgresql';

  return (
    <header 
      id="main-header"
      className="h-16 bg-[#0d2220] border-b border-emerald-900/40 px-6 flex items-center justify-between no-print z-20"
    >
      {/* Left: Global Search */}
      <div className="relative w-80 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
        <input
          id="global-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full bg-[#071615] border border-emerald-900/60 rounded-lg pl-10 pr-3.5 py-1.5 text-xs text-emerald-100 placeholder-emerald-600/70 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Right: Status Badges, Voice, Language, Alerts, User Profile */}
      <div className="flex items-center space-x-3">
        {/* Storage Mode indicator */}
        <div 
          title={isStoragePostgres ? 'Connected to PostgreSQL Database' : 'Using In-Memory Local Demonstration Storage (Ready for PostgreSQL)'}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            isStoragePostgres 
              ? 'bg-blue-950/60 text-blue-300 border-blue-800/50' 
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/40'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline font-mono">
            {isStoragePostgres ? 'PostgreSQL' : 'In-Memory Store'}
          </span>
        </div>

        {/* ESP32 Hardware Architecture Badge */}
        <div 
          title="Hardware Readiness: ESP32 UART/ADC simulated interface active"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-teal-950/60 text-teal-300 border border-teal-800/40"
        >
          <Cpu className="w-3.5 h-3.5 text-teal-400" />
          <span className="hidden md:inline font-mono">ESP32: Simulated</span>
        </div>

        {/* Audio Speech Narration Button */}
        {isSpeechSupported() && (
          <button
            id="voice-narration-btn"
            onClick={handleVoiceNarration}
            title={isSpeaking ? 'Stop speech' : 'Listen in audio (Web Speech API)'}
            className={`p-2 rounded-lg border transition-all ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                : 'bg-[#071615] text-emerald-300 border-emerald-900/60 hover:text-white hover:border-emerald-700'
            }`}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}

        {/* Language selector toggle */}
        <button
          id="lang-toggle-btn"
          onClick={() => onToggleLanguage(language === 'en' ? 'hi' : 'en')}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#071615] border border-emerald-900/60 text-xs font-semibold text-emerald-300 hover:text-white hover:border-emerald-700 transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-[#071615] border border-emerald-900/60 text-emerald-300 hover:text-white relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0c2421] border border-emerald-800/60 rounded-xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
                <span className="text-xs font-bold text-white uppercase tracking-wider">System Alerts</span>
                <button onClick={() => setShowNotifications(false)} className="text-emerald-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-emerald-200">BAT-2026-001 Verified</p>
                    <p className="text-[10px] text-emerald-400/70">SHA-256 event chain intact. EV Ready.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-start space-x-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-200">BMS Mismatch Alert</p>
                    <p className="text-[10px] text-amber-300/70">BAT-2025-118 flagged for laboratory review.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-950/60 border border-teal-800/40 flex items-start space-x-2.5">
                  <Cpu className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-teal-200">ESP32 Ready</p>
                    <p className="text-[10px] text-teal-300/70">Telemetry test simulator initialized.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User profile tag matching mockup ("VX VidyutX") */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-emerald-900/40">
          <div className="w-8 h-8 rounded-full bg-emerald-700/80 border border-emerald-400/40 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            VX
          </div>
          <div className="hidden lg:block text-left">
            <span className="text-xs font-semibold text-white block">VidyutX</span>
            <span className="text-[10px] text-emerald-400 block font-mono">Fleet Operator</span>
          </div>
        </div>
      </div>
    </header>
  );
};
