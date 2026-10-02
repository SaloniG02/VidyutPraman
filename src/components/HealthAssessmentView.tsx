import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Thermometer,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  ShieldCheck,
  Volume2,
  Sparkles
} from 'lucide-react';
import { Battery, PulseTestInput, PulseTestResult } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';
import { speakText } from '../utils/voice.js';

interface HealthAssessmentViewProps {
  batteries: Battery[];
  selectedBatteryId?: string;
  onRunAssessment: (input: PulseTestInput, targetBatteryId?: string) => Promise<PulseTestResult>;
  onCommitEvent?: (batteryId: string, testResult: PulseTestResult) => Promise<void>;
  language: Language;
}

export const HealthAssessmentView: React.FC<HealthAssessmentViewProps> = ({
  batteries,
  selectedBatteryId,
  onRunAssessment,
  onCommitEvent,
  language
}) => {
  const t = TRANSLATIONS[language];

  const [activeBatteryId, setActiveBatteryId] = useState<string>(selectedBatteryId || batteries[0]?.id || '');
  const [inputs, setInputs] = useState<PulseTestInput>({
    initialVoltage: 412.5,
    loadedVoltage: 398.2,
    initialCurrent: 0.0,
    loadedCurrent: 50.0,
    initialTemperature: 28.0,
    finalTemperature: 34.0,
    cycleCount: 850,
    chemistry: 'Li-ion (NMC)',
    ratedCapacity: 40.0,
    currentCapacity: 32.8,
    bmsSoh: 85.0
  });

  const [isRunning, setIsRunning] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<PulseTestResult | null>(null);
  const [committed, setCommitted] = useState(false);
  const [isSimulatingEsp32, setIsSimulatingEsp32] = useState(false);
  const safeBatteries = Array.isArray(batteries) ? batteries : [];

  // Sync when selectedBatteryId prop changes
  useEffect(() => {
    if (selectedBatteryId) {
      setActiveBatteryId(selectedBatteryId);
      const b = safeBatteries.find(item => item.id === selectedBatteryId);
      if (b) {
        setInputs(prev => ({
          ...prev,
          cycleCount: b.cycleCount,
          chemistry: b.chemistry,
          ratedCapacity: b.ratedCapacity,
          bmsSoh: b.bmsSoh
        }));
      }
    }
  }, [selectedBatteryId, batteries]);

  const handleBatterySelect = (batteryId: string) => {
    setActiveBatteryId(batteryId);
    const b = safeBatteries.find(item => item.id === batteryId);
    if (b) {
      setInputs(prev => ({
        ...prev,
        cycleCount: b.cycleCount,
        chemistry: b.chemistry,
        ratedCapacity: b.ratedCapacity,
        bmsSoh: b.bmsSoh
      }));
    }
  };

  const handleInputChange = (field: keyof PulseTestInput, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleRunAssessment = async () => {
    setIsRunning(true);
    setCommitted(false);
    try {
      const res = await onRunAssessment(inputs, activeBatteryId);
      setAssessmentResult(res);
    } catch (err) {
      console.error('Assessment failed', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleFetchEsp32 = async () => {
    setIsSimulatingEsp32(true);
    try {
      const res = await fetch('/api/telemetry/esp32/pulse');
      const data = await res.json();
      if (data.pulseData) {
        setInputs(prev => ({
          ...prev,
          initialVoltage: data.pulseData.initialVoltage,
          loadedVoltage: data.pulseData.loadedVoltage,
          initialCurrent: data.pulseData.initialCurrent,
          loadedCurrent: data.pulseData.loadedCurrent,
          initialTemperature: data.pulseData.initialTemperature,
          finalTemperature: data.pulseData.finalTemperature
        }));
      }
    } catch (err) {
      console.error('ESP32 telemetry fetch error:', err);
    } finally {
      setIsSimulatingEsp32(false);
    }
  };

  const handleSpeakResults = () => {
    if (!assessmentResult) return;
    const text = language === 'hi'
      ? `स्वास्थ्य मूल्यांकन पूरा हुआ। अनुमानित एसओएच ${assessmentResult.estimatedSoh} प्रतिशत है। जीवनचक्र स्थिति: ${assessmentResult.lifecycleDecision.status === 'EV_READY' ? 'ई-वाहन योग्य' : 'सर्कुलर रूटिंग योग्य'}।`
      : `Health assessment complete. Estimated State of Health is ${assessmentResult.estimatedSoh} percent. Residual life: approximately ${assessmentResult.estimatedRul} cycles. Lifecycle status: ${assessmentResult.lifecycleDecision.status}.`;
    speakText(text, { language });
  };

  const handleCommit = async () => {
    if (!assessmentResult || !onCommitEvent || !activeBatteryId) return;
    await onCommitEvent(activeBatteryId, assessmentResult);
    setCommitted(true);
  };

  return (
    <div id="health-assessment-view" className="space-y-6 pb-16">
      {/* Top Banner matching Mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            <span>Battery Diagnostics & Inference Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Health Assessment
          </h2>
          <p className="text-xs text-emerald-200/70 mt-1">
            Enter pulse test data to estimate battery health, internal resistance, and circular lifecycle routing.
          </p>
        </div>

        {/* Action buttons: Demo Data & ESP32 Fetch */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={handleFetchEsp32}
            disabled={isSimulatingEsp32}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-950/80 border border-teal-800/60 text-xs font-semibold text-teal-300 hover:text-white transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span>{isSimulatingEsp32 ? 'Querying ESP32...' : 'Query ESP32 Telemetry'}</span>
          </button>
          <button
            onClick={() => {
              setInputs({
                initialVoltage: 412.5,
                loadedVoltage: 398.2,
                initialCurrent: 0.0,
                loadedCurrent: 50.0,
                initialTemperature: 28.0,
                finalTemperature: 34.0,
                cycleCount: 850,
                chemistry: 'Li-ion (NMC)',
                ratedCapacity: 40.0,
                currentCapacity: 32.8,
                bmsSoh: 85.0
              });
            }}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-xs font-semibold text-emerald-300 hover:text-white transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Demo Readings</span>
          </button>
        </div>
      </div>

      {/* Target Battery Selection */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-emerald-300 whitespace-nowrap">
            Select Battery ID:
          </label>
          <select
            value={activeBatteryId}
            onChange={(e) => handleBatterySelect(e.target.value)}
            className="bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-1.5 text-xs text-emerald-100 font-mono focus:outline-none focus:border-emerald-500 w-full sm:w-64"
          >
            {safeBatteries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} — {b.manufacturer} ({b.chemistry})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-emerald-400/80 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Test outputs will be signed into verifiable event chain.</span>
        </div>
      </div>

      {/* Inputs & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Readings Input Form (6 cols) */}
        <div className="lg:col-span-6 bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              Test Readings (Controlled Pulse)
            </h3>
            <span className="text-xs font-mono text-emerald-400/70">50A Pulse Step</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Initial Voltage */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Initial Voltage (V)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.initialVoltage}
                onChange={(e) => handleInputChange('initialVoltage', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Loaded Voltage */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Loaded Voltage (V)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.loadedVoltage}
                onChange={(e) => handleInputChange('loadedVoltage', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Initial Current */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Initial Current (A)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.initialCurrent}
                onChange={(e) => handleInputChange('initialCurrent', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Loaded Current */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Loaded Current (A)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.loadedCurrent}
                onChange={(e) => handleInputChange('loadedCurrent', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Initial Temp */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Initial Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={inputs.initialTemperature}
                onChange={(e) => handleInputChange('initialTemperature', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Final Temp */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Final Temp (°C)
              </label>
              <input
                type="number"
                step="0.5"
                value={inputs.finalTemperature}
                onChange={(e) => handleInputChange('finalTemperature', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Cycle Count */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                Cycle Count
              </label>
              <input
                type="number"
                value={inputs.cycleCount}
                onChange={(e) => handleInputChange('cycleCount', parseInt(e.target.value, 10))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* BMS Reported SOH */}
            <div>
              <label className="block font-semibold text-emerald-200 mb-1">
                BMS Reported SOH (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={inputs.bmsSoh ?? 85}
                onChange={(e) => handleInputChange('bmsSoh', parseFloat(e.target.value))}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              id="run-assessment-submit-btn"
              type="button"
              disabled={isRunning}
              onClick={handleRunAssessment}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              <Activity className="w-4 h-4 text-slate-950" />
              <span>{isRunning ? 'Running Inference & Diagnostics...' : 'Run Assessment'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Results matching Mockup (6 cols) */}
        <div className="lg:col-span-6 bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-emerald-900/40">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>Results</span>
                {assessmentResult && (
                  <span className="text-[11px] font-normal text-emerald-400/80 font-mono">
                    ({assessmentResult.source === 'python-ml' ? 'Python ML Regressor' : 'Empirical Fallback'})
                  </span>
                )}
              </h3>
              {assessmentResult && (
                <button
                  onClick={handleSpeakResults}
                  title="Speak Results"
                  className="p-1.5 rounded-lg bg-[#071615] text-emerald-400 hover:text-white transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metrics cards matching mockup */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {/* Voltage Sag */}
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-[11px] text-emerald-400/80 block">{t.voltageDrop}</span>
                <strong className="text-lg font-extrabold text-white font-mono block mt-1">
                  {assessmentResult ? `${assessmentResult.voltageSag} V` : '14.3 V'}
                </strong>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">Sag under load</span>
              </div>

              {/* Internal Resistance */}
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-[11px] text-emerald-400/80 block">{t.internalResistance}</span>
                <strong className="text-lg font-extrabold text-white font-mono block mt-1">
                  {assessmentResult ? `${assessmentResult.internalResistance} Ω` : '0.286 Ω'}
                </strong>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">Ohmic impedance</span>
              </div>

              {/* SOH Estimated */}
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-[11px] text-emerald-400/80 block">{t.estimatedSoh}</span>
                <strong className="text-lg font-extrabold text-emerald-400 font-mono block mt-1">
                  {assessmentResult ? `${assessmentResult.estimatedSoh}%` : '82%'}
                </strong>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">
                  Conf: {assessmentResult ? `${assessmentResult.confidence}%` : '87%'}
                </span>
              </div>

              {/* RUL Estimated */}
              <div className="p-3.5 rounded-xl bg-[#071615] border border-emerald-900/60">
                <span className="text-[11px] text-emerald-400/80 block">{t.estimatedRul}</span>
                <strong className="text-lg font-extrabold text-white font-mono block mt-1">
                  {assessmentResult ? `~${assessmentResult.estimatedRul}` : '~1200'}
                </strong>
                <span className="text-[10px] text-emerald-500/80 block mt-0.5">Remaining cycles</span>
              </div>
            </div>

            {/* BMS vs AI Comparison matching Mockup */}
            <div className="mt-5 p-4 rounded-xl bg-[#071615] border border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{t.bmsVsAiComparison}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  assessmentResult?.bmsComparison.result === 'Consistent'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                    : assessmentResult?.bmsComparison.result === 'Minor discrepancy'
                    ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                    : 'bg-rose-950 text-rose-300 border border-rose-600/40'
                }`}>
                  {assessmentResult?.bmsComparison.result || 'Consistent'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-emerald-400/70 block">BMS Reported</span>
                  <strong className="text-white font-mono">
                    {inputs.bmsSoh ?? 85}%
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-400/70 block">AI Estimated</span>
                  <strong className="text-emerald-400 font-mono">
                    {assessmentResult?.estimatedSoh ?? 82}%
                  </strong>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-400/70 block">Difference</span>
                  <strong className="text-white font-mono">
                    {assessmentResult ? `${assessmentResult.bmsComparison.diff}%` : '3%'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Suitability Banner matching Mockup */}
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-white block">
                  {assessmentResult?.lifecycleDecision.recommendedApplication || 'Battery is suitable for continued EV use.'}
                </strong>
                <p className="text-[11px] text-emerald-200/70 mt-0.5">
                  {assessmentResult?.lifecycleDecision.reason || 'SOH is within traction thresholds and internal resistance is normal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Commit Action */}
          {assessmentResult && (
            <div className="pt-4 border-t border-emerald-900/40 flex items-center justify-between">
              <span className="text-xs text-emerald-400/80">
                {committed ? '✅ Signed & Linked to SHA-256 Chain' : 'Ready to record in passport lifecycle'}
              </span>
              <button
                onClick={handleCommit}
                disabled={committed}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4 text-slate-950" />
                <span>{committed ? 'Block Recorded' : 'Commit to Event Chain'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
