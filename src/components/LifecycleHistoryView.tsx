import React, { useState } from 'react';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  GitCommit,
  UserCheck,
  Activity,
  PlusCircle,
  FileCheck,
  RefreshCcw,
  Sparkles
} from 'lucide-react';
import { Battery, LifecycleEvent, ChainVerificationResult } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';

interface LifecycleHistoryViewProps {
  batteries: Battery[];
  selectedBatteryId?: string;
  events: LifecycleEvent[];
  verificationResult?: ChainVerificationResult | null;
  onVerifyChain: (batteryId: string) => Promise<void>;
  onTamperDemo: (batteryId: string) => Promise<void>;
  onRestoreDemo: (batteryId: string) => Promise<void>;
  onAddTransfer: (batteryId: string, toOwner: string) => Promise<void>;
  language: Language;
}

export const LifecycleHistoryView: React.FC<LifecycleHistoryViewProps> = ({
  batteries,
  selectedBatteryId,
  events,
  verificationResult,
  onVerifyChain,
  onTamperDemo,
  onRestoreDemo,
  onAddTransfer,
  language
}) => {
  const t = TRANSLATIONS[language];
  const safeBatteries = Array.isArray(batteries) ? batteries : [];
  const [activeBatteryId, setActiveBatteryId] = useState<string>(
    selectedBatteryId || safeBatteries[0]?.id || 'BAT-2026-001'
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTampering, setIsTampering] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferOwner, setTransferOwner] = useState('');

  const currentBattery = safeBatteries.find((b) => b.id === activeBatteryId) || safeBatteries[0];

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await onVerifyChain(activeBatteryId);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTamperTest = async () => {
    setIsTampering(true);
    try {
      await onTamperDemo(activeBatteryId);
    } finally {
      setIsTampering(false);
    }
  };

  const handleRestore = async () => {
    setIsTampering(true);
    try {
      await onRestoreDemo(activeBatteryId);
    } finally {
      setIsTampering(false);
    }
  };

  const handleCommitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferOwner.trim()) return;
    await onAddTransfer(activeBatteryId, transferOwner.trim());
    setTransferOwner('');
    setShowTransferModal(false);
  };

  const isValid = verificationResult?.isValid ?? true;

  return (
    <div id="lifecycle-history-view" className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" />
            <span>Cryptographic Event Provenance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Lifecycle History
          </h2>
          <p className="text-xs text-emerald-200/70 mt-1">
            Immutable SHA-256 hash-chain documenting all custodial transitions and pulse screenings.
          </p>
        </div>

        {/* Battery selector & Add Transfer button */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
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

          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-slate-950" />
            <span>Transfer Custody</span>
          </button>
        </div>
      </div>

      {/* Chain Status Card matching Mockup */}
      <div className={`p-6 rounded-2xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isValid
          ? 'bg-[#0e2724] border-emerald-700/60'
          : 'bg-rose-950/60 border-rose-600/70'
      }`}>
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            isValid ? 'bg-emerald-900 text-emerald-400' : 'bg-rose-900 text-rose-300'
          }`}>
            {isValid ? <ShieldCheck className="w-7 h-7" /> : <ShieldAlert className="w-7 h-7 animate-bounce" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">
                {isValid ? t.chainStatusValid : t.chainStatusInvalid}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                isValid ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-900 text-rose-200'
              }`}>
                {events.length} Blocks Verified
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              {isValid
                ? t.allRecordsIntact
                : `Tampering detected at block #${(verificationResult?.tamperedEventIndex ?? 0) + 1}! Hash mismatch: calculated hash does not match stored block hash.`}
            </p>
          </div>
        </div>

        {/* Action buttons: Re-verify & Tamper Test matching Mockup */}
        <div className="flex items-center space-x-2.5 self-end sm:self-auto">
          {isValid ? (
            <button
              onClick={handleTamperTest}
              disabled={isTampering}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-950/80 border border-amber-700/50 text-amber-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isTampering ? 'Simulating...' : t.tamperTest}</span>
            </button>
          ) : (
            <button
              onClick={handleRestore}
              disabled={isTampering}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-950/80 border border-teal-700/50 text-teal-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Restore Intact Chain</span>
            </button>
          )}

          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow cursor-pointer disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Verifying...' : t.reVerify}</span>
          </button>
        </div>
      </div>

      {/* Timeline of Blockchain-like Events */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-6">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pb-2 border-b border-emerald-900/40 flex items-center justify-between">
          <span>Provenance Timeline ({events.length} blocks)</span>
          <span className="text-xs text-emerald-400/70 font-mono">Battery: {activeBatteryId}</span>
        </h4>

        <div className="relative pl-6 space-y-6 border-l-2 border-emerald-900/60 ml-3">
          {events.map((event, index) => {
            const isGenesis = index === 0;
            const isTamperedThis = !isValid && verificationResult?.tamperedEventIndex === index;

            return (
              <div key={event.id} className="relative group">
                {/* Timeline node icon */}
                <div className={`absolute -left-[31px] top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isTamperedThis
                    ? 'bg-rose-500 border-rose-300 text-slate-950 animate-ping'
                    : isGenesis
                    ? 'bg-emerald-400 border-emerald-200 text-slate-950'
                    : 'bg-[#081816] border-emerald-400 text-emerald-300'
                }`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>

                {/* Event Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  isTamperedThis
                    ? 'bg-rose-950/80 border-rose-600 text-rose-200 shadow-lg shadow-rose-900/40'
                    : 'bg-[#081816] border-emerald-900/50 hover:border-emerald-700/60'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-emerald-900/30">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono font-bold">
                        Block #{index + 1}
                      </span>
                      <strong className="text-sm font-bold text-white">
                        {event.eventType.replace(/_/g, ' ')}
                      </strong>
                      <span className="text-xs text-emerald-300/80">• {event.actor}</span>
                    </div>
                    <span className="text-[11px] text-emerald-400/60 font-mono">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Metadata preview */}
                  <div className="py-2 text-xs text-emerald-200/90 space-y-1">
                    {event.payload && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#051110] p-2.5 rounded-lg font-mono">
                        {Object.entries(event.payload).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-emerald-500 block capitalize">{k}:</span>
                            <span className="text-white truncate block">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hashes */}
                  <div className="pt-2 border-t border-emerald-900/30 space-y-1 text-[11px] font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-500/80 w-16 shrink-0">Block Hash:</span>
                      <span className={`break-all ${isTamperedThis ? 'text-rose-300 font-bold' : 'text-emerald-300'}`}>
                        0x{event.hash}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-emerald-600/70 w-16 shrink-0">Prev Hash:</span>
                      <span className="break-all text-emerald-600">
                        0x{event.prevHash}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custody Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c2421] border border-emerald-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Record Custody Transfer</span>
            </h3>
            <p className="text-xs text-emerald-200/70 mt-1">
              Record a new custodial transfer for <strong className="text-white font-mono">{activeBatteryId}</strong>. This event will be signed into the SHA-256 hash-chain.
            </p>

            <form onSubmit={handleCommitTransfer} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-200 mb-1">
                  New Owner / Recipient Organization *
                </label>
                <input
                  type="text"
                  required
                  value={transferOwner}
                  onChange={(e) => setTransferOwner(e.target.value)}
                  placeholder="e.g. Lithium Recycling India Ltd, BESS Facility Pune"
                  className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-emerald-700 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#081816] text-emerald-300 text-xs font-semibold hover:bg-emerald-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-slate-950 text-xs font-bold hover:bg-emerald-500 shadow-md"
                >
                  Record to Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
