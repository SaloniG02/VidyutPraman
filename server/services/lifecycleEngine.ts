import { LifecycleStatus, BmsComparisonResult, SystemSettings } from '../../src/types/index.js';

export interface LifecycleEvaluationInput {
  estimatedSoh: number;
  confidence: number;
  internalResistance: number;
  temperatureRise: number;
  bmsComparison?: BmsComparisonResult;
  warnings?: string[];
  settings: SystemSettings;
}

export interface LifecycleEvaluationResult {
  status: LifecycleStatus;
  reason: string;
  category: 'First-Life Mobility' | 'Stationary Repurposing' | 'Material Recovery' | 'Diagnostic Audit';
}

/**
 * Transparent circular-economy routing engine.
 * Evaluates multi-parameter indicators to recommend optimal battery end-of-life or second-life routing.
 */
export function evaluateLifecycleStatus(input: LifecycleEvaluationInput): LifecycleEvaluationResult {
  const {
    estimatedSoh,
    confidence,
    internalResistance,
    temperatureRise,
    bmsComparison,
    warnings = [],
    settings
  } = input;

  // 1. Check for Re-Evaluation triggers (Low confidence, major mismatch, or safety anomalies)
  if (confidence < 60) {
    return {
      status: 'RE_EVALUATION_REQUIRED',
      reason: `Low estimation confidence (${confidence}%). Telemetry data is noisy or incomplete; full laboratory diagnosis recommended.`,
      category: 'Diagnostic Audit'
    };
  }

  if (bmsComparison === 'Significant mismatch') {
    return {
      status: 'RE_EVALUATION_REQUIRED',
      reason: `Significant mismatch (>15%) between BMS-reported SOH and AI pulse screening. Onboard sensor drift or cell imbalance must be inspected.`,
      category: 'Diagnostic Audit'
    };
  }

  if (temperatureRise > 15) {
    return {
      status: 'RECYCLING_REQUIRED',
      reason: `Severe thermal rise (${temperatureRise}°C) during short pulse test indicates internal micro-shorting or high SEI impedance. Unsafe for reuse.`,
      category: 'Material Recovery'
    };
  }

  // 2. Check for Recycling Required (SOH < 65% or dangerously high internal resistance)
  if (estimatedSoh < settings.secondLifeMinSoh || internalResistance > 0.45) {
    return {
      status: 'RECYCLING_REQUIRED',
      reason: `Degraded SOH (${estimatedSoh}% < ${settings.secondLifeMinSoh}%) or critical internal resistance (${internalResistance} Ω). Routed for raw material mineral extraction (Li, Co, Ni).`,
      category: 'Material Recovery'
    };
  }

  // 3. Check for EV Ready (High SOH >= 80%, low resistance, healthy confidence)
  if (
    estimatedSoh >= settings.evReadyMinSoh &&
    internalResistance <= settings.maxInternalResistanceWarning &&
    confidence >= 70 &&
    (bmsComparison === 'Consistent' || bmsComparison === 'Minor discrepancy' || !bmsComparison)
  ) {
    return {
      status: 'EV_READY',
      reason: `Excellent health retention (${estimatedSoh}% SOH) with low internal resistance (${internalResistance} Ω). Certified for continued primary EV traction duty.`,
      category: 'First-Life Mobility'
    };
  }

  // 4. Second-Life Ready (SOH 65% - 79%)
  if (estimatedSoh >= settings.secondLifeMinSoh) {
    return {
      status: 'SECOND_LIFE_READY',
      reason: `Moderate health (${estimatedSoh}% SOH). Optimal for stationary energy storage (BESS), solar street lighting, telecom UPS, or e-rickshaw repowering.`,
      category: 'Stationary Repurposing'
    };
  }

  // Fallback safe classification
  return {
    status: 'RE_EVALUATION_REQUIRED',
    reason: 'Multi-parameter threshold review required by circular economy operator.',
    category: 'Diagnostic Audit'
  };
}
