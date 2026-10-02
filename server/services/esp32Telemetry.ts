import { TelemetryReading, PulseTestInput } from '../../src/types/index.js';

export interface TelemetryConnectionStatus {
  hasPhysicalHardware: boolean;
  isSimulatedActive: boolean;
  deviceType: string;
  firmwareVersion: string;
  interfaceProtocol: 'UART / Modbus-RTU' | 'WiFi / MQTT' | 'BLE-Mesh' | 'Simulated Emulation';
  lastPingTimestamp: string;
  connectedPinoutConfig: {
    voltageAdcPin: string;
    currentShuntPin: string;
    ntcTempPin1: string;
    ntcTempPin2: string;
    relayPulseGatePin: string;
  };
}

export interface TelemetryProvider {
  getConnectionStatus(): TelemetryConnectionStatus;
  getBatteryTelemetry(batteryId: string): Promise<TelemetryReading>;
  startPulseTest(batteryId: string, durationSeconds?: number): Promise<PulseTestInput>;
  stopPulseTest(batteryId: string): Promise<{ success: boolean; message: string }>;
}

/**
 * ESP32 Hardware Readiness Provider (Simulated Prototype Implementation)
 * Provides realistic telemetry streams and pulse test profiles while clearly
 * indicating that it is a software simulation ready for physical microcontroller flashing.
 */
export class SimulatedEsp32TelemetryProvider implements TelemetryProvider {
  private isPulseActive: boolean = false;
  private lastPing: Date = new Date();

  public getConnectionStatus(): TelemetryConnectionStatus {
    return {
      hasPhysicalHardware: false, // Explicitly false as mandated
      isSimulatedActive: true,
      deviceType: 'ESP32-WROOM-32 (Simulated Development Interface)',
      firmwareVersion: 'v0.9.4-prototype-bridge',
      interfaceProtocol: 'Simulated Emulation',
      lastPingTimestamp: this.lastPing.toISOString(),
      connectedPinoutConfig: {
        voltageAdcPin: 'GPIO36 (ADC1_CH0 - 100:1 Voltage Divider)',
        currentShuntPin: 'GPIO39 (ADC1_CH3 - INA226 I2C Shunt)',
        ntcTempPin1: 'GPIO34 (10k NTC Thermistor Pack)',
        ntcTempPin2: 'GPIO35 (10k NTC Ambient)',
        relayPulseGatePin: 'GPIO25 (Solid-State Load Relay Gate)'
      }
    };
  }

  public async getBatteryTelemetry(batteryId: string): Promise<TelemetryReading> {
    this.lastPing = new Date();
    // Generate realistic fluctuating battery telemetry
    const baseVoltage = 398.5;
    const voltageJitter = (Math.random() - 0.5) * 1.2;
    const currentJitter = Math.random() * 4.5;
    const tempJitter = (Math.random() - 0.5) * 0.8;

    return {
      batteryId,
      timestamp: new Date().toISOString(),
      voltage: Math.round((baseVoltage + voltageJitter) * 10) / 10,
      current: Math.round(currentJitter * 10) / 10,
      temperature: Math.round((28.5 + tempJitter) * 10) / 10,
      cycleCount: 852,
      bmsSoh: 85,
      source: 'simulated'
    };
  }

  public async startPulseTest(batteryId: string, durationSeconds: number = 10): Promise<PulseTestInput> {
    this.lastPing = new Date();
    this.isPulseActive = true;

    // Simulate standard 10-second 50A controlled pulse discharge
    const initialVoltage = 412.5;
    const dropSag = 14.3 + (Math.random() - 0.5) * 1.5;
    const loadedVoltage = Math.round((initialVoltage - dropSag) * 10) / 10;
    const loadedCurrent = Math.round((50.0 + (Math.random() - 0.5) * 2.0) * 10) / 10;
    const initialTemp = 28.0;
    const finalTemp = Math.round((initialTemp + 6.0 + Math.random() * 1.5) * 10) / 10;

    return {
      initialVoltage,
      loadedVoltage,
      initialCurrent: 0.0,
      loadedCurrent,
      initialTemperature: initialTemp,
      finalTemperature: finalTemp,
      cycleCount: 850,
      chemistry: 'Li-ion (NMC)',
      ratedCapacity: 40.0,
      currentCapacity: 32.8,
      bmsSoh: 85.0
    };
  }

  public async stopPulseTest(batteryId: string): Promise<{ success: boolean; message: string }> {
    this.isPulseActive = false;
    this.lastPing = new Date();
    return {
      success: true,
      message: `ESP32 Load relay opened for ${batteryId}. Pulse test finalized safely.`
    };
  }
}

export const esp32Provider = new SimulatedEsp32TelemetryProvider();
