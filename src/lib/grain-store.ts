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

interface GrainStore {
  /* ── Demo Mode ── */
  demoMode: boolean;
  demoInterval: ReturnType<typeof setInterval> | null;
  enableDemoMode: () => void;
  disableDemoMode: () => void;

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

  /* ── Sparkline data ── */
  sparklineData: number[];

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

  /* ── Actions ── */
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

/* ═══ Demo Data Generator ═══ */
function generateDemoReading(grainType: GrainType, ts: number, idx: number): Reading {
  // Simulate realistic moisture readings with slight variation
  const baseMoisture = 11.5 + (idx % 7) * 0.4;
  const jitter = (Math.sin(idx * 2.3) * 1.2) + (Math.cos(idx * 0.7) * 0.5);
  const moisture = Math.round((baseMoisture + jitter) * 10) / 10;
  const baseTemp = 26 + (idx % 5) * 0.8;
  const tempJitter = Math.sin(idx * 1.8) * 1.5;
  const temperature = Math.round((baseTemp + tempJitter) * 10) / 10;
  const battery = Math.max(15, Math.min(100, 92 - idx * 0.3 + Math.round(Math.sin(idx) * 3)));
  const signal = Math.max(40, Math.min(100, 85 - Math.round(Math.sin(idx * 0.9) * 15)));

  return {
    id: `demo-${ts}-${idx}`,
    deviceId: 'DEMO-GRAIN-01',
    grainType,
    moisture: Math.max(8, moisture),
    temperature,
    battery,
    timestamp: ts,
    signal,
    deviceStatus: 'connected',
  };
}

function generateDemoHistory(grainType: GrainType, thresholds: GrainThresholds): HistoryEntry[] {
  const now = Date.now();
  const entries: HistoryEntry[] = [];
  // Generate 20 entries over the past 3 days
  for (let i = 0; i < 20; i++) {
    const ts = now - (i * 3.5 * 60 * 60 * 1000); // every 3.5 hours
    const reading = generateDemoReading(grainType, ts, i);
    // Also build a mini history for trend detection
    const miniHistory = Array.from({ length: Math.min(i + 1, 5) }, (_, j) =>
      generateDemoReading(grainType, ts - j * 30 * 60 * 1000, i + j)
    );
    const decision = evaluate(reading, miniHistory, thresholds);
    entries.push({ reading, decision });
  }
  return entries;
}

export const useGrainStore = create<GrainStore>((set, get) => ({
  /* ── Demo Mode ── */
  demoMode: false,
  demoInterval: null,

  enableDemoMode: () => {
    const { settings } = get();
    const lang = settings.language as AppLanguage;
    const grainType = settings.grainType;
    const thresholds = settings.thresholds;

    // Generate demo history
    const historyEntries = generateDemoHistory(grainType, thresholds);

    // Latest reading (most recent in history)
    const latestEntry = historyEntries[0];
    const currentReading = latestEntry.reading;
    const decision = latestEntry.decision;
    const badge = getStatusBadge(decision, 'connected');

    // Sparkline from recent entries
    const sparklineData = historyEntries.slice(0, 12).map((e) => e.reading.moisture);

    // Fake device info
    const deviceInfo: DeviceInfo = {
      id: 'DEMO-GRAIN-01',
      name: 'GRAIN-01 (Demo)',
      firmware: 'v1.2.0-demo',
      platform: 'ESP32',
      grainType,
      battery: currentReading.battery,
      signal: currentReading.signal,
    };

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
    });

    get().showToast(t('toast.demo_on', lang));

    // Simulate live readings every 8 seconds
    const interval = setInterval(() => {
      const s = get();
      if (!s.demoMode) return;
      const now = Date.now();
      const idx = Math.floor(now / 8000);
      const newReading = generateDemoReading(s.settings.grainType, now, idx);
      const miniHistory = [...s.historyEntries.slice(0, 5).map((e) => e.reading), newReading];
      const newDecision = evaluate(newReading, miniHistory, s.settings.thresholds);
      const newBadge = getStatusBadge(newDecision, 'connected');
      const newEntry: HistoryEntry = { reading: newReading, decision: newDecision };

      set({
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
        sparklineData: [...s.sparklineData.slice(-11), newReading.moisture],
        historyEntries: [newEntry, ...s.historyEntries].slice(0, 100),
      });
    }, 8000);

    set({ demoInterval: interval });
  },

  disableDemoMode: () => {
    const { demoInterval } = get();
    if (demoInterval) clearInterval(demoInterval);

    const lang = getLang(get());
    set({
      demoMode: false,
      demoInterval: null,
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

  /* ═══ Actions ═══ */

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

  /* ═══ Internal ═══ */
  handleReading: (reading: Reading) => {
    const { settings, deviceState } = get();

    if (deviceState === 'disconnected' || deviceState === 'connecting') return;

    saveReading(reading).then(() =>
      getRecentReadings(reading.deviceId, 20)
    ).then((recent) => {
      const allRecent = [reading, ...recent];
      const decision = evaluate(reading, allRecent, settings.thresholds);
      const badge = getStatusBadge(decision, get().deviceState);

      const sparkline = allRecent.slice(0, 12).reverse().map((r) => r.moisture);

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
