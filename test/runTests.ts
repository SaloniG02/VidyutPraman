import {
  calculateElectricalIndicators,
  estimateBatteryHealthFallback,
  compareBmsWithAi
} from '../server/services/aiEstimator.js';
import {
  createLifecycleEvent,
  verifyEventChain,
  createTamperedDemoChain,
  GENESIS_PREV_HASH,
  canonicalizeJson,
  calculateEventHash
} from '../server/services/hashChain.js';
import { evaluateLifecycleStatus } from '../server/services/lifecycleEngine.js';
import { DEFAULT_SETTINGS } from '../server/storage/index.js';
import { PulseTestInput } from '../src/types/index.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n=============================================================');
  console.log('🧪 VidyutPraman — Battery Aadhaar Verification Test Suite');
  console.log('=============================================================\n');

  // 1. Electrical Calculations & ΔV, ΔI, Rint, ΔT
  console.log('1. Testing Electrical Calculations');
  const normalInput: PulseTestInput = {
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
  };

  const normalCalc = calculateElectricalIndicators(normalInput);
  assert(Math.abs(normalCalc.deltaV - 14.3) < 0.01, 'Voltage Sag calculation (ΔV = 14.3V)');
  assert(Math.abs(normalCalc.deltaI - 50.0) < 0.01, 'Current Step calculation (ΔI = 50.0A)');
  assert(Math.abs(normalCalc.internalResistance - 0.286) < 0.005, 'Internal Resistance calculation (Rint = 0.286 Ω)');
  assert(Math.abs(normalCalc.temperatureRise - 6.0) < 0.01, 'Temperature rise calculation (ΔT = 6.0°C)');

  // 2. Division-by-Zero Protection
  console.log('\n2. Testing Division-by-Zero & Invalid Reading Handling');
  const zeroCurrentInput: PulseTestInput = {
    ...normalInput,
    initialCurrent: 10.0,
    loadedCurrent: 10.0 // deltaI = 0!
  };
  const zeroCalc = calculateElectricalIndicators(zeroCurrentInput);
  assert(zeroCalc.warnings.length > 0, 'Safe detection of ΔI ≈ 0 current step');
  assert(!isNaN(zeroCalc.internalResistance) && isFinite(zeroCalc.internalResistance), 'Rint remains finite and non-NaN when ΔI=0');

  // 3. SOH Estimation Fallback
  console.log('\n3. Testing SOH Fallback Estimator');
  const fallbackRes = estimateBatteryHealthFallback(normalInput, normalCalc.internalResistance, normalCalc.deltaV, normalCalc.temperatureRise);
  assert(fallbackRes.soh >= 75 && fallbackRes.soh <= 90, `Fallback SOH in expected range for 850 cycles (got ${fallbackRes.soh}%)`);
  assert(fallbackRes.rul > 0, `Fallback RUL is positive cycles (got ${fallbackRes.rul} cycles)`);
  assert(fallbackRes.confidence >= 50 && fallbackRes.confidence <= 100, `Confidence is bounded (got ${fallbackRes.confidence}%)`);

  // 4. BMS vs AI Comparison
  console.log('\n4. Testing BMS-vs-AI Verification Thresholds');
  const consistent = compareBmsWithAi(85.0, 83.0, DEFAULT_SETTINGS);
  assert(consistent.result === 'Consistent', 'Small difference (2%) flagged as Consistent');

  const minor = compareBmsWithAi(85.0, 75.0, DEFAULT_SETTINGS);
  assert(minor.result === 'Minor discrepancy', '10% difference flagged as Minor discrepancy');

  const mismatch = compareBmsWithAi(85.0, 60.0, DEFAULT_SETTINGS);
  assert(mismatch.result === 'Significant mismatch', '25% difference flagged as Significant mismatch');

  // 5. SHA-256 Hashing & Canonicalization
  console.log('\n5. Testing Cryptographic Canonical JSON Hashing');
  const objA = { z: 1, a: 'test', m: { b: 2, a: 1 } };
  const objB = { a: 'test', m: { a: 1, b: 2 }, z: 1 };
  assert(canonicalizeJson(objA) === canonicalizeJson(objB), 'Canonical JSON produces identical string regardless of key ordering');

  // 6. SHA-256 Lifecycle Event Creation & Chain Verification
  console.log('\n6. Testing Lifecycle Event Creation and Chain Verification');
  const e1 = createLifecycleEvent('BAT-TEST-001', 'MANUFACTURED', 'OEM Plant', { ratedKwh: 40 }, GENESIS_PREV_HASH);
  assert(e1.prevHash === GENESIS_PREV_HASH, 'Genesis event links to genesis zero-hash');
  assert(e1.hash.length === 64, 'Event hash is valid 64-char hex SHA-256');

  const e2 = createLifecycleEvent('BAT-TEST-001', 'FIRST_OWNER_SALE', 'Dealer A', { buyer: 'Fleet X' }, e1.hash);
  assert(e2.prevHash === e1.hash, 'Block 2 links cryptographically to Block 1 hash');

  const e3 = createLifecycleEvent('BAT-TEST-001', 'PULSE_HEALTH_TEST', 'Testing Lab', { soh: 84 }, e2.hash);
  assert(e3.prevHash === e2.hash, 'Block 3 links cryptographically to Block 2 hash');

  const chainResult = verifyEventChain([e1, e2, e3]);
  assert(chainResult.isValid === true, 'Untampered 3-block chain successfully verifies as VALID');

  // 7. Tamper Detection
  console.log('\n7. Testing Tamper Detection');
  const tamperedChain = createTamperedDemoChain([e1, e2, e3], 1);
  const tamperedResult = verifyEventChain(tamperedChain);
  assert(tamperedResult.isValid === false, 'Tampered block in chain successfully triggers INVALID status');
  assert(tamperedResult.tamperedEventIndex === 1, 'Verification pinpointed exact tampered block index');

  // 8. Lifecycle Circular Economy Routing
  console.log('\n8. Testing Lifecycle Circular Economy Routing Logic');
  const evRouting = evaluateLifecycleStatus({
    estimatedSoh: 85.0,
    confidence: 88,
    internalResistance: 0.22,
    temperatureRise: 5.0,
    bmsComparison: 'Consistent',
    settings: DEFAULT_SETTINGS
  });
  assert(evRouting.status === 'EV_READY', '85% SOH routes to EV_READY');

  const secondLifeRouting = evaluateLifecycleStatus({
    estimatedSoh: 72.0,
    confidence: 85,
    internalResistance: 0.32,
    temperatureRise: 6.5,
    bmsComparison: 'Consistent',
    settings: DEFAULT_SETTINGS
  });
  assert(secondLifeRouting.status === 'SECOND_LIFE_READY', '72% SOH routes to SECOND_LIFE_READY');

  const recyclingRouting = evaluateLifecycleStatus({
    estimatedSoh: 55.0,
    confidence: 80,
    internalResistance: 0.58,
    temperatureRise: 14.0,
    bmsComparison: 'Consistent',
    settings: DEFAULT_SETTINGS
  });
  assert(recyclingRouting.status === 'RECYCLING_REQUIRED', '55% SOH routes to RECYCLING_REQUIRED');

  const reviewRouting = evaluateLifecycleStatus({
    estimatedSoh: 68.0,
    confidence: 50, // Low confidence
    internalResistance: 0.30,
    temperatureRise: 5.0,
    bmsComparison: 'Significant mismatch',
    settings: DEFAULT_SETTINGS
  });
  assert(reviewRouting.status === 'RE_EVALUATION_REQUIRED', 'Low confidence or major mismatch routes to RE_EVALUATION_REQUIRED');

  console.log('\n-------------------------------------------------------------');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
