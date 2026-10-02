import { execFile } from 'child_process';
import path from 'path';
import { PulseTestInput, PulseTestResult, BmsComparisonResult, SystemSettings } from '../../src/types/index.js';
import { evaluateLifecycleStatus } from './lifecycleEngine.js';

/**
 * Calculates fundamental electrical indicators from raw pulse-test inputs.
 */
export function calculateElectricalIndicators(input: PulseTestInput) {
  const deltaV = Math.round((input.initialVoltage - input.loadedVoltage) * 100) / 100;
  const deltaI = Math.round((input.loadedCurrent - input.initialCurrent) * 100) / 100;
  
  const warnings: string[] = [];

  // Safe internal resistance calculation with division-by-zero protection
  let internalResistance = 0;
  if (Math.abs(deltaI) < 0.001) {
    warnings.push('Zero or negligible current step detected (ΔI ≈ 0). Internal resistance cannot be accurately calculated.');
    internalResistance = 0.25; // Safe default for uncalibrated prototype
  } else if (deltaI < 0) {
    warnings.push('Negative current delta detected during discharge pulse. Test polarity might be reversed.');
    internalResistance = Math.abs(deltaV / deltaI);
  } else {
    internalResistance = Math.round((deltaV / deltaI) * 1000) / 1000;
  }

  // Temperature rise
  const temperatureRise = Math.round((input.finalTemperature - input.initialTemperature) * 10) / 10;
  if (temperatureRise < 0) {
    warnings.push('Temperature drop during pulse test. Sensor calibration may be required.');
  } else if (temperatureRise > 15) {
    warnings.push('Significant thermal rise (>15°C) during 10s pulse test. Cell thermal runaway risk.');
  }

  if (deltaV < 0) {
    warnings.push('Voltage rise during loaded test. Verify test apparatus wiring.');
  }

  return {
    deltaV,
    deltaI,
    internalResistance,
    temperatureRise,
    warnings
  };
}

/**
 * Transparent fallback estimator when Python process is unavailable or uncalibrated.
 */
export function estimateBatteryHealthFallback(
  input: PulseTestInput,
  internalResistance: number,
  deltaV: number,
  temperatureRise: number
): { soh: number; rul: number; confidence: number } {
  const capacityRatio = input.currentCapacity / Math.max(1, input.ratedCapacity);
  const capSoh = Math.min(100, Math.max(10, capacityRatio * 100));

  // Electrochemical baseline resistance offsets
  const isLfp = input.chemistry.includes('LFP');
  const isLto = input.chemistry.includes('LTO');
  const baseRint = isLto ? 0.08 : isLfp ? 0.12 : 0.18;
  const maxCycles = isLto ? 10000 : isLfp ? 3500 : 2000;

  // Resistance penalty
  const rintExcess = Math.max(0, internalResistance - baseRint);
  const rintPenalty = rintExcess * 40.0;

  // Cycle life penalty
  const cyclePenalty = (input.cycleCount / maxCycles) * 20.0;

  let estimatedSoh = (capSoh * 0.55) + ((100 - rintPenalty - cyclePenalty) * 0.45);
  estimatedSoh = Math.round(Math.max(15, Math.min(99, estimatedSoh)) * 10) / 10;

  // Remaining useful life estimation (to 70% threshold)
  const remainingLifeSoh = Math.max(0, estimatedSoh - 70);
  const cycleFactor = maxCycles / 30.0;
  let estimatedRul = Math.round(remainingLifeSoh * cycleFactor);

  // Confidence computation
  let confidence = 88;
  if (input.bmsSoh) {
    const diff = Math.abs(estimatedSoh - input.bmsSoh);
    if (diff > 10) confidence -= Math.min(30, Math.round((diff - 10) * 1.8));
  }
  if (internalResistance > 0.35) confidence -= 12;
  if (temperatureRise > 10) confidence -= 8;
  confidence = Math.max(45, Math.min(95, confidence));

  return {
    soh: estimatedSoh,
    rul: estimatedRul,
    confidence
  };
}

/**
 * Executes prediction via Python CLI script with graceful fallback.
 */
export async function runSohPrediction(
  input: PulseTestInput,
  internalResistance: number,
  deltaV: number,
  temperatureRise: number
): Promise<{
  soh: number;
  rul: number;
  confidence: number;
  method: 'python_random_forest' | 'prototype_fallback_estimator';
}> {
  return new Promise((resolve) => {
    const scriptPath = path.resolve(process.cwd(), 'python', 'predict.py');
    const payload = JSON.stringify({
      chemistry: input.chemistry,
      rated_capacity: input.ratedCapacity,
      current_capacity: input.currentCapacity,
      cycle_count: input.cycleCount,
      internal_resistance: internalResistance,
      voltage_sag: deltaV,
      temperature_rise: temperatureRise,
      bms_soh: input.bmsSoh ?? 85.0
    });

    execFile('python3', [scriptPath, payload], { timeout: 3500 }, (error, stdout) => {
      if (!error && stdout) {
        try {
          const res = JSON.parse(stdout.trim());
          if (res.status === 'success' && typeof res.estimated_soh === 'number') {
            return resolve({
              soh: res.estimated_soh,
              rul: res.estimated_rul ?? 1000,
              confidence: res.confidence ?? 85,
              method: 'python_random_forest'
            });
          }
        } catch {
          // JSON parsing failed, use fallback
        }
      }

      // Fallback
      const fb = estimateBatteryHealthFallback(input, internalResistance, deltaV, temperatureRise);
      resolve({
        soh: fb.soh,
        rul: fb.rul,
        confidence: fb.confidence,
        method: 'prototype_fallback_estimator'
      });
    });
  });
}

/**
 * Compares BMS reported health against AI estimation using configurable thresholds.
 */
export function compareBmsWithAi(
  bmsSoh: number | undefined,
  aiSoh: number,
  settings: Pick<SystemSettings, 'bmsConsistencyThreshold' | 'bmsReviewThreshold'>
): {
  difference?: number;
  differencePercent?: number;
  result: BmsComparisonResult;
} {
  if (bmsSoh === undefined || bmsSoh === null || isNaN(bmsSoh)) {
    return { result: 'Review required' };
  }

  const diff = Math.round(Math.abs(bmsSoh - aiSoh) * 10) / 10;
  const diffPercent = bmsSoh > 0 ? Math.round((diff / bmsSoh) * 1000) / 10 : 0;

  let result: BmsComparisonResult = 'Consistent';

  if (diff <= settings.bmsConsistencyThreshold) {
    result = 'Consistent';
  } else if (diff <= settings.bmsReviewThreshold) {
    result = 'Minor discrepancy';
  } else if (diff <= settings.bmsReviewThreshold * 1.5) {
    result = 'Review required';
  } else {
    result = 'Significant mismatch';
  }

  return {
    difference: diff,
    differencePercent: diffPercent,
    result
  };
}

/**
 * High-level pulse test health assessment orchestrator.
 */
export async function performPulseAssessment(
  input: PulseTestInput,
  settings: SystemSettings
): Promise<PulseTestResult> {
  const electrical = calculateElectricalIndicators(input);
  const prediction = await runSohPrediction(
    input,
    electrical.internalResistance,
    electrical.deltaV,
    electrical.temperatureRise
  );

  const bmsComp = compareBmsWithAi(input.bmsSoh, prediction.soh, settings);

  const routing = evaluateLifecycleStatus({
    estimatedSoh: prediction.soh,
    confidence: prediction.confidence,
    internalResistance: electrical.internalResistance,
    temperatureRise: electrical.temperatureRise,
    bmsComparison: bmsComp.result,
    warnings: electrical.warnings,
    settings
  });

  return {
    deltaV: electrical.deltaV,
    deltaI: electrical.deltaI,
    internalResistance: electrical.internalResistance,
    temperatureRise: electrical.temperatureRise,
    aiEstimatedSoh: prediction.soh,
    estimatedRul: prediction.rul,
    confidence: prediction.confidence,
    bmsSoh: input.bmsSoh,
    bmsDifference: bmsComp.difference,
    bmsDifferencePercent: bmsComp.differencePercent,
    bmsComparisonResult: bmsComp.result,
    lifecycleStatus: routing.status,
    lifecycleReason: routing.reason,
    warnings: electrical.warnings,
    estimationMethod: prediction.method,
    timestamp: new Date().toISOString()
  };
}
