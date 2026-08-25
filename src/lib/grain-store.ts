/* ═══════════════════════════════════════════════════════════════
   Grain Monitor – Zustand Store
   ═══════════════════════════════════════════════════════════════ */

import { create } from 'zustand';
import type {
  DeviceState,
  RiskTheme,
  Reading,
  MochiDecision,
  DeviceInfo,
  AppSettings,
  GrainType,
  GrainThresholds,
  HistoryEntry,
  StatusBadge,
} from './grain-types';
import { DEFAULT_SETTINGS, GRAIN_PROFILES } from './grain-types';
import { evaluate, getStatusBadge } from './mochi-engine';
import {
  saveReading,
  saveHistoryEntry,
  getRecentReadings,
  getHistoryEntries,
  getHistoryEntry,
  clearAllHistory,
  getSettings as getStoredSettings,
  saveSettings as storeSettings,
} from './offline-storage';
import {
  requestDevice,
  connect as bleConnect,
  onReading as bleOnReading,
  disconnect as bleDisconnect,
  sendCommand,
} from './bluetooth';
import { t, tp, type AppLanguage } from './i18n';

export type TabId = 'home' | 'discover' | 'history' | 'settings';

/** Time-stamped sparkline point */
export interface SparklinePoint {
  v: number;   // moisture value
  t: number;   // epoch ms
}

/** Available demo interval presets (in seconds) */
export const DEMO_INTERVAL_PRESETS = [60, 300, 600, 1800, 3600] as const;
export type DemoIntervalPreset = (typeof DEMO_INTERVAL_PRESETS)[number];

interface GrainStore {
  /* ── Demo Mode (completely isolated from BLE) ── */
  demoMode: boolean;
  demoIntervalSec: DemoIntervalPreset;
  _demoTimer: ReturnType<typeof setInterval> | null;
  _demoTick: number;
  enableDemoMode: () => void;
  disableDemoMode: () => void;
  setDemoIntervalSec: (sec: DemoIntervalPreset) => void;

  /* ── Navigation ── */
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  /* ── Bluetooth ── */
  btAvailable: boolean | null;
  setBtAvailable: (v: boolean) => void;

  /* ── Device ── */
  deviceState: DeviceState;
  deviceInfo: DeviceInfo | null;
  hasDevice: boolean;

  /* ── Latest reading ── */
  currentReading: Reading | null;

  /* ── Decision ── */
  decision: MochiDecision | null;
  statusBadge: StatusBadge;
  riskTheme: RiskTheme;

  /* ── Sparkline data (timestamped) ── */
  sparklineData: SparklinePoint[];

  /* ── History ── */
  historyEntries: HistoryEntry[];
  selectedHistoryId: string | null;
  selectedHistoryEntry: HistoryEntry | null;
  setSelectedHistoryId: (id: string | null) => void;

  /* ── Settings ── */
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
  selectGrainType: (grain: GrainType) => void;

  /* ── Toast ── */
  toast: string;
  showToast: (msg: string) => void;

  /* ── Actions (real BLE only) ── */
  connectProbe: () => Promise<void>;
  disconnectProbe: () => void;
  sendProbeCommand: (cmd: 'wake' | 'calibrate' | 'sync' | 'sleep') => Promise<void>;
  clearHistory: () => Promise<void>;
  loadHistory: () => Promise<void>;
  loadSettings: () => Promise<void>;
  loadSelectedEntry: () => Promise<void>;
  syncProbeHistory: () => Promise<void>;
}

/** Helper to get current lang from store */
function getLang(store: GrainStore): AppLanguage {
  return store.settings.language as AppLanguage;
}

/* ═══════════════════════════════════════════════════════════════
   DEMO DATA GENERATOR – isolated fake world
   ═══════════════════════════════════════════════════════════════ */

/** Seedable pseudo-random for deterministic demo data */
function seededRandom(seed: number): number {
  let s = seed;
  s = (s * 16807 + 0) % 2147483647;
  return (s - 1) / 2147483646;
}

function generateDemoReading(grainType: GrainType, ts: number, tick: number): Reading {
  // Deterministic but natural-looking values using seeded random + smooth waves
  const r1 = seededRandom(tick * 7 + 3);
  const r2 = seededRandom(tick * 13 + 7);
  const r3 = seededRandom(tick * 19 + 11);

  // Moisture: slow sine wave + small random walk, stays within realistic 9–16% range
  const baseWave = Math.sin(tick * 0.15) * 1.5 + Math.cos(tick * 0.07) * 0.8;
  const randomWalk = (r1 - 0.5) * 0.6;
  const moisture = Math.round((12.0 + baseWave + randomWalk) * 10) / 10;

  // Temperature: slow drift around 27°C ± 3
  const tempWave = Math.sin(tick * 0.1 + 1.5) * 1.8 + (r2 - 0.5) * 0.4;
  const temperature = Math.round((27 + tempWave) * 10) / 10;

  // Battery: slow drain from 95% down, with small jitter
  const battery = Math.max(12, Math.min(100, Math.round(95 - tick * 0.15 + (r3 - 0.5) * 2)));

  // Signal: varies 65–95%
  const signal = Math.max(50, Math.min(98, Math.round(80 + Math.sin(tick * 0.2) * 12 + (r1 - 0.5) * 5)));

  return {
    id: `demo-${ts}-${tick}`,
    deviceId: 'DEMO-GRAIN-01',
    grainType,
    moisture: Math.max(8, Math.min(20, moisture)),
    temperature: Math.max(20, Math.min(40, temperature)),
    battery,
    timestamp: ts,
    signal,
    deviceStatus: 'connected' as DeviceState,
  };
}

/**
 * Generate a batch of demo history entries.
 * Entries are spaced exactly `intervalSec` apart in timestamp space.
 * The most recent entry is at `now`, going backwards.
 */
function generateDemoHistory(
  grainType: GrainType,
  thresholds: GrainThresholds,
  intervalSec: number,
  count: number,
): HistoryEntry[] {
  const now = Date.now();
  const entries: HistoryEntry[] = [];

  for (let i = 0; i < count; i++) {
    const ts = now - (i * intervalSec * 1000);
    const tick = i; // each entry has a unique tick for deterministic data
    const reading = generateDemoReading(grainType, ts, tick);

    // Build mini-history for Mochi trend detection (previous readings)
    const miniHistory = Array.from({ length: Math.min(i + 1, 6) }, (_, j) =>
      generateDemoReading(grainType, ts - (j + 1) * intervalSec * 1000, tick + j + 1),
    );

    const decision = evaluate(reading, miniHistory, thresholds);
    entries.push({ reading, decision });
  }

  return entries;
}

/** How many history entries to generate based on interval */
function historyCountForInterval(intervalSec: number): number {
  // Aim for ~48 hours of history, but clamp to reasonable range
  const total = Math.floor((48 * 3600) / intervalSec);
  return Math.min(60, Math.max(12, total));
}

/** Real-time simulation speed: one tick every N ms (accelerated preview) */
const SIMULATION_TICK_MS = 3000;

export const useGrainStore = create<GrainStore>((set, get) => ({
  /* ── Demo Mode ── */
  demoMode: false,
  demoIntervalSec: 600, // default 10 minutes
  _demoTimer: null,
  _demoTick: 0,

  enableDemoMode: () => {
    const { settings, demoIntervalSec } = get();
    const lang = settings.language as AppLanguage;
    const grainType = settings.grainType;
    const thresholds = settings.thresholds;

    // Generate initial demo history spaced at the configured interval
    const count = historyCountForInterval(demoIntervalSec);
    const historyEntries = generateDemoHistory(grainType, thresholds, demoIntervalSec, count);

    // Latest reading
    const latestEntry = historyEntries[0];
    const currentReading = latestEntry.reading;
    const decision = latestEntry.decision;
    const badge = getStatusBadge(decision, 'connected');

    // Sparkline: last 16 entries as {v, t} points
    const sparklineData: SparklinePoint[] = historyEntries.slice(0, 16).map((e) => ({
      v: e.reading.moisture,
      t: e.reading.timestamp,
    })).reverse(); // oldest first for chart

    const deviceInfo: DeviceInfo = {
      id: 'DEMO-GRAIN-01',
      name: 'GRAIN-01 (Demo)',
      firmware: 'v1.2.0-demo',
      platform: 'ESP32',
      grainType,
      battery: currentReading.battery,
      signal: currentReading.signal,
    };

    const startTick = count; // continue the tick sequence

    set({
      demoMode: true,
      deviceState: 'connected',
      hasDevice: true,
      deviceInfo,
      currentReading,
      decision,
      statusBadge: badge,
      riskTheme: decision.state,
      sparklineData,
      historyEntries,
      selectedHistoryId: null,
      selectedHistoryEntry: null,
      activeTab: 'home',
      _demoTick: startTick,
    });

    get().showToast(t('toast.demo_on', lang));

    // Live simulation: every 3s generate a new reading (timestamp spaced by configured interval)
    const timer = setInterval(() => {
      const s = get();
      if (!s.demoMode) return;

      const nextTick = s._demoTick + 1;
      // New timestamp is `intervalSec` after the last reading's timestamp
      const lastTs = s.currentReading?.timestamp ?? Date.now();
      const newTs = lastTs + s.demoIntervalSec * 1000;

      const newReading = generateDemoReading(s.settings.grainType, newTs, nextTick);
      const miniHistory = [...s.historyEntries.slice(0, 6).map((e) => e.reading), newReading];
      const newDecision = evaluate(newReading, miniHistory, s.settings.thresholds);
      const newBadge = getStatusBadge(newDecision, 'connected');
      const newEntry: HistoryEntry = { reading: newReading, decision: newDecision };

      // Update sparkline: add new point at end (newest), keep max 16
      const newSparkline: SparklinePoint[] = [
        ...s.sparklineData.slice(-(16 - 1)),
        { v: newReading.moisture, t: newTs },
      ];

      set({
        _demoTick: nextTick,
        currentReading: newReading,
        decision: newDecision,
        statusBadge: newBadge,
        riskTheme: newDecision.state,
        deviceInfo: {
          ...s.deviceInfo!,
          battery: newReading.battery,
          signal: newReading.signal,
          grainType: newReading.grainType,
        },
        sparklineData: newSparkline,
        historyEntries: [newEntry, ...s.historyEntries].slice(0, 100),
      });
    }, SIMULATION_TICK_MS);

    set({ _demoTimer: timer });
  },

  disableDemoMode: () => {
    const { _demoTimer } = get();
    if (_demoTimer) clearInterval(_demoTimer);

    const lang = getLang(get());
    set({
      demoMode: false,
      _demoTimer: null,
      _demoTick: 0,
      deviceState: 'disconnected',
      deviceInfo: null,
      hasDevice: false,
      currentReading: null,
      decision: null,
      statusBadge: 'OFFLINE',
      riskTheme: 'safe',
      sparklineData: [],
      historyEntries: [],
      selectedHistoryId: null,
      selectedHistoryEntry: null,
      activeTab: 'settings',
    });
    get().showToast(t('toast.demo_off', lang));
  },

  setDemoIntervalSec: (sec: DemoIntervalPreset) => {
    const wasRunning = get().demoMode;
    if (wasRunning) {
      // Stop and restart with new interval
      get().disableDemoMode();
    }
    set({ demoIntervalSec: sec });
    if (wasRunning) {
      // Small delay so state settles, then re-enable
      setTimeout(() => get().enableDemoMode(), 100);
    }
  },

  /* ── Nav ── */
  activeTab: 'home',
  setActiveTab: (tab) => set({ activeTab: tab }),

  /* ── Bluetooth ── */
  btAvailable: null,
  setBtAvailable: (v: boolean) => set({ btAvailable: v }),

  /* ── Device ── */
  deviceState: 'disconnected',
  deviceInfo: null,
  hasDevice: false,

  /* ── Reading ── */
  currentReading: null,

  /* ── Decision ── */
  decision: null,
  statusBadge: 'OFFLINE',
  riskTheme: 'safe',

  /* ── Sparkline ── */
  sparklineData: [],

  /* ── History ── */
  historyEntries: [],
  selectedHistoryId: null,
  selectedHistoryEntry: null,
  setSelectedHistoryId: (id) => {
    set({ selectedHistoryId: id });
    if (id) {
      get().loadSelectedEntry();
    } else {
      set({ selectedHistoryEntry: null });
    }
  },

  /* ── Settings ── */
  settings: DEFAULT_SETTINGS,
  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    storeSettings(updated);
  },

  selectGrainType: (grain) => {
    const profile = GRAIN_PROFILES[grain];
    const updated = { ...get().settings, grainType: grain, thresholds: { ...profile } };
    set({ settings: updated });
    storeSettings(updated);
  },

  /* ── Toast ── */
  toast: '',
  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: '' }), 2500);
  },

  /* ═══ REAL BLE Actions (never touched by demo) ═══ */

  connectProbe: async () => {
    const lang = getLang(get());
    set({ deviceState: 'connecting' });

    const info = await requestDevice();
    if (!info) {
      set({ deviceState: 'disconnected' });
      get().showToast(t('toast.no_device_selected', lang));
      return;
    }

    set({ deviceInfo: info });

    const connected = await bleConnect();
    if (!connected) {
      set({ deviceState: 'disconnected' });
      get().showToast(t('toast.connection_failed', lang));
      return;
    }

    set({ deviceState: 'connected', hasDevice: true });
    get().showToast(tp('toast.device_connected', lang, { name: info.name }));

    bleOnReading((reading) => {
      get().handleReading(reading);
    });
  },

  disconnectProbe: () => {
    const lang = getLang(get());
    bleDisconnect();
    set({
      deviceState: 'disconnected',
      deviceInfo: null,
      hasDevice: false,
      currentReading: null,
      decision: null,
      statusBadge: 'OFFLINE',
      riskTheme: 'safe',
      sparklineData: [],
    });
    set({ activeTab: 'home' });
    get().showToast(t('toast.disconnected', lang));
  },

  sendProbeCommand: async (cmd) => {
    const lang = getLang(get());
    const ok = await sendCommand(cmd);
    const baseKey = ok ? 'toast.command_sent' : 'toast.command_failed';
    get().showToast(`${t(baseKey, lang)} ${cmd}`);
  },

  clearHistory: async () => {
    const lang = getLang(get());
    await clearAllHistory();
    set({ historyEntries: [] });
    get().showToast(t('toast.history_cleared', lang));
  },

  loadHistory: async () => {
    const deviceId = get().deviceInfo?.id;
    const entries = await getHistoryEntries(deviceId || undefined);
    set({ historyEntries: entries });
  },

  loadSettings: async () => {
    const settings = await getStoredSettings();
    set({ settings });
  },

  loadSelectedEntry: async () => {
    const id = get().selectedHistoryId;
    if (!id) return;
    // In demo mode, find entry from in-memory history
    if (get().demoMode) {
      const entry = get().historyEntries.find((e) => e.reading.id === id);
      set({ selectedHistoryEntry: entry || null });
      return;
    }
    const entry = await getHistoryEntry(id);
    set({ selectedHistoryEntry: entry || null });
  },

  syncProbeHistory: async () => {
    const lang = getLang(get());
    set({ deviceState: 'syncing' });
    const ok = await sendCommand('sync');
    setTimeout(() => {
      if (get().deviceState === 'syncing') {
        set({ deviceState: 'connected' });
      }
    }, 5000);
    get().showToast(ok ? t('toast.syncing_history', lang) : t('toast.sync_failed', lang));
  },

  /* ═══ Internal – REAL BLE only ═══ */
  handleReading: (reading: Reading) => {
    const { settings, deviceState } = get();

    if (deviceState === 'disconnected' || deviceState === 'connecting') return;

    saveReading(reading).then(() =>
      getRecentReadings(reading.deviceId, 20)
    ).then((recent) => {
      const allRecent = [reading, ...recent];
      const decision = evaluate(reading, allRecent, settings.thresholds);
      const badge = getStatusBadge(decision, get().deviceState);

      // Build timestamped sparkline from real readings
      const sparkline: SparklinePoint[] = allRecent.slice(0, 16).reverse().map((r) => ({
        v: r.moisture,
        t: r.timestamp,
      }));

      const info = get().deviceInfo;
      const updatedInfo = info
        ? { ...info, battery: reading.battery, signal: reading.signal, grainType: reading.grainType }
        : null;

      let newState = get().deviceState;
      if ((newState === 'connected' || newState === 'awake') && reading.battery < 15) {
        newState = 'low-battery';
      }

      set({
        currentReading: reading,
        decision,
        statusBadge: badge,
        riskTheme: decision.state,
        sparklineData: sparkline,
        deviceInfo: updatedInfo,
        deviceState: newState,
      });

      return saveHistoryEntry({ reading, decision }).then(() =>
        getHistoryEntries(reading.deviceId, 100)
      );
    }).then((entries) => {
      if (entries) set({ historyEntries: entries });
    });
  },
}));
