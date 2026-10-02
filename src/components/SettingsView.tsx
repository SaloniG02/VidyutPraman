import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Shield,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Sliders,
  Code2
} from 'lucide-react';
import { SystemSettings } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';
import { speakText, isSpeechSupported } from '../utils/voice.js';

interface SettingsViewProps {
  settings: SystemSettings | null;
  onSaveSettings: (settings: SystemSettings) => Promise<void>;
  language: Language;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [localSettings, setLocalSettings] = useState<SystemSettings>(
    settings || {
      storageMode: 'in-memory-fallback',
      bmsConsistencyThreshold: 5.0,
      bmsReviewThreshold: 15.0,
      evReadyMinSoh: 80.0,
      secondLifeMinSoh: 65.0,
      maxAcceptableResistance: 0.45,
      esp32BaudRate: 115200,
      language: 'en'
    }
  );

  const [isSaved, setIsSaved] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSliderChange = (field: keyof SystemSettings, val: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: val }));
    setIsSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSaveSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestHindiVoice = () => {
    setIsTestingVoice(true);
    speakText('विद्युतप्रमाण - बैटरी आधार। आपकी सिस्टम सेटिंग्स सफलतापूर्वक अपडेट की गई हैं।', {
      language: 'hi',
      onEnd: () => setIsTestingVoice(false),
      onError: () => setIsTestingVoice(false)
    });
  };

  return (
    <div id="settings-view" className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>System Configuration</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          System Settings & Hardware Profile
        </h2>
        <p className="text-xs text-emerald-200/70 mt-1">
          Configure diagnostic thresholds, database persistence, and simulated ESP32 hardware interfaces.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Storage Architecture Card */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-emerald-900/40">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Database Storage Architecture
              </h3>
              <p className="text-xs text-emerald-200/70">
                Supports dual-mode storage: PostgreSQL database integration with In-Memory fallback.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className={`p-4 rounded-xl border cursor-pointer transition-all ${
              localSettings.storageMode === 'in-memory-fallback'
                ? 'bg-emerald-950/80 border-emerald-500 text-white'
                : 'bg-[#071615] border-emerald-900/50 text-emerald-300 opacity-60'
            }`}
            onClick={() => handleSliderChange('storageMode', 'in-memory-fallback')}
            >
              <div className="flex items-center justify-between mb-2">
                <strong className="text-xs font-bold">In-Memory / Local Storage Fallback</strong>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900 text-emerald-300">Active</span>
              </div>
              <p className="text-[11px] text-emerald-200/70">
                Zero-setup in-memory database with pre-seeded demonstration batteries and event chains.
              </p>
            </div>

            <div className={`p-4 rounded-xl border cursor-pointer transition-all ${
              localSettings.storageMode === 'postgresql'
                ? 'bg-emerald-950/80 border-emerald-500 text-white'
                : 'bg-[#071615] border-emerald-900/50 text-emerald-300 opacity-60'
            }`}
            onClick={() => handleSliderChange('storageMode', 'postgresql')}
            >
              <div className="flex items-center justify-between mb-2">
                <strong className="text-xs font-bold">PostgreSQL Relational DB</strong>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300">Ready</span>
              </div>
              <p className="text-[11px] text-emerald-200/70">
                Enterprise cloud SQL persistence for high-throughput commercial fleet registrations.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Thresholds Card */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-emerald-900/40">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Health & Discrepancy Thresholds
              </h3>
              <p className="text-xs text-emerald-200/70">
                Set sensitivity thresholds for BMS vs AI verification and circular routing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1">
                <span>BMS Consistency Max Difference:</span>
                <span className="font-mono text-emerald-400 font-bold">±{localSettings.bmsConsistencyThreshold}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={localSettings.bmsConsistencyThreshold}
                onChange={(e) => handleSliderChange('bmsConsistencyThreshold', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <span className="text-[10px] text-emerald-400/60 block mt-1">Divergence below this is categorized as "Consistent".</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1">
                <span>BMS Review Trigger Difference:</span>
                <span className="font-mono text-amber-400 font-bold">±{localSettings.bmsReviewThreshold}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                step="1"
                value={localSettings.bmsReviewThreshold}
                onChange={(e) => handleSliderChange('bmsReviewThreshold', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-emerald-400/60 block mt-1">Divergence above this triggers mandatory review flag.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1">
                <span>EV Ready Minimum SOH:</span>
                <span className="font-mono text-emerald-400 font-bold">{localSettings.evReadyMinSoh}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="90"
                step="1"
                value={localSettings.evReadyMinSoh}
                onChange={(e) => handleSliderChange('evReadyMinSoh', parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-emerald-200 mb-1">
                <span>Second-Life Minimum SOH:</span>
                <span className="font-mono text-amber-400 font-bold">{localSettings.secondLifeMinSoh}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="75"
                step="1"
                value={localSettings.secondLifeMinSoh}
                onChange={(e) => handleSliderChange('secondLifeMinSoh', parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ESP32 Hardware Readiness Card */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-emerald-900/40">
            <Cpu className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ESP32 Hardware Gateway Profile
              </h3>
              <p className="text-xs text-emerald-200/70">
                Hardware-ready UART / ADC pinout mapping for controlled pulse test rigs.
              </p>
            </div>
          </div>

          <div className="bg-[#071615] border border-emerald-900/60 rounded-xl p-4 font-mono text-xs text-emerald-300 space-y-2">
            <div className="flex justify-between text-emerald-400/80 pb-1 border-b border-emerald-900/40">
              <span>INTERFACE PIN</span>
              <span>ESP32 GPIO</span>
              <span>SIGNAL FUNCTION</span>
            </div>
            <div className="flex justify-between">
              <span>ADC_VOLT_DIV</span>
              <span className="text-white">GPIO34 (ADC1_CH6)</span>
              <span>Pack Voltage Sensing (0–500V divider)</span>
            </div>
            <div className="flex justify-between">
              <span>ADC_HALL_CURR</span>
              <span className="text-white">GPIO35 (ADC1_CH7)</span>
              <span>Hall Effect Current Sensing (0–100A)</span>
            </div>
            <div className="flex justify-between">
              <span>ONE_WIRE_TEMP</span>
              <span className="text-white">GPIO4 (DQ)</span>
              <span>DS18B20 Multi-Point Surface Thermistor</span>
            </div>
            <div className="flex justify-between">
              <span>RELAY_LOAD_PULSE</span>
              <span className="text-white">GPIO16 (OUTPUT)</span>
              <span>High-Current Resistor Discharge Pulse (10s)</span>
            </div>
          </div>
        </div>

        {/* Hindi Web Speech API Narration Test */}
        {isSpeechSupported() && (
          <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Hindi Web Speech API Audio Engine
                </h4>
                <p className="text-[11px] text-emerald-200/70">
                  Verify browser speech synthesis for Hindi voice narration.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestHindiVoice}
              disabled={isTestingVoice}
              className="px-4 py-2 rounded-xl bg-teal-950 border border-teal-700/60 text-teal-300 text-xs font-bold hover:text-white transition-all cursor-pointer"
            >
              {isTestingVoice ? 'बोल रहा है...' : 'Test Hindi Voice (ध्वनि परीक्षण)'}
            </button>
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-emerald-400">
            {isSaved ? '✅ Settings saved successfully.' : ''}
          </span>
          <button
            id="save-settings-btn"
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
