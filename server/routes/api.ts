import { Router, Request, Response } from 'express';
import { storage } from '../storage/index.js';
import { performPulseAssessment } from '../services/aiEstimator.js';
import { verifyEventChain, createLifecycleEvent, createTamperedDemoChain } from '../services/hashChain.js';
import { esp32Provider } from '../services/esp32Telemetry.js';
import { Battery, PulseTestInput, TelemetryReading, ImportSummary } from '../../src/types/index.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', async (_req: Request, res: Response) => {
  const settings = await storage.getSettings();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VidyutPraman - Battery Aadhaar API',
    storageMode: settings.storageMode,
    isPostgresConnected: storage.isPostgreSqlConnected(),
    esp32HardwareStatus: esp32Provider.getConnectionStatus().hasPhysicalHardware ? 'connected' : 'simulated-ready'
  });
});

// Dashboard summary
apiRouter.get('/dashboard/summary', async (_req: Request, res: Response) => {
  try {
    const batteries = await storage.getAllBatteries();
    const settings = await storage.getSettings();

    const evReadyCount = batteries.filter((b) => b.lifecycleStatus === 'EV_READY').length;
    const secondLifeCount = batteries.filter((b) => b.lifecycleStatus === 'SECOND_LIFE_READY').length;
    const recyclingCount = batteries.filter((b) => b.lifecycleStatus === 'RECYCLING_REQUIRED').length;
    const reEvaluationCount = batteries.filter((b) => b.lifecycleStatus === 'RE_EVALUATION_REQUIRED').length;

    const totalSoh = batteries.reduce((sum, b) => sum + (b.aiEstimatedSoh || 0), 0);
    const avgSoh = batteries.length > 0 ? Math.round((totalSoh / batteries.length) * 10) / 10 : 0;

    // Fetch all events for recent feed
    const allEvents = [];
    for (const b of batteries.slice(0, 8)) {
      const events = await storage.getEvents(b.id);
      allEvents.push(...events);
    }
    allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Health distribution brackets: [90-100%, 80-89%, 70-79%, 60-69%, <60%]
    const distribution = [
      { range: '90-100%', count: batteries.filter(b => b.aiEstimatedSoh >= 90).length, label: 'Prime EV' },
      { range: '80-89%', count: batteries.filter(b => b.aiEstimatedSoh >= 80 && b.aiEstimatedSoh < 90).length, label: 'Standard EV' },
      { range: '70-79%', count: batteries.filter(b => b.aiEstimatedSoh >= 70 && b.aiEstimatedSoh < 80).length, label: 'Second-Life Tier 1' },
      { range: '65-69%', count: batteries.filter(b => b.aiEstimatedSoh >= 65 && b.aiEstimatedSoh < 70).length, label: 'Second-Life Tier 2' },
      { range: '<65%', count: batteries.filter(b => b.aiEstimatedSoh < 65).length, label: 'Recycling' },
    ];

    res.json({
      totalBatteries: batteries.length,
      evReadyBatteries: evReadyCount,
      secondLifeBatteries: secondLifeCount,
      recyclingRequiredBatteries: recyclingCount,
      reEvaluationRequiredBatteries: reEvaluationCount,
      averageEstimatedSoh: avgSoh,
      distribution,
      recentEvents: allEvents.slice(0, 10),
      recentAssessments: batteries
        .sort((a, b) => new Date(b.lastAssessmentDate).getTime() - new Date(a.lastAssessmentDate).getTime())
        .slice(0, 5),
      settings: {
        storageMode: settings.storageMode,
        databaseUrlConfigured: settings.databaseUrlConfigured
      },
      disclaimer: 'Illustrative fleet statistics for prototype evaluation. Not certified fleet data.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to aggregate dashboard summary', details: err.message });
  }
});

// Battery Registry - GET all
apiRouter.get('/batteries', async (req: Request, res: Response) => {
  try {
    let batteries = await storage.getAllBatteries();
    const { status, chemistry, search } = req.query;

    if (status && typeof status === 'string' && status !== 'ALL') {
      batteries = batteries.filter((b) => b.lifecycleStatus === status);
    }
    if (chemistry && typeof chemistry === 'string' && chemistry !== 'ALL') {
      batteries = batteries.filter((b) => b.chemistry === chemistry);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      batteries = batteries.filter(
        (b) =>
          b.id.toLowerCase().includes(q) ||
          b.manufacturer.toLowerCase().includes(q) ||
          b.model.toLowerCase().includes(q) ||
          b.currentOwner.toLowerCase().includes(q) ||
          b.passportId.toLowerCase().includes(q)
      );
    }

    res.json(batteries);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch battery registry', details: err.message });
  }
});

// Battery Registry - GET by ID
apiRouter.get('/batteries/:id', async (req: Request, res: Response) => {
  try {
    const battery = await storage.getBatteryById(req.params.id);
    if (!battery) {
      return res.status(404).json({ error: `Battery ${req.params.id} not found.` });
    }
    const events = await storage.getEvents(battery.id);
    const verification = verifyEventChain(events);

    res.json({ battery, events, verification });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch battery details', details: err.message });
  }
});

// Battery Registry - POST Create
apiRouter.post('/batteries', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body.id || !body.manufacturer || !body.model || !body.chemistry) {
      return res.status(400).json({ error: 'Missing required battery fields (id, manufacturer, model, chemistry).' });
    }

    // Format check on battery ID
    const cleanId = String(body.id).trim().toUpperCase();
    const existing = await storage.getBatteryById(cleanId);
    if (existing) {
      return res.status(409).json({ error: `Battery with ID ${cleanId} already exists.` });
    }

    const ratedCapacity = Number(body.ratedCapacity) || 40.0;
    const currentCapacity = Number(body.currentCapacity) || ratedCapacity;
    const bmsSoh = Number(body.bmsSoh) || 100.0;
    const nominalVoltage = Number(body.nominalVoltage) || 400.0;

    const newBattery: Battery = {
      id: cleanId,
      passportId: `VP-AADHAAR-${cleanId}-${Date.now().toString(36).toUpperCase()}`,
      manufacturer: String(body.manufacturer).trim(),
      model: String(body.model).trim(),
      chemistry: body.chemistry,
      nominalVoltage,
      ratedCapacity,
      currentCapacity,
      cycleCount: Number(body.cycleCount) || 0,
      manufacturingDate: body.manufacturingDate || new Date().toISOString().split('T')[0],
      currentOwner: String(body.currentOwner || 'OEM Initial Inventory').trim(),
      previousOwners: body.previousOwner ? [body.previousOwner] : [],
      bmsSoh,
      bmsVoltage: Number(body.bmsVoltage) || nominalVoltage,
      bmsCurrent: Number(body.bmsCurrent) || 0,
      bmsTemperature: Number(body.bmsTemperature) || 28.0,
      aiEstimatedSoh: bmsSoh, // initial baseline
      estimatedRul: Math.max(0, Math.round((bmsSoh - 70) * 45)),
      confidence: 85,
      voltageSag: 12.0,
      internalResistance: 0.22,
      temperatureRise: 4.0,
      lifecycleStatus: bmsSoh >= 80 ? 'EV_READY' : bmsSoh >= 65 ? 'SECOND_LIFE_READY' : 'RECYCLING_REQUIRED',
      lifecycleReason: 'Newly registered battery pack. Baseline initialized.',
      verificationStatus: 'VERIFIED',
      lastAssessmentDate: new Date().toISOString(),
      notes: body.notes || '',
      isDemo: Boolean(body.isDemo),
      dataSource: body.dataSource || 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await storage.createBattery(newBattery);
    res.status(201).json({ battery: saved, message: 'Battery successfully registered.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create battery', details: err.message });
  }
});

// Battery Registry - PUT update
apiRouter.put('/batteries/:id', async (req: Request, res: Response) => {
  try {
    const existing = await storage.getBatteryById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: `Battery ${req.params.id} not found.` });
    }

    const updated = await storage.updateBattery(req.params.id, req.body);
    res.json({ battery: updated, message: 'Battery updated successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update battery', details: err.message });
  }
});

// Battery Registry - DELETE
apiRouter.delete('/batteries/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await storage.deleteBattery(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: `Battery ${req.params.id} not found.` });
    }
    res.json({ success: true, message: `Battery ${req.params.id} removed from registry.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete battery', details: err.message });
  }
});

// Health Assessment - POST /api/batteries/:id/assess
apiRouter.post('/batteries/:id/assess', async (req: Request, res: Response) => {
  try {
    const battery = await storage.getBatteryById(req.params.id);
    if (!battery) {
      return res.status(404).json({ error: `Battery ${req.params.id} not found.` });
    }

    const settings = await storage.getSettings();
    const body: PulseTestInput = req.body;

    const input: PulseTestInput = {
      initialVoltage: Number(body.initialVoltage) || battery.nominalVoltage,
      loadedVoltage: Number(body.loadedVoltage) || battery.nominalVoltage - 14.0,
      initialCurrent: Number(body.initialCurrent) || 0.0,
      loadedCurrent: Number(body.loadedCurrent) || 50.0,
      initialTemperature: Number(body.initialTemperature) || 28.0,
      finalTemperature: Number(body.finalTemperature) || 34.0,
      cycleCount: Number(body.cycleCount) || battery.cycleCount,
      chemistry: body.chemistry || battery.chemistry,
      ratedCapacity: Number(body.ratedCapacity) || battery.ratedCapacity,
      currentCapacity: Number(body.currentCapacity) || battery.currentCapacity,
      bmsSoh: body.bmsSoh !== undefined ? Number(body.bmsSoh) : battery.bmsSoh
    };

    const assessmentResult = await performPulseAssessment(input, settings);

    // Update battery record
    const updatedBattery = await storage.updateBattery(battery.id, {
      aiEstimatedSoh: assessmentResult.aiEstimatedSoh,
      estimatedRul: assessmentResult.estimatedRul,
      confidence: assessmentResult.confidence,
      voltageSag: assessmentResult.deltaV,
      internalResistance: assessmentResult.internalResistance,
      temperatureRise: assessmentResult.temperatureRise,
      lifecycleStatus: assessmentResult.lifecycleStatus,
      lifecycleReason: assessmentResult.lifecycleReason,
      bmsSoh: input.bmsSoh ?? battery.bmsSoh,
      verificationStatus: assessmentResult.bmsComparisonResult === 'Significant mismatch' ? 'MISMATCH_DETECTED' : 'VERIFIED',
      lastAssessmentDate: assessmentResult.timestamp
    });

    // Create hash-linked event
    const events = await storage.getEvents(battery.id);
    const lastEvent = events[events.length - 1];
    const prevHash = lastEvent ? lastEvent.hash : undefined;

    const newEvent = createLifecycleEvent(
      battery.id,
      'PULSE_HEALTH_TEST',
      'VidyutPraman Pulse Assessment Unit',
      {
        deltaV: assessmentResult.deltaV,
        deltaI: assessmentResult.deltaI,
        internalResistance: assessmentResult.internalResistance,
        temperatureRise: assessmentResult.temperatureRise,
        aiEstimatedSoh: assessmentResult.aiEstimatedSoh,
        bmsSoh: input.bmsSoh,
        bmsDifference: assessmentResult.bmsDifference,
        lifecycleStatus: assessmentResult.lifecycleStatus,
        estimationMethod: assessmentResult.estimationMethod
      },
      prevHash
    );

    await storage.addEvent(newEvent);

    res.json({
      assessment: assessmentResult,
      battery: updatedBattery,
      event: newEvent
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Assessment execution failed', details: err.message });
  }
});

// Alias: POST /api/assessment/pulse
apiRouter.post('/assessment/pulse', async (req: Request, res: Response) => {
  try {
    const { batteryId, input } = req.body;
    const targetId = batteryId || (await storage.getAllBatteries())[0]?.id || 'BAT-2026-001';
    const battery = await storage.getBatteryById(targetId);
    if (!battery) {
      return res.status(404).json({ error: `Battery ${targetId} not found.` });
    }

    const settings = await storage.getSettings();
    const testInput: PulseTestInput = {
      initialVoltage: Number(input?.initialVoltage) || battery.nominalVoltage,
      loadedVoltage: Number(input?.loadedVoltage) || battery.nominalVoltage - 14.0,
      initialCurrent: Number(input?.initialCurrent) || 0.0,
      loadedCurrent: Number(input?.loadedCurrent) || 50.0,
      initialTemperature: Number(input?.initialTemperature) || 28.0,
      finalTemperature: Number(input?.finalTemperature) || 34.0,
      cycleCount: Number(input?.cycleCount) || battery.cycleCount,
      chemistry: input?.chemistry || battery.chemistry,
      ratedCapacity: Number(input?.ratedCapacity) || battery.ratedCapacity,
      currentCapacity: Number(input?.currentCapacity) || battery.currentCapacity,
      bmsSoh: input?.bmsSoh !== undefined ? Number(input.bmsSoh) : battery.bmsSoh
    };

    const assessmentResult = await performPulseAssessment(testInput, settings);

    // Update battery record
    await storage.updateBattery(targetId, {
      aiEstimatedSoh: assessmentResult.aiEstimatedSoh,
      estimatedRul: assessmentResult.estimatedRul,
      confidence: assessmentResult.confidence,
      voltageSag: assessmentResult.deltaV,
      internalResistance: assessmentResult.internalResistance,
      temperatureRise: assessmentResult.temperatureRise,
      lifecycleStatus: assessmentResult.lifecycleStatus,
      lifecycleReason: assessmentResult.lifecycleReason,
      bmsSoh: testInput.bmsSoh ?? battery.bmsSoh,
      verificationStatus: assessmentResult.bmsComparisonResult === 'Significant mismatch' ? 'MISMATCH_DETECTED' : 'VERIFIED',
      lastAssessmentDate: assessmentResult.timestamp
    });

    res.json(assessmentResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Assessment execution failed', details: err.message });
  }
});

// Event aliases: /api/events/:batteryId
apiRouter.get('/events/:batteryId', async (req: Request, res: Response) => {
  try {
    const events = await storage.getEvents(req.params.batteryId);
    const verification = verifyEventChain(events);
    res.json({ events, verification, count: events.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve events', details: err.message });
  }
});

apiRouter.post('/events', async (req: Request, res: Response) => {
  try {
    const { batteryId, eventType, actor, payload } = req.body;
    if (!batteryId || !eventType) {
      return res.status(400).json({ error: 'batteryId and eventType are required.' });
    }
    const events = await storage.getEvents(batteryId);
    const lastEvent = events[events.length - 1];
    const prevHash = lastEvent ? lastEvent.hash : undefined;

    const newEvent = createLifecycleEvent(
      batteryId,
      eventType,
      actor || 'System Operator',
      payload || {},
      prevHash
    );

    await storage.addEvent(newEvent);

    if (eventType === 'OWNERSHIP_TRANSFER' && payload?.newOwner) {
      const battery = await storage.getBatteryById(batteryId);
      if (battery) {
        await storage.updateBattery(batteryId, {
          currentOwner: payload.newOwner,
          previousOwners: [...(battery.previousOwners || []), battery.currentOwner]
        });
      }
    }

    res.json({ success: true, event: newEvent });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to record event', details: err.message });
  }
});

apiRouter.post('/events/:batteryId/verify', async (req: Request, res: Response) => {
  try {
    const events = await storage.getEvents(req.params.batteryId);
    const verification = verifyEventChain(events);
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

apiRouter.post('/events/:batteryId/tamper-demo', async (req: Request, res: Response) => {
  try {
    const events = await storage.getEvents(req.params.batteryId);
    if (events.length === 0) {
      return res.status(400).json({ error: 'No events to tamper' });
    }
    const tamperedChain = createTamperedDemoChain(events, Math.min(1, events.length - 1));
    const verification = verifyEventChain(tamperedChain);
    res.json({ events: tamperedChain, verification });
  } catch (err: any) {
    res.status(500).json({ error: 'Tamper demo failed', details: err.message });
  }
});


// SHA-256 Event Chain - GET /api/batteries/:id/events
apiRouter.get('/batteries/:id/events', async (req: Request, res: Response) => {
  try {
    const events = await storage.getEvents(req.params.id);
    res.json({ events, count: events.length });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve event chain', details: err.message });
  }
});

// SHA-256 Event Chain - POST add event
apiRouter.post('/batteries/:id/events', async (req: Request, res: Response) => {
  try {
    const battery = await storage.getBatteryById(req.params.id);
    if (!battery) {
      return res.status(404).json({ error: `Battery ${req.params.id} not found.` });
    }

    const { eventType, actor, eventData } = req.body;
    if (!eventType || !actor) {
      return res.status(400).json({ error: 'eventType and actor are required.' });
    }

    const events = await storage.getEvents(battery.id);
    const lastEvent = events[events.length - 1];
    const prevHash = lastEvent ? lastEvent.hash : undefined;

    const newEvent = createLifecycleEvent(
      battery.id,
      eventType,
      actor,
      eventData || {},
      prevHash
    );

    await storage.addEvent(newEvent);

    // If ownership transfer event, update battery current owner
    if (eventType === 'OWNERSHIP_TRANSFER' && eventData?.newOwner) {
      await storage.updateBattery(battery.id, {
        currentOwner: eventData.newOwner,
        previousOwners: [...(battery.previousOwners || []), battery.currentOwner]
      });
    }

    res.status(201).json({ event: newEvent, message: 'Lifecycle event chained successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to chain lifecycle event', details: err.message });
  }
});

// Verification - GET /api/batteries/:id/verify
apiRouter.get('/batteries/:id/verify', async (req: Request, res: Response) => {
  try {
    const events = await storage.getEvents(req.params.id);
    const verification = verifyEventChain(events);
    res.json(verification);
  } catch (err: any) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// Tamper-test demo - POST /api/batteries/:id/tamper-test
apiRouter.post('/batteries/:id/tamper-test', async (req: Request, res: Response) => {
  try {
    const events = await storage.getEvents(req.params.id);
    if (events.length === 0) {
      return res.status(400).json({ error: 'No events found for battery to tamper test.' });
    }

    // Creates an isolated tampered clone - original records in storage remain safe and intact
    const tamperedChain = createTamperedDemoChain(events, req.body.eventIndex ?? 1);
    const verification = verifyEventChain(tamperedChain);

    res.json({
      tamperTest: true,
      originalChainValid: verifyEventChain(events).isValid,
      simulatedChainVerification: verification,
      tamperedChainPreview: tamperedChain,
      safetyNotice: 'Original production records were NOT altered. This test proves that any illicit bit change breaks the SHA-256 chain.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Tamper test failed', details: err.message });
  }
});

// Telemetry Import - POST /api/batteries/:id/import
apiRouter.post('/batteries/:id/import', async (req: Request, res: Response) => {
  try {
    const battery = await storage.getBatteryById(req.params.id);
    if (!battery) {
      return res.status(404).json({ error: `Battery ${req.params.id} not found.` });
    }

    const { rawContent, format } = req.body;
    if (!rawContent) {
      return res.status(400).json({ error: 'rawContent (CSV or JSON string) is required.' });
    }

    const summary: ImportSummary = {
      totalRows: 0,
      validRows: 0,
      rejectedRows: 0,
      errors: [],
      previewData: []
    };

    const seenTimestamps = new Set<string>();

    if (format === 'json') {
      try {
        const parsed = JSON.parse(rawContent);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        summary.totalRows = rows.length;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 1;

          if (!row.timestamp) {
            summary.errors.push({ row: rowNum, field: 'timestamp', message: 'Missing timestamp field' });
            summary.rejectedRows++;
            continue;
          }

          if (seenTimestamps.has(row.timestamp)) {
            summary.errors.push({ row: rowNum, field: 'timestamp', message: 'Duplicate timestamp detected', value: row.timestamp });
            summary.rejectedRows++;
            continue;
          }
          seenTimestamps.add(row.timestamp);

          const voltage = Number(row.voltage);
          const current = Number(row.current);
          const temp = Number(row.temperature);

          if (isNaN(voltage) || voltage <= 0 || voltage > 1000) {
            summary.errors.push({ row: rowNum, field: 'voltage', message: 'Invalid voltage value (must be 0-1000V)', value: row.voltage });
            summary.rejectedRows++;
            continue;
          }

          if (isNaN(current) || isNaN(temp)) {
            summary.errors.push({ row: rowNum, field: 'telemetry', message: 'Invalid current or temperature numerical value' });
            summary.rejectedRows++;
            continue;
          }

          summary.validRows++;
          summary.previewData.push({
            batteryId: battery.id,
            timestamp: row.timestamp,
            voltage,
            current,
            temperature: temp,
            cycleCount: row.cycleCount ? Number(row.cycleCount) : undefined,
            bmsSoh: row.bmsSoh ? Number(row.bmsSoh) : undefined,
            source: 'imported'
          });
        }
      } catch (e: any) {
        return res.status(400).json({ error: 'Invalid JSON payload format', details: e.message });
      }
    } else {
      // CSV format
      const lines = rawContent.split(/\r?\n/).filter((l: string) => l.trim().length > 0);
      if (lines.length < 2) {
        return res.status(400).json({ error: 'CSV file must have a header row and at least one data row.' });
      }

      const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
      summary.totalRows = lines.length - 1;

      for (let i = 1; i < lines.length; i++) {
        const rowNum = i;
        const cols = lines[i].split(',').map((c: string) => c.trim());
        const rowObj: any = {};
        headers.forEach((h: string, idx: number) => {
          rowObj[h] = cols[idx];
        });

        const ts = rowObj.timestamp;
        if (!ts) {
          summary.errors.push({ row: rowNum, field: 'timestamp', message: 'Missing timestamp' });
          summary.rejectedRows++;
          continue;
        }

        if (seenTimestamps.has(ts)) {
          summary.errors.push({ row: rowNum, field: 'timestamp', message: 'Duplicate timestamp found', value: ts });
          summary.rejectedRows++;
          continue;
        }
        seenTimestamps.add(ts);

        const voltage = parseFloat(rowObj.voltage);
        const current = parseFloat(rowObj.current);
        const temperature = parseFloat(rowObj.temperature);

        if (isNaN(voltage) || voltage <= 0 || voltage > 1000) {
          summary.errors.push({ row: rowNum, field: 'voltage', message: 'Voltage out of range (0-1000V)', value: rowObj.voltage });
          summary.rejectedRows++;
          continue;
        }

        if (isNaN(current) || isNaN(temperature)) {
          summary.errors.push({ row: rowNum, field: 'measurements', message: 'Current or temperature is not a valid number' });
          summary.rejectedRows++;
          continue;
        }

        summary.validRows++;
        summary.previewData.push({
          batteryId: battery.id,
          timestamp: ts,
          voltage,
          current,
          temperature,
          cycleCount: rowObj.cyclecount ? parseInt(rowObj.cyclecount) : undefined,
          bmsSoh: rowObj.bmssoh ? parseFloat(rowObj.bmssoh) : undefined,
          source: 'imported'
        });
      }
    }

    // If commit flag is set and valid rows exist, update battery telemetry
    if (req.body.commit && summary.validRows > 0) {
      const latest = summary.previewData[summary.previewData.length - 1];
      await storage.updateBattery(battery.id, {
        bmsVoltage: latest.voltage,
        bmsCurrent: latest.current,
        bmsTemperature: latest.temperature,
        bmsSoh: latest.bmsSoh ?? battery.bmsSoh,
        cycleCount: latest.cycleCount ?? battery.cycleCount,
        dataSource: 'imported'
      });
    }

    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
});

// Settings - GET & PUT
apiRouter.get('/settings', async (_req: Request, res: Response) => {
  const settings = await storage.getSettings();
  res.json(settings);
});

apiRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const updated = await storage.updateSettings(req.body);
    res.json({ settings: updated, message: 'Settings saved successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
});

// ESP32 Telemetry Provider Endpoints
apiRouter.get('/telemetry/esp32/status', (_req: Request, res: Response) => {
  res.json(esp32Provider.getConnectionStatus());
});

apiRouter.get('/telemetry/esp32/stream/:batteryId', async (req: Request, res: Response) => {
  try {
    const reading = await esp32Provider.getBatteryTelemetry(req.params.batteryId);
    res.json(reading);
  } catch (err: any) {
    res.status(500).json({ error: 'Telemetry stream failed', details: err.message });
  }
});

apiRouter.post('/telemetry/esp32/pulse-test/:batteryId', async (req: Request, res: Response) => {
  try {
    const testInput = await esp32Provider.startPulseTest(req.params.batteryId, req.body.duration || 10);
    res.json({
      status: 'pulse_completed',
      pulseData: testInput,
      message: 'Simulated 10-second controlled pulse test executed successfully via ESP32 interface.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'ESP32 pulse test failed', details: err.message });
  }
});
