import React, { useState } from 'react';
import {
  Search,
  Filter,
  Eye,
  Activity,
  QrCode,
  Clock,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { Battery, LifecycleStatus } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';

interface BatteryRegistryViewProps {
  batteries: Battery[];
  onSelectBattery: (batteryId: string, action: 'details' | 'assessment' | 'passport' | 'lifecycle') => void;
  onDeleteBattery: (batteryId: string) => void;
  onNavigateAdd: () => void;
  language: Language;
}

export const BatteryRegistryView: React.FC<BatteryRegistryViewProps> = ({
  batteries,
  onSelectBattery,
  onDeleteBattery,
  onNavigateAdd,
  language
}) => {
  const t = TRANSLATIONS[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [chemistryFilter, setChemistryFilter] = useState<string>('ALL');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const safeBatteries = Array.isArray(batteries) ? batteries : [];

  // Filter and sort batteries
  const filtered = safeBatteries.filter((b) => {
    const matchesSearch =
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.currentOwner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.passportId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.lifecycleStatus === statusFilter;
    const matchesChem = chemistryFilter === 'ALL' || b.chemistry === chemistryFilter;

    return matchesSearch && matchesStatus && matchesChem;
  });

  const getStatusBadge = (status: LifecycleStatus) => {
    switch (status) {
      case 'EV_READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            EV Ready
          </span>
        );
      case 'SECOND_LIFE_READY':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Second-Life
          </span>
        );
      case 'RECYCLING_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
            Recycling
          </span>
        );
      case 'RE_EVALUATION_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 text-purple-300 border border-purple-600/40">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Review Needed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div id="battery-registry-view" className="space-y-5 pb-12">
      {/* Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {t.batteryRegistry}
          </h2>
          <p className="text-xs text-emerald-200/70 mt-0.5">
            Decentralized registry of Indian electric vehicle battery packs with verified SHA-256 passports.
          </p>
        </div>

        <button
          id="add-battery-nav-btn"
          onClick={onNavigateAdd}
          className="self-start sm:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>{t.addBattery}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID, model, manufacturer..."
            className="w-full bg-[#071615] border border-emerald-900/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-emerald-100 placeholder-emerald-600/70 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#071615] border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Lifecycle Statuses</option>
            <option value="EV_READY">EV Ready (≥80% SOH)</option>
            <option value="SECOND_LIFE_READY">Second-Life Ready (65-79% SOH)</option>
            <option value="RECYCLING_REQUIRED">Recycling Required (&lt;65% SOH)</option>
            <option value="RE_EVALUATION_REQUIRED">Re-evaluation Required</option>
          </select>

          {/* Chemistry Filter */}
          <select
            value={chemistryFilter}
            onChange={(e) => setChemistryFilter(e.target.value)}
            className="bg-[#071615] border border-emerald-900/60 rounded-lg px-3 py-1.5 text-xs text-emerald-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Chemistries</option>
            <option value="Li-ion (NMC)">Li-ion (NMC)</option>
            <option value="LiFePO4 (LFP)">LiFePO4 (LFP)</option>
            <option value="LTO (Lithium Titanate)">LTO</option>
            <option value="Solid State">Solid State</option>
          </select>
        </div>
      </div>

      {/* Battery Table */}
      <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#081b19] border-b border-emerald-900/60 text-emerald-400/90 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Battery ID / Model</th>
                <th className="py-3 px-3">Chemistry</th>
                <th className="py-3 px-3">Specs (V / kWh)</th>
                <th className="py-3 px-3">Cycles</th>
                <th className="py-3 px-3">BMS SOH</th>
                <th className="py-3 px-3">AI SOH</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/30">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-emerald-400/60">
                    No batteries match your search filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const bmsDiff = b.bmsSoh ? Math.abs(b.bmsSoh - b.aiEstimatedSoh) : 0;
                  return (
                    <tr 
                      key={b.id} 
                      className="hover:bg-[#12332f]/40 transition-colors group"
                    >
                      {/* ID & Model */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                          <div>
                            <span 
                              onClick={() => onSelectBattery(b.id, 'details')}
                              className="font-bold text-white font-mono hover:text-emerald-300 cursor-pointer block"
                            >
                              {b.id}
                            </span>
                            <span className="text-[11px] text-emerald-300/70 block">
                              {b.manufacturer} • {b.model}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Chemistry */}
                      <td className="py-3.5 px-3 font-medium text-emerald-200">
                        {b.chemistry}
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-3 text-emerald-200/90 font-mono">
                        {b.nominalVoltage}V • {b.ratedCapacity} kWh
                      </td>

                      {/* Cycles */}
                      <td className="py-3.5 px-3 text-emerald-200 font-mono">
                        {b.cycleCount}
                      </td>

                      {/* BMS SOH */}
                      <td className="py-3.5 px-3 font-mono">
                        <span className="text-emerald-300 font-semibold">{b.bmsSoh}%</span>
                      </td>

                      {/* AI SOH & RUL */}
                      <td className="py-3.5 px-3 font-mono">
                        <div className="flex items-center space-x-1.5">
                          <span className={`font-bold ${
                            b.aiEstimatedSoh >= 80 ? 'text-emerald-400' : b.aiEstimatedSoh >= 65 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {b.aiEstimatedSoh}%
                          </span>
                          {bmsDiff > 10 && (
                            <span title="Significant divergence between BMS and AI assessment" className="text-amber-400 text-[10px]">⚠️</span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-400/60 block">
                          ~{b.estimatedRul} cyc ({b.confidence}%)
                        </span>
                      </td>

                      {/* Lifecycle Status */}
                      <td className="py-3.5 px-3">
                        {getStatusBadge(b.lifecycleStatus)}
                      </td>

                      {/* Verification */}
                      <td className="py-3.5 px-3">
                        {b.verificationStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>SHA-256</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 font-mono">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Audit</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            title="View battery details"
                            onClick={() => onSelectBattery(b.id, 'details')}
                            className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-800/40 hover:text-white transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            title="Run controlled pulse test"
                            onClick={() => onSelectBattery(b.id, 'assessment')}
                            className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-800/40 hover:text-white transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                          <button
                            title="Open digital passport"
                            onClick={() => onSelectBattery(b.id, 'passport')}
                            className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-800/40 hover:text-white transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          <button
                            title="View blockchain lifecycle history"
                            onClick={() => onSelectBattery(b.id, 'lifecycle')}
                            className="p-1.5 rounded-lg text-emerald-300 hover:bg-emerald-800/40 hover:text-white transition-colors"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete battery"
                            onClick={() => setDeleteConfirmId(b.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 hover:text-rose-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c2421] border border-rose-800/60 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span>Confirm Battery Removal</span>
            </h3>
            <p className="text-xs text-emerald-100/80 mt-2 leading-relaxed">
              Are you sure you want to remove <strong className="text-white font-mono">{deleteConfirmId}</strong> from the battery registry? This will archive its passport and hash chain records.
            </p>
            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-[#081816] text-emerald-300 text-xs font-semibold hover:bg-emerald-950"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBattery(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 shadow-md shadow-rose-700/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
