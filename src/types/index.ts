export type BatteryChemistry = 
  | 'Li-ion (NMC)' 
  | 'LiFePO4 (LFP)' 
  | 'LTO (Lithium Titanate)' 
  | 'Solid State';

export type LifecycleStatus = 
  | 'EV_READY' 
  | 'SECOND_LIFE_READY' 
  | 'RECYCLING_REQUIRED' 
  | 'RE_EVALUATION_REQUIRED';

export type VerificationStatus = 
  | 'VERIFIED' 
  | 'MISMATCH_DETECTED' 
  | 'UNVERIFIED' 
  | 'TAMPER_DETECTED';

export type BmsComparisonResult = 
  | 'Consistent' 
  | 'Minor discrepancy' 
  | 'Review required' 
  | 'Significant mismatch';

export interface Battery {
  id: string; // e.g. BAT-2026-001
  passportId: string;
  manufacturer: string;
  model: string;
  chemistry: BatteryChemistry;
  nominalVoltage: number; // in Volts (e.g. 400V)
  ratedCapacity: number; // in kWh (e.g. 40kWh)
  currentCapacity: number; // in kWh
  cycleCount: number;
  manufacturingDate: string; // YYYY-MM-DD
  currentOwner: string;
  previousOwners?: string[];
  
  // BMS reported values
  bmsSoh: number; // percentage (0-100)
  bmsVoltage: number;
  bmsCurrent: number;
  bmsTemperature: number;

  // AI & Pulse Assessment values
  aiEstimatedSoh: number;
  estimatedRul: number; // cycles remaining
  confidence: number; // 0-100%
  voltageSag: number; // ΔV in Volts
  internalResistance: number; // Rint in Ohms (Ω)
  temperatureRise: number; // ΔT in °C
  
  // Status and Circular Routing
  lifecycleStatus: LifecycleStatus;
  lifecycleReason: string;
  verificationStatus: VerificationStatus;
  lastAssessmentDate: string;
  notes?: string;

  // Meta
  isDemo: boolean;
  dataSource: 'hardware' | 'simulated' | 'imported' | 'manual';
  createdAt: string;
  updatedAt: string;
}

export type LifecycleEventType = 
  | 'MANUFACTURED'
  | 'FIRST_OWNER_SALE'
  | 'PERIODIC_ASSESSMENT'
  | 'PULSE_HEALTH_TEST'
  | 'OWNERSHIP_TRANSFER'
  | 'SECOND_LIFE_REPURPOSING'
  | 'MAINTENANCE_OR_REPAIR'
  | 'RECYCLING_DISPATCH';

export interface LifecycleEvent {
  id: string;
  batteryId: string;
  eventType: LifecycleEventType;
  timestamp: string;
  actor: string;
  eventData: Record<string, any>;
  prevHash: string;
  hash: string;
  tampered?: boolean;
}

export interface PulseTestInput {
  initialVoltage: number;
  loadedVoltage: number;
  initialCurrent: number;
  loadedCurrent: number;
  initialTemperature: number;
  finalTemperature: number;
  cycleCount: number;
  chemistry: BatteryChemistry;
  ratedCapacity: number;
  currentCapacity: number;
  bmsSoh?: number;
}

export interface PulseTestResult {
  deltaV: number;
  deltaI: number;
  internalResistance: number;
  temperatureRise: number;
  aiEstimatedSoh: number;
  estimatedRul: number;
  confidence: number;
  bmsSoh?: number;
  bmsDifference?: number;
  bmsDifferencePercent?: number;
  bmsComparisonResult?: BmsComparisonResult;
  lifecycleStatus: LifecycleStatus;
  lifecycleReason: string;
  warnings: string[];
  estimationMethod: 'python_random_forest' | 'prototype_fallback_estimator';
  timestamp: string;
}

export interface ChainVerificationResult {
  batteryId: string;
  isValid: boolean;
  totalEvents: number;
  tamperedEventIndex?: number;
  tamperedEventId?: string;
  details: string;
  verifiedAt: string;
}

export interface TelemetryReading {
  batteryId: string;
  timestamp: string;
  voltage: number;
  current: number;
  temperature: number;
  cycleCount?: number;
  bmsSoh?: number;
  source: 'hardware' | 'simulated' | 'imported';
}

export interface ImportSummary {
  totalRows: number;
  validRows: number;
  rejectedRows: number;
  errors: Array<{ row: number; field: string; message: string; value?: any }>;
  previewData: TelemetryReading[];
}

export interface SystemSettings {
  storageMode: 'postgresql' | 'in-memory-fallback';
  databaseUrlConfigured: boolean;
  bmsConsistencyThreshold: number; // e.g. 5%
  bmsReviewThreshold: number; // e.g. 15%
  evReadyMinSoh: number; // e.g. 80%
  secondLifeMinSoh: number; // e.g. 65%
  maxInternalResistanceWarning: number; // e.g. 0.35 Ω
  esp32SimulatedEnabled: boolean;
  esp32LastPing?: string;
  language: 'en' | 'hi';
}
