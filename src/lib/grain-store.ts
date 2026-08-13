/* ═══════════════════════════════════════════════════
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

export type TabId = 'home' | 'discover' | 'history' | 'settings';

interface GrainStore {
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

export const useGrainStore = create<GrainStore>((set, get) => ({
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
    set({ deviceState: 'connecting' });

    const info = await requestDevice();
    if (!info) {
      set({ deviceState: 'disconnected' });
      get().showToast('No device selected');
      return;
    }

    set({ deviceInfo: info });

    const connected = await bleConnect();
    if (!connected) {
      set({ deviceState: 'disconnected' });
      get().showToast('Connection failed');
      return;
    }

    set({ deviceState: 'connected', hasDevice: true });
    get().showToast(`${info.name} connected`);

    bleOnReading((reading) => {
      get().handleReading(reading);
    });
  },

  disconnectProbe: () => {
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
    get().showToast('Device disconnected');
  },

  sendProbeCommand: async (cmd) => {
    const ok = await sendCommand(cmd);
    get().showToast(ok ? `Command sent: ${cmd}` : `Command failed: ${cmd}`);
  },

  clearHistory: async () => {
    await clearAllHistory();
    set({ historyEntries: [] });
    get().showToast('History cleared');
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
    const entry = await getHistoryEntry(id);
    set({ selectedHistoryEntry: entry || null });
  },

  syncProbeHistory: async () => {
    set({ deviceState: 'syncing' });
    const ok = await sendCommand('sync');
    // After sending sync command, probe will dump history via BLE notifications
    // The onReading handler will process them. We wait a bit then return to connected.
    setTimeout(() => {
      if (get().deviceState === 'syncing') {
        set({ deviceState: 'connected' });
      }
    }, 5000);
    get().showToast(ok ? 'Syncing probe history...' : 'Sync command failed');
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
