import fs from 'fs';
import path from 'path';
import { Battery, LifecycleEvent, SystemSettings } from '../../src/types/index.js';
import { createLifecycleEvent, GENESIS_PREV_HASH } from '../services/hashChain.js';

export interface StorageBackend {
  getMode(): 'postgresql' | 'in-memory-fallback';
  isPostgreSqlConnected(): boolean;
  getAllBatteries(): Promise<Battery[]>;
  getBatteryById(id: string): Promise<Battery | null>;
  createBattery(battery: Battery): Promise<Battery>;
  updateBattery(id: string, updates: Partial<Battery>): Promise<Battery | null>;
  deleteBattery(id: string): Promise<boolean>;
  getEvents(batteryId: string): Promise<LifecycleEvent[]>;
  addEvent(event: LifecycleEvent): Promise<LifecycleEvent>;
  getSettings(): Promise<SystemSettings>;
  updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings>;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  storageMode: 'in-memory-fallback',
  databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
  bmsConsistencyThreshold: 5,
  bmsReviewThreshold: 15,
  evReadyMinSoh: 80,
  secondLifeMinSoh: 65,
  maxInternalResistanceWarning: 0.35,
  esp32SimulatedEnabled: true,
  language: 'en'
};

/**
 * Generates initial demo battery packs representing different lifecycle stages.
 * ALL labelled as synthetic / illustrative demo data as required.
 */
function createInitialDemoData(): { batteries: Battery[]; events: LifecycleEvent[] } {
  const batteries: Battery[] = [
    {
      id: 'BAT-2026-001',
      passportId: 'VP-AADHAAR-2026-001-NEXON-IND',
      manufacturer: 'Tata Motors',
      model: 'Nexon EV Pack',
      chemistry: 'Li-ion (NMC)',
      nominalVoltage: 400,
      ratedCapacity: 40.0,
      currentCapacity: 32.8,
      cycleCount: 850,
      manufacturingDate: '2023-01-15',
      currentOwner: 'Fleet Operator - BluSmart Mobility',
      previousOwners: ['Tata Motors (OEM)', 'Dealer AutoWorld Delhi'],
      bmsSoh: 85.0,
      bmsVoltage: 398.2,
      bmsCurrent: 50.0,
      bmsTemperature: 32.0,
      aiEstimatedSoh: 82.0,
      estimatedRul: 1200,
      confidence: 87,
      voltageSag: 14.3,
      internalResistance: 0.286,
      temperatureRise: 6.0,
      lifecycleStatus: 'EV_READY',
      lifecycleReason: 'Battery is suitable for continued EV use. High SOH (82%) and optimal impedance.',
      verificationStatus: 'VERIFIED',
      lastAssessmentDate: '2026-09-12T10:30:00.000Z',
      notes: 'Standard fleet vehicle under scheduled maintenance. Health verified consistent with BMS telemetry.',
      isDemo: true,
      dataSource: 'simulated',
      createdAt: '2023-01-15T09:00:00.000Z',
      updatedAt: '2026-09-12T10:30:00.000Z'
    },
    {
      id: 'BAT-2025-042',
      passportId: 'VP-AADHAAR-2025-042-XUV-PUN',
      manufacturer: 'Mahindra Electric',
      model: 'XUV400 EL Pack',
      chemistry: 'Li-ion (NMC)',
      nominalVoltage: 380,
      ratedCapacity: 39.4,
      currentCapacity: 28.5,
      cycleCount: 1420,
      manufacturingDate: '2022-06-10',
      currentOwner: 'E-Mobility Logistics Mumbai',
      previousOwners: ['Mahindra EV Division'],
      bmsSoh: 73.0,
      bmsVoltage: 374.0,
      bmsCurrent: 45.0,
      bmsTemperature: 35.0,
      aiEstimatedSoh: 72.5,
      estimatedRul: 450,
      confidence: 89,
      voltageSag: 15.8,
      internalResistance: 0.351,
      temperatureRise: 7.2,
      lifecycleStatus: 'SECOND_LIFE_READY',
      lifecycleReason: 'Moderate SOH (72.5%) suitable for stationary BESS energy storage or solar streetlighting.',
      verificationStatus: 'VERIFIED',
      lastAssessmentDate: '2026-09-10T14:15:00.000Z',
      notes: 'Retired from high-speed commercial taxi service. Recommended for second-life stationary microgrid.',
      isDemo: true,
      dataSource: 'simulated',
      createdAt: '2022-06-10T08:00:00.000Z',
      updatedAt: '2026-09-10T14:15:00.000Z'
    },
    {
      id: 'BAT-2024-019',
      passportId: 'VP-AADHAAR-2024-019-COM-BLR',
      manufacturer: 'Exide Industries',
      model: 'e-Fe LFP Fleet Module',
      chemistry: 'LiFePO4 (LFP)',
      nominalVoltage: 320,
      ratedCapacity: 48.0,
      currentCapacity: 27.8,
      cycleCount: 2950,
      manufacturingDate: '2021-03-20',
      currentOwner: 'Urban Cargo Services Bengaluru',
      previousOwners: ['Bangalore Deliveries LLP', 'Exide Energy'],
      bmsSoh: 59.0,
      bmsVoltage: 312.0,
      bmsCurrent: 40.0,
      bmsTemperature: 39.0,
      aiEstimatedSoh: 58.0,
      estimatedRul: 0,
      confidence: 84,
      voltageSag: 22.4,
      internalResistance: 0.560,
      temperatureRise: 14.8,
      lifecycleStatus: 'RECYCLING_REQUIRED',
      lifecycleReason: 'Critical degradation below 65% SOH with elevated internal impedance (0.560 Ω). Material recovery required.',
      verificationStatus: 'VERIFIED',
      lastAssessmentDate: '2026-09-08T16:45:00.000Z',
      notes: 'End of active life. Flagged for hydrometallurgical lithium/cobalt mineral recovery.',
      isDemo: true,
      dataSource: 'simulated',
      createdAt: '2021-03-20T11:00:00.000Z',
      updatedAt: '2026-09-08T16:45:00.000Z'
    },
    {
      id: 'BAT-2025-118',
      passportId: 'VP-AADHAAR-2025-118-TRI-HYD',
      manufacturer: 'Omega Seiki Mobility',
      model: 'Stream 3W Pack',
      chemistry: 'LiFePO4 (LFP)',
      nominalVoltage: 51.2,
      ratedCapacity: 10.2,
      currentCapacity: 6.8,
      cycleCount: 1680,
      manufacturingDate: '2023-08-05',
      currentOwner: 'Hyderabad Last-Mile Fleet',
      previousOwners: ['OSM Dealership'],
      bmsSoh: 88.0, // Mismatched BMS!
      bmsVoltage: 50.1,
      bmsCurrent: 30.0,
      bmsTemperature: 33.0,
      aiEstimatedSoh: 67.0, // AI found severe degradation
      estimatedRul: 250,
      confidence: 68,
      voltageSag: 4.8,
      internalResistance: 0.160,
      temperatureRise: 8.5,
      lifecycleStatus: 'RE_EVALUATION_REQUIRED',
      lifecycleReason: 'Significant mismatch detected (21% difference between BMS 88% and AI 67%). Sensor drift or cell imbalance.',
      verificationStatus: 'MISMATCH_DETECTED',
      lastAssessmentDate: '2026-09-11T09:10:00.000Z',
      notes: 'BMS algorithm failed to recalibrate full discharge. Laboratory verification required before routing.',
      isDemo: true,
      dataSource: 'simulated',
      createdAt: '2023-08-05T09:30:00.000Z',
      updatedAt: '2026-09-11T09:10:00.000Z'
    },
    {
      id: 'BAT-2026-024',
      passportId: 'VP-AADHAAR-2026-024-ATH-CHE',
      manufacturer: 'Ather Energy',
      model: '450X Gen 3 Pack',
      chemistry: 'Li-ion (NMC)',
      nominalVoltage: 51.1,
      ratedCapacity: 3.7,
      currentCapacity: 3.65,
      cycleCount: 45,
      manufacturingDate: '2024-02-18',
      currentOwner: 'Ather Energy Fleet Test Bed',
      bmsSoh: 98.0,
      bmsVoltage: 51.0,
      bmsCurrent: 20.0,
      bmsTemperature: 29.0,
      aiEstimatedSoh: 97.5,
      estimatedRul: 2400,
      confidence: 94,
      voltageSag: 1.8,
      internalResistance: 0.090,
      temperatureRise: 2.5,
      lifecycleStatus: 'EV_READY',
      lifecycleReason: 'Near-new battery pack operating within prime OEM specifications.',
      verificationStatus: 'VERIFIED',
      lastAssessmentDate: '2026-09-13T08:00:00.000Z',
      notes: 'New production registration. Full initial baseline established.',
      isDemo: true,
      dataSource: 'simulated',
      createdAt: '2024-02-18T10:00:00.000Z',
      updatedAt: '2026-09-13T08:00:00.000Z'
    }
  ];

  // Add 19 more fleet packs to reach the realistic 24 total registered packs as shown in the mockup!
  const manufacturers = ['Tata Motors', 'Mahindra Electric', 'Ola Electric', 'Ather Energy', 'Altigreen', 'Exide'];
  const chemistries: Battery['chemistry'][] = ['Li-ion (NMC)', 'LiFePO4 (LFP)', 'LTO (Lithium Titanate)'];
  
  for (let i = 6; i <= 24; i++) {
    const numStr = i.toString().padStart(3, '0');
    const mfg = manufacturers[i % manufacturers.length];
    const chem = chemistries[i % chemistries.length];
    const cycles = 200 + i * 95;
    const isHealthy = i % 3 !== 0;
    const isSecondLife = i % 4 === 0;
    const isRecycling = i === 15;
    
    const soh = isRecycling ? 61.5 : isSecondLife ? 73.0 : Math.min(96, Math.max(81, 98 - (cycles / 2200) * 20));
    const status = isRecycling ? 'RECYCLING_REQUIRED' : isSecondLife ? 'SECOND_LIFE_READY' : 'EV_READY';

    batteries.push({
      id: `BAT-2026-${numStr}`,
      passportId: `VP-AADHAAR-2026-${numStr}-${mfg.substring(0, 3).toUpperCase()}`,
      manufacturer: mfg,
      model: `${mfg} Commercial Pack v${(i % 3) + 1}`,
      chemistry: chem,
      nominalVoltage: chem.includes('51') ? 51.2 : 380,
      ratedCapacity: 40.0,
      currentCapacity: Math.round((soh / 100) * 40.0 * 10) / 10,
      cycleCount: cycles,
      manufacturingDate: '2023-05-10',
      currentOwner: `Fleet Hub ${String.fromCharCode(65 + (i % 6))} - India`,
      bmsSoh: Math.round(soh + (Math.random() - 0.5) * 3),
      bmsVoltage: 378.0,
      bmsCurrent: 45.0,
      bmsTemperature: 31.0,
      aiEstimatedSoh: Math.round(soh * 10) / 10,
      estimatedRul: Math.max(0, Math.round((soh - 70) * 45)),
      confidence: 86 + (i % 8),
      voltageSag: 14.0 + (i % 4),
      internalResistance: Math.round((0.22 + (i % 6) * 0.03) * 1000) / 1000,
      temperatureRise: 5.5 + (i % 3),
      lifecycleStatus: status,
      lifecycleReason: status === 'EV_READY' ? 'Optimal health for EV fleet operations.' : status === 'SECOND_LIFE_READY' ? 'Suitable for stationary backup power.' : 'Low SOH; mineral recycling recommended.',
      verificationStatus: 'VERIFIED',
      lastAssessmentDate: '2026-09-05T12:00:00.000Z',
      isDemo: true,
      dataSource: 'simulated',
      createdAt: '2023-05-10T10:00:00.000Z',
      updatedAt: '2026-09-05T12:00:00.000Z'
    });
  }

  // Create hash-linked event chains for primary demo batteries
  const events: LifecycleEvent[] = [];

  // Chain for BAT-2026-001 (Matches mock UI timeline!)
  const e1 = createLifecycleEvent(
    'BAT-2026-001',
    'MANUFACTURED',
    'Tata Motors OEM Plant Pune',
    { serialNumber: 'TM-NEXON-CELL-8892', nominalKwh: 40, cellType: 'NMC 21700' },
    GENESIS_PREV_HASH,
    '2023-01-15T09:00:00.000Z'
  );

  const e2 = createLifecycleEvent(
    'BAT-2026-001',
    'FIRST_OWNER_SALE',
    'Dealer AutoWorld Delhi',
    { buyer: 'Fleet Operator - BluSmart Mobility', vehicleVin: 'IND-DL01-EV-4429' },
    e1.hash,
    '2023-01-20T11:30:00.000Z'
  );

  const e3 = createLifecycleEvent(
    'BAT-2026-001',
    'PERIODIC_ASSESSMENT',
    'BluSmart Mobility Tech Center',
    { odometerKm: 42000, cycles: 450, bmsSoh: 91 },
    e2.hash,
    '2024-09-12T14:00:00.000Z'
  );

  const e4 = createLifecycleEvent(
    'BAT-2026-001',
    'OWNERSHIP_TRANSFER',
    'Resale & Fleet Allocation Depot',
    { newDepot: 'South Delhi Hub', transferReason: 'Inter-hub fleet optimization' },
    e3.hash,
    '2025-02-03T16:20:00.000Z'
  );

  const e5 = createLifecycleEvent(
    'BAT-2026-001',
    'PULSE_HEALTH_TEST',
    'VidyutPraman Screening Lab',
    { deltaV: 14.3, internalResistance: 0.286, aiSoh: 82.0, bmsSoh: 85.0, status: 'EV_READY' },
    e4.hash,
    '2026-09-12T10:30:00.000Z'
  );

  events.push(e1, e2, e3, e4, e5);


  // Chains for other key demo batteries
  for (const b of batteries.slice(1)) {
    const genesis = createLifecycleEvent(
      b.id,
      'MANUFACTURED',
      `${b.manufacturer} Manufacturing Div`,
      { model: b.model, chemistry: b.chemistry, ratedCapacity: b.ratedCapacity },
      GENESIS_PREV_HASH
    );
    const pulse = createLifecycleEvent(
      b.id,
      'PULSE_HEALTH_TEST',
      'VidyutPraman Assessment Service',
      { aiSoh: b.aiEstimatedSoh, bmsSoh: b.bmsSoh, lifecycleStatus: b.lifecycleStatus },
      genesis.hash
    );
    events.push(genesis, pulse);
  }

  return { batteries, events };
}

/**
 * Local In-Memory & File-based fallback storage backend.
 * Works seamlessly out of the box with zero external configuration.
 */
class InMemoryStorageBackend implements StorageBackend {
  private batteries: Map<string, Battery> = new Map();
  private events: Map<string, LifecycleEvent[]> = new Map();
  private settings: SystemSettings = { ...DEFAULT_SETTINGS };
  private dataDir: string;
  private storeFile: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.storeFile = path.join(this.dataDir, 'store.json');
    this.initialize();
  }

  public getMode(): 'postgresql' | 'in-memory-fallback' {
    return 'in-memory-fallback';
  }

  public isPostgreSqlConnected(): boolean {
    return false;
  }

  private initialize() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (fs.existsSync(this.storeFile)) {
      try {
        const raw = fs.readFileSync(this.storeFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.batteries) && parsed.batteries.length > 0) {
          for (const b of parsed.batteries) this.batteries.set(b.id, b);
          if (Array.isArray(parsed.events)) {
            for (const e of parsed.events) {
              const list = this.events.get(e.batteryId) || [];
              list.push(e);
              this.events.set(e.batteryId, list);
            }
          }
          if (parsed.settings) this.settings = { ...this.settings, ...parsed.settings };
          return;
        }
      } catch (err) {
        console.warn('Failed to parse local store file, re-initializing with seed data:', err);
      }
    }

    // Seed initial demo data
    const seed = createInitialDemoData();
    for (const b of seed.batteries) this.batteries.set(b.id, b);
    for (const e of seed.events) {
      const list = this.events.get(e.batteryId) || [];
      list.push(e);
      this.events.set(e.batteryId, list);
    }
    this.persist();
  }

  private persist() {
    try {
      const allEvents: LifecycleEvent[] = [];
      for (const list of this.events.values()) {
        allEvents.push(...list);
      }
      const data = {
        batteries: Array.from(this.batteries.values()),
        events: allEvents,
        settings: this.settings,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(this.storeFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting local store:', err);
    }
  }

  public async getAllBatteries(): Promise<Battery[]> {
    return Array.from(this.batteries.values());
  }

  public async getBatteryById(id: string): Promise<Battery | null> {
    return this.batteries.get(id) || null;
  }

  public async createBattery(battery: Battery): Promise<Battery> {
    battery.createdAt = battery.createdAt || new Date().toISOString();
    battery.updatedAt = new Date().toISOString();
    this.batteries.set(battery.id, battery);

    // Automatically create genesis event if not already present
    const existingEvents = this.events.get(battery.id) || [];
    if (existingEvents.length === 0) {
      const genesis = createLifecycleEvent(
        battery.id,
        'MANUFACTURED',
        `${battery.manufacturer} Production Unit`,
        {
          model: battery.model,
          chemistry: battery.chemistry,
          nominalVoltage: battery.nominalVoltage,
          ratedCapacity: battery.ratedCapacity,
          manufacturingDate: battery.manufacturingDate
        },
        GENESIS_PREV_HASH
      );
      this.events.set(battery.id, [genesis]);
    }

    this.persist();
    return battery;
  }

  public async updateBattery(id: string, updates: Partial<Battery>): Promise<Battery | null> {
    const existing = this.batteries.get(id);
    if (!existing) return null;
    const updated: Battery = {
      ...existing,
      ...updates,
      id: existing.id, // prevent id mutation
      updatedAt: new Date().toISOString()
    };
    this.batteries.set(id, updated);
    this.persist();
    return updated;
  }

  public async deleteBattery(id: string): Promise<boolean> {
    const exists = this.batteries.has(id);
    if (exists) {
      this.batteries.delete(id);
      this.events.delete(id);
      this.persist();
      return true;
    }
    return false;
  }

  public async getEvents(batteryId: string): Promise<LifecycleEvent[]> {
    return this.events.get(batteryId) || [];
  }

  public async addEvent(event: LifecycleEvent): Promise<LifecycleEvent> {
    const list = this.events.get(event.batteryId) || [];
    list.push(event);
    this.events.set(event.batteryId, list);
    this.persist();
    return event;
  }

  public async getSettings(): Promise<SystemSettings> {
    return { ...this.settings, storageMode: this.getMode() };
  }

  public async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    this.settings = { ...this.settings, ...updates, storageMode: this.getMode() };
    this.persist();
    return this.settings;
  }
}

// Global storage singleton
export const storage: StorageBackend = new InMemoryStorageBackend();
