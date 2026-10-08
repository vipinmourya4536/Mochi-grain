/* ═══════════════════════════════════════════════════════════════
   Offline Storage Layer – IndexedDB via 'idb' library
   ═══════════════════════════════════════════════════════════════ */

import { openDB, type IDBPDatabase } from 'idb';
import type { Reading, AppSettings, HistoryEntry, MochiDecision } from './grain-types';
import { DEFAULT_SETTINGS } from './grain-types';

const DB_NAME = 'grain-monitor-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
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
        // v2: Saved Discover videos (keyPath = video id string)
        if (oldVersion < 2 && !db.objectStoreNames.contains('bookmarks')) {
          db.createObjectStore('bookmarks', { keyPath: 'id' });
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
  // Ensure top-level id for keyPath
  const record = { ...entry, id: entry.reading.id };
  await db.put('history', record);
}

export async function getHistoryEntries(deviceId?: string, limit = 100): Promise<HistoryEntry[]> {
  const db = await getDB();
  let entries: HistoryEntry[];
  if (deviceId) {
    entries = await db.getAllFromIndex('history', 'deviceId', deviceId);
  } else {
    entries = await db.getAll('history');
  }
  // Stale demo leftovers (crash mid-demo) never appear as real history
  entries = entries.filter((e) => e.reading.deviceId !== 'DEMO-GRAIN-01');
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

/* ── Demo data lifecycle ──
   Demo readings live in the same stores (deviceId 'DEMO-GRAIN-01') so the
   demo exercises the exact same persistence path as the real probe.
   They are removed whenever the demo stops, and never surface as real
   history after a crash (filtered above / excluded from exports). */
export const DEMO_DEVICE_ID = 'DEMO-GRAIN-01';

/** Remove every reading/history entry recorded by the demo probe */
export async function deleteDemoData(): Promise<void> {
  const db = await getDB();
  const demoReadings: Reading[] = await db.getAllFromIndex('readings', 'deviceId', DEMO_DEVICE_ID);
  if (demoReadings.length > 0) {
    const rx = db.transaction('readings', 'readwrite');
    await Promise.all(demoReadings.map((r) => rx.store.delete(r.id)));
    await rx.done;
  }

  const demoHistory: HistoryEntry[] = await db.getAllFromIndex('history', 'deviceId', DEMO_DEVICE_ID);
  if (demoHistory.length > 0) {
    const hx = db.transaction('history', 'readwrite');
    await Promise.all(demoHistory.map((e) => hx.store.delete(e.reading.id)));
    await hx.done;
  }
}

/* ── Discover video bookmarks ── */
export interface BookmarkRecord {
  id: string;
  savedAt: number;
}

export async function getBookmarkedIds(): Promise<string[]> {
  try {
    const db = await getDB();
    const rows: { id: string; savedAt: number }[] = await db.getAll('bookmarks');
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

/** Full bookmark records (id + savedAt) so the Saved view can sort by recency */
export async function getBookmarkedEntries(): Promise<BookmarkRecord[]> {
  try {
    const db = await getDB();
    const rows: { id: string; savedAt: number }[] = await db.getAll('bookmarks');
    return rows.map((r) => ({ id: r.id, savedAt: r.savedAt }));
  } catch {
    return [];
  }
}

/** Toggle a video bookmark; returns the new saved state */
export async function toggleVideoBookmark(videoId: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('bookmarks', videoId);
  if (existing) {
    await db.delete('bookmarks', videoId);
    return false;
  }
  await db.put('bookmarks', { id: videoId, savedAt: Date.now() });
  return true;
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
  const real = readings.filter((r) => r.deviceId !== DEMO_DEVICE_ID);
  if (real.length === 0) return '';

  const header = 'ID,Device,Grain,Moisture,Temperature,Battery,Signal,Timestamp,Status';
  const rows = real.map((r) =>
    `${r.id},${r.deviceId},${r.grainType},${r.moisture},${r.temperature},${r.battery},${r.signal},${new Date(r.timestamp).toISOString()},${r.deviceStatus}`
  );
  return [header, ...rows].join('\n');
}

/* ── Full backup (JSON): settings + readings + history ── */

export interface BackupFile {
  app: 'grain-monitor';
  version: 1;
  exportedAt: string;
  settings: AppSettings | null;
  readings: Reading[];
  history: HistoryEntry[];
}

/** Serialize the complete local database (settings + all stores) as a JSON string.
 *  Demo-probe entries are synthetic and excluded from backups. */
export async function exportBackupJSON(): Promise<string> {
  const db = await getDB();
  const [settings, allReadings, allHistory] = await Promise.all([
    getSettings(),
    db.getAll('readings'),
    db.getAll('history'),
  ]);
  const readings = allReadings.filter((r) => r.deviceId !== DEMO_DEVICE_ID);
  const history = allHistory.filter((e) => e.reading.deviceId !== DEMO_DEVICE_ID);
  const backup: BackupFile = {
    app: 'grain-monitor',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    readings,
    history,
  };
  return JSON.stringify(backup, null, 2);
}

function isValidReading(r: any): r is Reading {
  return (
    r != null &&
    typeof r === 'object' &&
    typeof r.id === 'string' &&
    typeof r.deviceId === 'string' &&
    typeof r.moisture === 'number' && Number.isFinite(r.moisture) &&
    typeof r.timestamp === 'number' && Number.isFinite(r.timestamp)
  );
}

function isValidEntry(e: any): e is HistoryEntry {
  return (
    e != null &&
    typeof e === 'object' &&
    isValidReading(e.reading) &&
    e.decision != null &&
    typeof e.decision === 'object' &&
    typeof e.decision.state === 'string'
  );
}


/**
 * Restore a backup produced by exportBackupJSON.
 * mode 'merge' (default): keep local data, add/overwrite backup records.
 * mode 'replace': wipe readings + history first, then restore.
 * Settings are always merged over current settings.
 * Throws Error('invalid') when the file is not a Grain Monitor backup.
 */
export async function importBackupJSON(
  json: string,
  mode: 'merge' | 'replace' = 'merge',
): Promise<{ readings: number; history: number }> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('invalid');
  }

  const b = parsed as Partial<BackupFile> | null;
  if (
    !b ||
    typeof b !== 'object' ||
    b.app !== 'grain-monitor' ||
    !Array.isArray(b.readings) ||
    !Array.isArray(b.history)
  ) {
    throw new Error('invalid');
  }

  const readings = (b.readings as unknown[]).filter(isValidReading);
  const history = (b.history as unknown[])
    .filter(isValidEntry)
    // Guarantee the top-level keyPath id the history store requires
    .map((e) => ({ ...e, id: e.reading.id }));

  const db = await getDB();

  if (mode === 'replace') {
    await db.clear('readings');
    await db.clear('history');
  }

  // Bulk-insert readings + history in single transactions
  const rx = db.transaction('readings', 'readwrite');
  await Promise.all(readings.map((r) => rx.store.put(r)));
  await rx.done;

  const hx = db.transaction('history', 'readwrite');
  await Promise.all(history.map((e) => hx.store.put(e)));
  await hx.done;

  // Merge settings (backup values win over current, defaults fill gaps)
  if (b.settings && typeof b.settings === 'object') {
    const current = await getSettings();
    const merged = { ...DEFAULT_SETTINGS, ...current, ...(b.settings as Partial<AppSettings>) } as AppSettings;
    await saveSettings(merged);
  }

  return { readings: readings.length, history: history.length };
}
