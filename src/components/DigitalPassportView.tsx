import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  VolumeX,
  Zap,
  Sparkles,
  QrCode,
  Share2
} from 'lucide-react';
import { Battery, LifecycleEvent, ChainVerificationResult } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';
import { speakText, isSpeechSupported } from '../utils/voice.js';

interface DigitalPassportViewProps {
  batteries: Battery[];
  selectedBatteryId?: string;
  events: LifecycleEvent[];
  verificationResult?: ChainVerificationResult | null;
  onVerifyChain: (batteryId: string) => Promise<void>;
  language: Language;
}

export const DigitalPassportView: React.FC<DigitalPassportViewProps> = ({
  batteries,
  selectedBatteryId,
  events,
  verificationResult,
  onVerifyChain,
  language
}) => {
  const t = TRANSLATIONS[language];
  const safeBatteries = Array.isArray(batteries) ? batteries : [];
  const [activeBatteryId, setActiveBatteryId] = useState<string>(
    selectedBatteryId || safeBatteries[0]?.id || 'BAT-2026-001'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cancelSpeech, setCancelSpeech] = useState<(() => void) | null>(null);

  const currentBattery = safeBatteries.find((b) => b.id === activeBatteryId) || safeBatteries[0];

  const passportUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?tab=passport&id=${currentBattery?.id || ''}`
    : `https://vidyutpraman.in/passport/${currentBattery?.id || ''}`;

  const handlePrint = () => {
    window.print();
  };

  const handleVerify = async () => {
    if (!currentBattery) return;
    setIsVerifying(true);
    try {
      await onVerifyChain(currentBattery.id);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVoiceNarration = () => {
    if (isSpeaking && cancelSpeech) {
      cancelSpeech();
      setIsSpeaking(false);
      return;
    }

    if (!currentBattery) return;

    const text = language === 'hi'
      ? `बैटरी आधार डिजिटल पासपोर्ट। बैटरी पहचान संख्या: ${currentBattery.id}। निर्माता: ${currentBattery.manufacturer}। रसायन: ${currentBattery.chemistry}। अनुमानित एसओएच: ${currentBattery.aiEstimatedSoh} प्रतिशत। यह रिकॉर्ड एसएचए 256 क्रिप्टोग्राफी द्वारा पूरी तरह सत्यापित और सुरक्षित है।`
      : `Digital Battery Aadhaar Passport for Battery ${currentBattery.id}. Manufacturer: ${currentBattery.manufacturer}, model: ${currentBattery.model}. Chemistry: ${currentBattery.chemistry}, nominal voltage: ${currentBattery.nominalVoltage} volts. Estimated health: ${currentBattery.aiEstimatedSoh} percent. This passport is tamper-evident and verified using SHA-256 cryptography.`;

    const voice = speakText(text, {
      language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });

    setCancelSpeech(() => voice.cancel);
  };

  if (!currentBattery) {
    return (
      <div className="p-8 text-center text-emerald-400">
        No batteries registered in system.
      </div>
    );
  }

  const isEvReady = currentBattery.lifecycleStatus === 'EV_READY';
  const isSecondLife = currentBattery.lifecycleStatus === 'SECOND_LIFE_READY';

  return (
    <div id="digital-passport-view" className="space-y-6 pb-16">
      {/* Top Header & Actions matching Mockup */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <QrCode className="w-4 h-4" />
            <span>Digital Product Passport (DPP) Standard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Digital Battery Passport
          </h2>
          <p className="text-xs text-emerald-200/70 mt-1">
            A secure and verifiable identity for the entire battery lifecycle.
          </p>
        </div>

        {/* Action buttons: Battery Picker, Voice, Download PDF */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <select
            value={activeBatteryId}
            onChange={(e) => setActiveBatteryId(e.target.value)}
            className="bg-[#071615] border border-emerald-900/60 rounded-xl px-3 py-2 text-xs text-emerald-100 font-mono focus:outline-none focus:border-emerald-500"
          >
            {safeBatteries.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} ({b.model})
              </option>
            ))}
          </select>

          {isSpeechSupported() && (
            <button
              onClick={handleVoiceNarration}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isSpeaking
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 animate-pulse'
                  : 'bg-[#071615] text-emerald-300 border-emerald-900/60 hover:text-white'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? 'Stop Voice' : 'Listen Audio'}</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>Download / Print Passport</span>
          </button>
        </div>
      </div>

      {/* Main Passport Card matching Mockup Layout */}
      <div className="passport-card bg-[#0e2724] border border-emerald-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Top Header inside Passport */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-emerald-900/40 gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-white tracking-tight">
                  VidyutPraman — Battery Aadhaar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-600/40">
                  Govt. Interoperable DPP
                </span>
              </div>
              <p className="text-xs text-emerald-200/70 mt-0.5">
                Government of India Battery Waste Management Rules (BWMR) Compliant Passport
              </p>
            </div>
          </div>

          <div className="text-right sm:self-auto font-mono text-xs text-emerald-400/80">
            <span className="block text-emerald-300 font-bold">Passport ID: {currentBattery.passportId}</span>
            <span className="block text-[10px] text-emerald-500">Issued: {currentBattery.createdAt.split('T')[0]}</span>
          </div>
        </div>

        {/* Two-Column Body matching Mockup */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column: Identity & Specs (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            {/* Battery ID & QR Row */}
            <div className="flex items-start justify-between bg-[#081816] border border-emerald-900/50 rounded-2xl p-5">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Unique Identification Number (UIN)
                </span>
                <h4 className="text-2xl font-black text-white font-mono mt-1">
                  {currentBattery.id}
                </h4>
                <div className="mt-2 flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isEvReady
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600/40'
                      : isSecondLife
                      ? 'bg-amber-950 text-amber-300 border-amber-600/40'
                      : 'bg-rose-950 text-rose-300 border-rose-600/40'
                  }`}>
                    {currentBattery.lifecycleStatus.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-emerald-400/80 font-mono">
                    {currentBattery.chemistry}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              <div className="p-2.5 rounded-xl bg-white text-slate-950 flex flex-col items-center">
                <QRCodeSVG value={passportUrl} size={88} level="M" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 mt-1">
                  Scan to Verify
                </span>
              </div>
            </div>

            {/* Technical Specifications Grid */}
            <div className="bg-[#081816] border border-emerald-900/50 rounded-2xl p-5 space-y-3">
              <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider pb-2 border-b border-emerald-900/40">
                Technical Specifications
              </h5>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                <div>
                  <span className="text-emerald-400/70 block">Manufacturer</span>
                  <strong className="text-white font-medium">{currentBattery.manufacturer}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Model</span>
                  <strong className="text-white font-medium">{currentBattery.model}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Nominal Voltage</span>
                  <strong className="text-white font-mono">{currentBattery.nominalVoltage} V</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Rated Capacity</span>
                  <strong className="text-white font-mono">{currentBattery.ratedCapacity} kWh</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Cycle Count</span>
                  <strong className="text-white font-mono">{currentBattery.cycleCount}</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Mfg Date</span>
                  <strong className="text-white font-medium">{currentBattery.manufacturingDate}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-900/40 flex items-center justify-between text-xs">
                <span className="text-emerald-400/70">Current Custodian:</span>
                <strong className="text-white font-mono">{currentBattery.currentOwner}</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Health & Cryptographic Verification (5 cols) */}
          <div className="md:col-span-5 space-y-6">
            {/* Health Summary with Circular Gauge matching Mockup */}
            <div className="bg-[#081816] border border-emerald-900/50 rounded-2xl p-5 flex flex-col items-center justify-between text-center">
              <div className="w-full text-left pb-2 border-b border-emerald-900/40">
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Health Summary
                </h5>
              </div>

              <div className="my-4 relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="text-[#0c2421]"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className={
                      currentBattery.aiEstimatedSoh >= 80
                        ? 'text-emerald-400'
                        : currentBattery.aiEstimatedSoh >= 65
                        ? 'text-amber-400'
                        : 'text-rose-500'
                    }
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - currentBattery.aiEstimatedSoh / 100)}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-black text-white tracking-tight">
                    {currentBattery.aiEstimatedSoh}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400/80 uppercase">
                    SOH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full pt-2 border-t border-emerald-900/40 text-xs">
                <div>
                  <span className="text-emerald-400/70 block">Estimated RUL</span>
                  <strong className="text-white font-mono">~{currentBattery.estimatedRul} cycles</strong>
                </div>
                <div>
                  <span className="text-emerald-400/70 block">Confidence</span>
                  <strong className="text-white font-mono">{currentBattery.confidence}%</strong>
                </div>
              </div>
            </div>

            {/* Suitability Banner matching Mockup */}
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-600/40 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-white block">
                  {currentBattery.lifecycleReason || 'Battery is suitable for continued EV use.'}
                </strong>
                <p className="text-[11px] text-emerald-200/70 mt-0.5">
                  Internal resistance: {currentBattery.internalResistance} Ω | Voltage sag: {currentBattery.voltageSag} V
                </p>
              </div>
            </div>

            {/* Verified Record Card matching Mockup */}
            <div className="p-4 rounded-2xl bg-[#081816] border border-emerald-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Record</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-400">
                  {events.length} Blocks
                </span>
              </div>

              <p className="text-xs text-emerald-200/80 leading-relaxed">
                {t.verifiedRecordNotice}
              </p>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 font-mono">
                  {verificationResult?.isValid !== false ? '✅ Hash Integrity Valid' : '⚠️ Tamper Detected'}
                </span>
                <button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Chain'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Passport Footer Disclaimer */}
        <div className="pt-6 border-t border-emerald-900/40 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-400/60 gap-2">
          <span>Official VidyutPraman Prototype • Cryptographic Hash Chain Identity</span>
          <span className="font-mono">SHA-256 Digest: {events[events.length - 1]?.hash.substring(0, 24)}...</span>
        </div>
      </div>
    </div>
  );
};
