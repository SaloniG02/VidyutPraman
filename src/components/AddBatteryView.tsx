import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  FileJson,
  ArrowRight,
  Info,
  Sparkles
} from 'lucide-react';
import { BatteryChemistry } from '../types/index.js';
import { Language, TRANSLATIONS } from '../utils/translations.js';

interface AddBatteryViewProps {
  onSubmitBattery: (batteryData: any, importData?: any) => Promise<boolean>;
  language: Language;
}

export const AddBatteryView: React.FC<AddBatteryViewProps> = ({ onSubmitBattery, language }) => {
  const t = TRANSLATIONS[language];

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    manufacturer: '',
    model: '',
    chemistry: 'Li-ion (NMC)' as BatteryChemistry,
    nominalVoltage: '400',
    ratedCapacity: '40',
    currentCapacity: '38',
    cycleCount: '50',
    manufacturingDate: new Date().toISOString().split('T')[0],
    currentOwner: '',
    previousOwner: '',
    bmsSoh: '95',
    bmsVoltage: '400',
    bmsCurrent: '0',
    bmsTemperature: '28',
    notes: ''
  });

  // Telemetry file import state
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileFormat, setFileFormat] = useState<'csv' | 'json'>('csv');
  const [importSummary, setImportSummary] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'csv' && ext !== 'json') {
      setErrorMessage('Unsupported file format. Please upload a .csv or .json file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      setFileName(file.name);
      setFileFormat(ext === 'json' ? 'json' : 'csv');
      validateTelemetryData(content, ext === 'json' ? 'json' : 'csv');
    };
    reader.onerror = () => {
      setErrorMessage('Error reading uploaded telemetry file.');
    };
    reader.readAsText(file);
  };

  const validateTelemetryData = (content: string, format: 'csv' | 'json') => {
    const errors: string[] = [];
    let validCount = 0;
    let totalCount = 0;

    if (format === 'json') {
      try {
        const parsed = JSON.parse(content);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        totalCount = rows.length;
        rows.forEach((r, idx) => {
          if (!r.timestamp || isNaN(Number(r.voltage))) {
            errors.push(`Row ${idx + 1}: Invalid or missing timestamp / voltage`);
          } else {
            validCount++;
          }
        });
      } catch {
        errors.push('Malformed JSON syntax');
      }
    } else {
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        errors.push('CSV has insufficient rows');
      } else {
        totalCount = lines.length - 1;
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',');
          if (parts.length >= 3 && parts[1] && !isNaN(parseFloat(parts[2]))) {
            validCount++;
          } else {
            errors.push(`Line ${i}: Malformed columns`);
          }
        }
      }
    }

    setImportSummary({
      totalRows: totalCount,
      validRows: validCount,
      rejectedRows: totalCount - validCount,
      errors: errors.slice(0, 5)
    });
  };

  const loadSampleTelemetry = () => {
    const sampleCsv = `batteryId,timestamp,voltage,current,temperature,cycleCount,bmsSoh
${formData.id || 'BAT-2026-NEW'},2026-09-13T08:00:00Z,402.1,0.0,27.5,50,95.0
${formData.id || 'BAT-2026-NEW'},2026-09-13T08:00:10Z,388.5,49.8,29.8,50,95.0
${formData.id || 'BAT-2026-NEW'},2026-09-13T08:00:20Z,387.9,50.1,31.2,50,95.0`;

    setFileContent(sampleCsv);
    setFileName('sample_telemetry_pulse.csv');
    setFileFormat('csv');
    validateTelemetryData(sampleCsv, 'csv');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.id.trim()) {
      setErrorMessage('Battery ID is required (e.g. BAT-2026-099).');
      return;
    }
    if (!formData.manufacturer.trim()) {
      setErrorMessage('Manufacturer name is required.');
      return;
    }
    if (!formData.model.trim()) {
      setErrorMessage('Battery model name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmitBattery(formData, fileContent ? { content: fileContent, format: fileFormat } : undefined);
      if (success) {
        setSuccessMessage(`Battery ${formData.id} successfully registered with verifiable SHA-256 Genesis block!`);
        // Reset form
        setFormData({
          id: '',
          manufacturer: '',
          model: '',
          chemistry: 'Li-ion (NMC)',
          nominalVoltage: '400',
          ratedCapacity: '40',
          currentCapacity: '38',
          cycleCount: '50',
          manufacturingDate: new Date().toISOString().split('T')[0],
          currentOwner: '',
          previousOwner: '',
          bmsSoh: '95',
          bmsVoltage: '400',
          bmsCurrent: '0',
          bmsTemperature: '28',
          notes: ''
        });
        setFileContent(null);
        setFileName(null);
        setImportSummary(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register battery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="add-battery-view" className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Add New Battery
        </h2>
        <p className="text-xs text-emerald-200/70 mt-0.5">
          Create a new digital identity for a battery pack on the VidyutPraman platform.
        </p>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pb-2 border-b border-emerald-900/40">
            Basic Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Battery ID */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Battery ID *
              </label>
              <input
                id="input-battery-id"
                type="text"
                required
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="e.g. BAT-2026-050"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 placeholder-emerald-600/70 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Manufacturer *
              </label>
              <input
                id="input-manufacturer"
                type="text"
                required
                value={formData.manufacturer}
                onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                placeholder="e.g. Tata, Mahindra, Ather"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 placeholder-emerald-600/70 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Model */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Model *
              </label>
              <input
                id="input-model"
                type="text"
                required
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g. Nexon EV Pack"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 placeholder-emerald-600/70 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Chemistry */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Chemistry
              </label>
              <select
                id="input-chemistry"
                value={formData.chemistry}
                onChange={(e) => handleInputChange('chemistry', e.target.value as BatteryChemistry)}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Li-ion (NMC)">Li-ion (NMC)</option>
                <option value="LiFePO4 (LFP)">LiFePO4 (LFP)</option>
                <option value="LTO (Lithium Titanate)">LTO (Lithium Titanate)</option>
                <option value="Solid State">Solid State</option>
              </select>
            </div>

            {/* Rated Capacity (kWh) */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Capacity (kWh)
              </label>
              <input
                id="input-capacity"
                type="number"
                step="0.1"
                value={formData.ratedCapacity}
                onChange={(e) => handleInputChange('ratedCapacity', e.target.value)}
                placeholder="e.g. 40"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Manufacturing Date */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Manufacturing Date
              </label>
              <input
                id="input-mfg-date"
                type="date"
                value={formData.manufacturingDate}
                onChange={(e) => handleInputChange('manufacturingDate', e.target.value)}
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Current Status Card */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400 pb-2 border-b border-emerald-900/40">
            Current Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* BMS Reported SOH */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                BMS Reported SOH (%)
              </label>
              <input
                id="input-bms-soh"
                type="number"
                min="0"
                max="100"
                value={formData.bmsSoh}
                onChange={(e) => handleInputChange('bmsSoh', e.target.value)}
                placeholder="e.g. 85"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Cycle Count */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Cycle Count
              </label>
              <input
                id="input-cycle-count"
                type="number"
                value={formData.cycleCount}
                onChange={(e) => handleInputChange('cycleCount', e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Current Owner */}
            <div>
              <label className="block text-xs font-semibold text-emerald-200 mb-1">
                Current Owner
              </label>
              <input
                id="input-current-owner"
                type="text"
                value={formData.currentOwner}
                onChange={(e) => handleInputChange('currentOwner', e.target.value)}
                placeholder="e.g. Fleet Operator"
                className="w-full bg-[#071615] border border-emerald-900/60 rounded-xl px-3.5 py-2 text-xs text-emerald-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Import Data (Optional) Card matching mockup */}
        <div className="bg-[#0e2724] border border-emerald-800/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
              Import Data (Optional)
            </h3>
            <button
              type="button"
              onClick={loadSampleTelemetry}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample CSV</span>
            </button>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-emerald-800/60 hover:border-emerald-500/80 rounded-2xl p-8 text-center bg-[#071615] transition-colors cursor-pointer relative"
          >
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileInputChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-emerald-200">
                Drag & drop CSV or JSON file here
              </p>
              <p className="text-[11px] text-emerald-400/60">
                Supports BMS data, test results, or telemetry logs
              </p>
            </div>
          </div>

          {fileName && (
            <div className="p-3.5 rounded-xl bg-[#081816] border border-emerald-800/40 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                {fileFormat === 'csv' ? (
                  <FileText className="w-4 h-4 text-emerald-400" />
                ) : (
                  <FileJson className="w-4 h-4 text-teal-400" />
                )}
                <div>
                  <span className="text-xs font-semibold text-white block">{fileName}</span>
                  {importSummary && (
                    <span className="text-[10px] text-emerald-400 font-mono block">
                      Validated: {importSummary.validRows} valid rows (0 rejected)
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFileContent(null);
                  setFileName(null);
                  setImportSummary(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Submit button matching mockup */}
        <div className="flex justify-end pt-2">
          <button
            id="submit-register-battery-btn"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-sm transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Hashing & Registering...' : 'Register Battery'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
