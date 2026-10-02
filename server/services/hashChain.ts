import crypto from 'crypto';
import { LifecycleEvent, LifecycleEventType, ChainVerificationResult } from '../../src/types/index.js';

export const GENESIS_PREV_HASH = '0'.repeat(64);

/**
 * Creates a deterministic, canonical JSON string by sorting keys recursively.
 */
export function canonicalizeJson(obj: any): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map((item) => canonicalizeJson(item)).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const sortedPairs = keys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(obj[key])}`);
  return '{' + sortedPairs.join(',') + '}';
}

/**
 * Generates SHA-256 hash for a lifecycle event based on canonical representation.
 */
export function calculateEventHash(event: Omit<LifecycleEvent, 'hash' | 'tampered'>): string {
  const canonicalPayload = canonicalizeJson({
    id: event.id,
    batteryId: event.batteryId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    actor: event.actor,
    eventData: event.eventData,
    prevHash: event.prevHash
  });

  return crypto.createHash('sha256').update(canonicalPayload, 'utf8').digest('hex');
}

/**
 * Creates a new hash-linked lifecycle event.
 */
export function createLifecycleEvent(
  batteryId: string,
  eventType: LifecycleEventType,
  actor: string,
  eventData: Record<string, any>,
  prevHash: string = GENESIS_PREV_HASH,
  customTimestamp?: string
): LifecycleEvent {
  const id = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const timestamp = customTimestamp || new Date().toISOString();

  const eventWithoutHash = {
    id,
    batteryId,
    eventType,
    timestamp,
    actor,
    eventData,
    prevHash
  };

  const hash = calculateEventHash(eventWithoutHash);

  return {
    ...eventWithoutHash,
    hash
  };
}


/**
 * Verifies the integrity of a sequence of lifecycle events for a battery.
 * Checks that:
 * 1. Each event's hash matches its canonical content.
 * 2. Each event's prevHash links correctly to the previous event's hash.
 * 3. The first event links to GENESIS_PREV_HASH.
 */
export function verifyEventChain(events: LifecycleEvent[]): ChainVerificationResult {
  if (!events || events.length === 0) {
    return {
      batteryId: 'UNKNOWN',
      isValid: true,
      totalEvents: 0,
      details: 'No lifecycle events recorded for battery.',
      verifiedAt: new Date().toISOString()
    };
  }

  const batteryId = events[0].batteryId;

  for (let i = 0; i < events.length; i++) {
    const current = events[i];

    // Check batteryId consistency
    if (current.batteryId !== batteryId) {
      return {
        batteryId,
        isValid: false,
        totalEvents: events.length,
        tamperedEventIndex: i,
        tamperedEventId: current.id,
        details: `Integrity failure: Event ${current.id} has mismatched batteryId ${current.batteryId}.`,
        verifiedAt: new Date().toISOString()
      };
    }

    // Check previous hash linkage
    if (i === 0) {
      if (current.prevHash !== GENESIS_PREV_HASH) {
        return {
          batteryId,
          isValid: false,
          totalEvents: events.length,
          tamperedEventIndex: 0,
          tamperedEventId: current.id,
          details: `Genesis event ${current.id} does not link to standard genesis hash.`,
          verifiedAt: new Date().toISOString()
        };
      }
    } else {
      const previous = events[i - 1];
      if (current.prevHash !== previous.hash) {
        return {
          batteryId,
          isValid: false,
          totalEvents: events.length,
          tamperedEventIndex: i,
          tamperedEventId: current.id,
          details: `Broken hash link at event index ${i} (${current.id}): prevHash does not match previous block's hash.`,
          verifiedAt: new Date().toISOString()
        };
      }
    }

    // Check self-hash calculation
    const expectedHash = calculateEventHash({
      id: current.id,
      batteryId: current.batteryId,
      eventType: current.eventType,
      timestamp: current.timestamp,
      actor: current.actor,
      eventData: current.eventData,
      prevHash: current.prevHash
    });

    if (current.hash !== expectedHash) {
      return {
        batteryId,
        isValid: false,
        totalEvents: events.length,
        tamperedEventIndex: i,
        tamperedEventId: current.id,
        details: `Tamper detected: Calculated hash (${expectedHash.substring(0, 12)}...) differs from recorded hash (${current.hash.substring(0, 12)}...).`,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  return {
    batteryId,
    isValid: true,
    totalEvents: events.length,
    details: `All ${events.length} block(s) cryptographically verified. Hash chain is intact and tamper-evident.`,
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Creates a safe simulated tampered copy of a chain for testing and UI demonstration.
 * Does NOT mutate the original records.
 */
export function createTamperedDemoChain(events: LifecycleEvent[], eventIndexToTamper: number = 0): LifecycleEvent[] {
  const clone: LifecycleEvent[] = JSON.parse(JSON.stringify(events));
  if (clone.length === 0) return clone;

  const targetIndex = Math.min(Math.max(0, eventIndexToTamper), clone.length - 1);
  const target = clone[targetIndex];

  // Tamper with data without recomputing hash to trigger verification failure
  target.eventData = {
    ...target.eventData,
    tamperedPayload: 'UNAUTHORIZED_ALTERATION_ATTEMPT',
    odometerOrCycles: (target.eventData?.odometerOrCycles || 1000) + 50000,
    tamperedNote: 'Simulated illegitimate milestone alteration'
  };
  target.tampered = true;

  return clone;
}
