/* ═══════════════════════════════════════════════════════════════
   Offline Storage Layer – IndexedDB via 'idb' library
   ═══════════════════════════════════════════════════════════════ */

import { openDB, type IDBPDatabase } from 'idb';
import type { Reading, AppSettings, HistoryEntry, MochiDecision } from './grain-types';
import { DEFAULT_SETTINGS } from './grain-types';

const DB_NAME = 'grain-monitor-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Readings store
        if (!db.objectStoreNames.contains('readings')) {
          const readings = db.createObjectStore('readings', { keyPath: 'id' });
          readings.createIndex('deviceId', 'deviceId', { unique: false });
          readings.createIndex('timestamp', 'timestamp', { unique: false });
        }
        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        // History entries (reading + decision)
        if (!db.objectStoreNames.contains('history')) {
          const history = db.createObjectStore('history', { keyPath: 'id' });
          history.createIndex('deviceId', 'reading.deviceId', { unique: false });
          history.createIndex('timestamp', 'reading.timestamp', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

/* ── Readings ── */
export async function saveReading(reading: Reading): Promise<void> {
  const db = await getDB();
  await db.put('readings', reading);
}

export async function saveReadings(readings: Reading[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('readings', 'readwrite');
  await Promise.all(readings.map((r) => tx.store.put(r)));
  await tx.done;
}

export async function getReadings(deviceId?: string, limit = 50): Promise<Reading[]> {
  const db = await getDB();
  let readings: Reading[];
  if (deviceId) {
    readings = await db.getAllFromIndex('readings', 'deviceId', deviceId);
  } else {
    readings = await db.getAll('readings');
  }
  readings.sort((a, b) => b.timestamp - a.timestamp);
  return readings.slice(0, limit);
}

export async function getRecentReadings(deviceId: string, count = 20): Promise<Reading[]> {
  const all = await getReadings(deviceId, 200);
  return all.slice(0, count);
}

/* ── History Entries (reading + decision) ── */
export async function saveHistoryEntry(entry: HistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put('history', entry);
}

export async function getHistoryEntries(deviceId?: string, limit = 100): Promise<HistoryEntry[]> {
  const db = await getDB();
  let entries: HistoryEntry[];
  if (deviceId) {
    entries = await db.getAllFromIndex('history', 'deviceId', deviceId);
  } else {
    entries = await db.getAll('history');
  }
  entries.sort((a, b) => b.reading.timestamp - a.reading.timestamp);
  return entries.slice(0, limit);
}

export async function getHistoryEntry(id: string): Promise<HistoryEntry | undefined> {
  const db = await getDB();
  return db.get('history', id);
}

export async function clearAllHistory(): Promise<void> {
  const db = await getDB();
  await db.clear('readings');
  await db.clear('history');
}

/* ── Settings ── */
export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await getDB();
    const row = await db.get('settings', 'app-settings');
    return row?.value ?? DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { key: 'app-settings', value: settings });
}

/* ── Export ── */
export async function exportReadingsAsCSV(deviceId?: string): Promise<string> {
  const readings = await getReadings(deviceId, 10000);
  if (readings.length === 0) return '';

  const header = 'ID,Device,Grain,Moisture,Temperature,Battery,Signal,Timestamp,Status';
  const rows = readings.map((r) =>
    `${r.id},${r.deviceId},${r.grainType},${r.moisture},${r.temperature},${r.battery},${r.signal},${new Date(r.timestamp).toISOString()},${r.deviceStatus}`
  );
  return [header, ...rows].join('\n');
}
