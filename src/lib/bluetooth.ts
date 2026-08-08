/* ═══════════════════════════════════════════════════
   Web Bluetooth Integration for ESP32 GRAIN-01 Probe
   ═══════════════════════════════════════════════════════════════ */

import type { Reading, DeviceInfo, DeviceState, GrainType } from './grain-types';

// ESP32 BLE Service & Characteristic UUIDs (custom – match your firmware)
const GRAIN_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const GRAIN_DATA_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';
const GRAIN_CMD_CHAR_UUID = '0000ffe2-0000-1000-8000-00805f9b34fb';

let device: BluetoothDevice | null = null;
let server: BluetoothRemoteGATTServer | null = null;
let dataCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let cmdCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let notifyHandler: ((event: Event) => void) | null = null;

// Check if Web Bluetooth is available
export function isBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

// Request device and connect
export async function requestDevice(): Promise<DeviceInfo | null> {
  if (!isBluetoothAvailable()) return null;

  try {
    device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [GRAIN_SERVICE_UUID] }],
      optionalServices: ['battery_service'],
    });

    if (!device) return null;

    return {
      id: device.id,
      name: device.name || 'GRAIN-01',
      firmware: 'v1.2.4',
      platform: 'ESP32',
      grainType: 'wheat' as GrainType,
      battery: 100,
      signal: 85,
    };
  } catch {
    return null;
  }
}

// Connect to GATT server and set up notifications
export async function connect(): Promise<boolean> {
  if (!device) return false;

  try {
    server = await device.gatt!.connect();

    const service = await server.getPrimaryService(GRAIN_SERVICE_UUID);
    dataCharacteristic = await service.getCharacteristic(GRAIN_DATA_CHAR_UUID);
    cmdCharacteristic = await service.getCharacteristic(GRAIN_CMD_CHAR_UUID);

    // Enable notifications
    await dataCharacteristic.startNotifications();

    return true;
  } catch {
    return false;
  }
}

// Subscribe to real-time readings
export function onReading(callback: (reading: Reading) => void): void {
  if (!dataCharacteristic) return;

  notifyHandler = (event: Event) => {
    const target = event.target as BluetoothRemoteGATTCharacteristic;
    const data = target.value;
    if (!data || data.byteLength < 12) return;

    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    const grainCode = view.getUint8(0);
    const grainTypes: GrainType[] = ['wheat', 'rice', 'corn', 'barley', 'soybean', 'sorghum', 'oats', 'millet', 'other'];
    const grainType = grainTypes[grainCode] || 'wheat';

    const moisture = view.getUint16(1, true) / 10;
    const temperature = view.getInt16(3, true) / 10;
    const battery = view.getUint8(5);
    const signal = view.getUint8(6);
    const status = view.getUint8(7);

    const statusMap: Record<number, DeviceState> = {
      0: 'connected', 1: 'syncing', 2: 'sleeping', 3: 'low-battery', 4: 'awake',
    };

    callback({
      id: `${device!.id}-${Date.now()}`,
      deviceId: device!.id,
      grainType,
      moisture,
      temperature,
      battery,
      timestamp: Date.now(),
      signal,
      deviceStatus: statusMap[status] || 'connected',
    });
  };

  dataCharacteristic.addEventListener('characteristicvaluechanged', notifyHandler);
}

// Send command to probe (e.g., wake, calibrate, request sync)
export async function sendCommand(command: 'wake' | 'calibrate' | 'sync' | 'sleep'): Promise<boolean> {
  if (!cmdCharacteristic) return false;

  const cmdMap: Record<string, number> = { wake: 1, calibrate: 2, sync: 3, sleep: 4 };

  try {
    await cmdCharacteristic.writeValue(new Uint8Array([cmdMap[command] || 0]));
    return true;
  } catch {
    return false;
  }
}

// Disconnect
export function disconnect(): void {
  if (notifyHandler && dataCharacteristic) {
    dataCharacteristic.removeEventListener('characteristicvaluechanged', notifyHandler);
    notifyHandler = null;
  }
  if (server?.connected) {
    server.disconnect();
  }
  server = null;
  dataCharacteristic = null;
  cmdCharacteristic = null;
}

// Get current connection state
export function getConnectionState(): 'connected' | 'disconnected' {
  return server?.connected ? 'connected' : 'disconnected';
}

/* ═══════════════════════════════════════════════════════════════
   SIMULATION – Realistic ESP32 probe behaviour

   Real probe behaviour:
   1. The probe continuously measures & stores readings internally
      (e.g. every 30 min) while inserted in grain.
   2. The app can only access data when the user opens it and
      connects via BLE.
   3. On connect, the probe enters “sharing mode” and dumps
      all stored readings to the app in rapid succession.
   4. After the dump, the probe sends only occasional live
      readings (e.g. every 30 s) while the BLE session is open.
   5. If the user closes the app / disconnects, the probe
      resumes storing only (no BLE).
   ═══════════════════════════════════════════════════════════════ */

let simulationInterval: ReturnType<typeof setInterval> | null = null;
let _isSimulating = false;
let _currentSimMode: 'safe' | 'warn' | 'critical' = 'safe';

export function isSimulating(): boolean {
  return _isSimulating;
}

export function getSimMode(): 'safe' | 'warn' | 'critical' {
  return _currentSimMode;
}

/**
 * Generate a set of “historical” readings the probe stored
 * before the app connected. Spread over the last 24 h.
 */
function generateProbeHistory(
  deviceId: string,
  grainType: GrainType,
  mode: 'safe' | 'warn' | 'critical',
): Reading[] {
  const now = Date.now();
  const count = 48; // 48 readings = 24 h at 30-min intervals
  const readings: Reading[] = [];

  const baseMoisture = mode === 'safe' ? 12.2 : mode === 'warn' ? 14.5 : 17.0;
  const baseTemp    = mode === 'safe' ? 26   : mode === 'warn' ? 30   : 33;
  const driftRate   = mode === 'safe' ? 0.002 : mode === 'warn' ? 0.008 : 0.015;

  for (let i = 0; i < count; i++) {
    const minutesAgo = (count - i) * 30; // 30 min apart
    const ts = now - minutesAgo * 60_000;
    const hourOfDay = new Date(ts).getHours();

    // Slight diurnal temperature variation (cooler at night)
    const tempOffset = Math.sin((hourOfDay - 6) / 24 * Math.PI * 2) * 1.5;
    // Gradual moisture drift upward over 24 h
    const moistureDrift = i * driftRate;
    // Tiny realistic sensor noise
    const noise = (seededRandom(i) - 0.5) * 0.2;

    readings.push({
      id: `${deviceId}-hist-${i}`,
      deviceId,
      grainType,
      moisture: Math.round((baseMoisture + moistureDrift + noise) * 10) / 10,
      temperature: Math.round((baseTemp + tempOffset + noise * 0.5) * 10) / 10,
      battery: Math.max(20, 92 - Math.floor(i / 8)),
      timestamp: ts,
      signal: Math.max(40, 85 - Math.floor(seededRandom(i + 100) * 15)),
      deviceStatus: 'connected' as DeviceState,
    });
  }
  return readings;
}

/** Simple seeded PRNG for deterministic data */
function seededRandom(seed: number): number {
  let x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export type SimConnectCallbacks = {
  onSyncStart: () => void;
  onReading: (reading: Reading) => void;
  onSyncComplete: () => void;
};

/**
 * startSimulation – mimics real probe behaviour.
 * Phase 1: Bulk dump stored history (fast, ~50 ms per reading).
 * Phase 2: Occasional live readings (every 15 s) with small noise.
 */
export function startSimulation(
  deviceId: string,
  grainType: GrainType,
  callbacks: SimConnectCallbacks,
  mode: 'safe' | 'warn' | 'critical' = 'safe',
): void {
  stopSimulation();
  _isSimulating = true;
  _currentSimMode = mode;

  const history = generateProbeHistory(deviceId, grainType, mode);
  let syncIndex = 0;
  let liveTick = 0;

  // ── Phase 1: Bulk sync stored readings ──
  callbacks.onSyncStart();

  const syncInterval = setInterval(() => {
    if (syncIndex < history.length) {
      callbacks.onReading(history[syncIndex]);
      syncIndex++;
    } else {
      clearInterval(syncInterval);
      callbacks.onSyncComplete();

      // ── Phase 2: Occasional live reading ──
      const lastReading = history[history.length - 1];
      simulationInterval = setInterval(() => {
        if (!_isSimulating) {
          stopSimulation();
          return;
        }
        liveTick++;
        const noise = (seededRandom(liveTick + 9999) - 0.5) * 0.15;
        const tempNoise = (seededRandom(liveTick + 8888) - 0.5) * 0.4;
        const drift = mode === 'safe' ? 0.001 : mode === 'warn' ? 0.005 : 0.01;

        callbacks.onReading({
          id: `${deviceId}-live-${Date.now()}`,
          deviceId,
          grainType,
          moisture: Math.round((lastReading.moisture + liveTick * drift + noise) * 10) / 10,
          temperature: Math.round((lastReading.temperature + tempNoise) * 10) / 10,
          battery: Math.max(15, lastReading.battery - Math.floor(liveTick / 20)),
          timestamp: Date.now(),
          signal: Math.max(35, 85 - Math.floor(seededRandom(liveTick + 7777) * 12)),
          deviceStatus: 'connected' as DeviceState,
        });
      }, 15_000); // Live reading every 15 s
    }
  }, 50); // Dump one stored reading every 50 ms

  // Keep ref so we can stop mid-sync
  simulationInterval = syncInterval;
}

export function stopSimulation(): void {
  _isSimulating = false;
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

/**
 * switchSimulationMode – change the demo mode WITHOUT disconnecting.
 * Stops current sim, generates fresh history with new mode, re-syncs.
 */
export function switchSimulationMode(
  deviceId: string,
  grainType: GrainType,
  callbacks: SimConnectCallbacks,
  mode: 'safe' | 'warn' | 'critical',
): void {
  stopSimulation();
  // Brief pause so React can settle
  setTimeout(() => {
    startSimulation(deviceId, grainType, callbacks, mode);
  }, 100);
}
