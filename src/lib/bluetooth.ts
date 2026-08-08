/* ═══════════════════════════════════════════════════════════════
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

    const moisture = view.getUint16(1, true) / 10; // 1 decimal
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

  const encoder = new TextEncoder();
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
   SIMULATION MODE – for development / demo without hardware
   ═══════════════════════════════════════════════════════════════ */

let simulationInterval: ReturnType<typeof setInterval> | null = null;

export function startSimulation(
  deviceId: string,
  grainType: GrainType,
 callback: (reading: Reading) => void,
  mode: 'safe' | 'warn' | 'critical' = 'safe',
): void {
  stopSimulation();

  const baseMoisture = mode === 'safe' ? 12.5 : mode === 'warn' ? 14.8 : 17.5;
  const baseTemp = mode === 'safe' ? 27 : mode === 'warn' ? 31 : 34;
  let tick = 0;

  simulationInterval = setInterval(() => {
    tick++;
    const moistureNoise = (Math.random() - 0.5) * 0.6;
    const tempNoise = (Math.random() - 0.5) * 1.0;
    const drift = mode === 'warn' || mode === 'critical' ? tick * 0.02 : 0;

    callback({
      id: `${deviceId}-sim-${Date.now()}`,
      deviceId,
      grainType,
      moisture: Math.round((baseMoisture + moistureNoise + drift) * 10) / 10,
      temperature: Math.round((baseTemp + tempNoise) * 10) / 10,
      battery: Math.max(5, 85 - Math.floor(tick / 30)),
      timestamp: Date.now(),
      signal: Math.max(20, 90 - Math.floor(Math.random() * 15)),
      deviceStatus: 'connected',
    });
  }, 3000);
}

export function stopSimulation(): void {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

export function isSimulating(): boolean {
  return simulationInterval !== null;
}
