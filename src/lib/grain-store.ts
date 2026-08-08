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
  HistoryEntry,
  StatusBadge,
  DiscoverVideo,
} from './grain-types';
import { DEFAULT_SETTINGS, GRAIN_LABELS } from './grain-types';
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
  startSimulation,
  stopSimulation,
  isSimulating,
  isBluetoothAvailable,
} from './bluetooth';

export type TabId = 'home' | 'discover' | 'history' | 'settings';

interface GrainStore {
  /* ── Navigation ── */
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  /* ── Device ── */
  deviceState: DeviceState;
  deviceInfo: DeviceInfo | null;
  setDeviceState: (s: DeviceState) => void;

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

  /* ── Toast ── */
  toast: string;
  showToast: (msg: string) => void;

  /* ── Actions ── */
  connectProbe: () => Promise<void>;
  disconnectProbe: () => void;
  simulateConnect: (mode?: 'safe' | 'warn' | 'critical') => void;
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

  /* ── Device ── */
  deviceState: 'disconnected',
  deviceInfo: null,
  setDeviceState: (s) => set({ deviceState: s }),

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
      // If Bluetooth not available or user cancelled, try simulation
      get().simulateConnect();
      return;
    }

    set({ deviceInfo: info });

    const connected = await bleConnect();
    if (!connected) {
      set({ deviceState: 'disconnected' });
      get().showToast('Connection failed');
      return;
    }

    set({ deviceState: 'connected' });
    get().showToast(`${info.name} connected`);

    // Subscribe to real-time readings
    bleOnReading((reading) => {
      get().handleReading(reading);
    });
  },

  disconnectProbe: () => {
    bleDisconnect();
    stopSimulation();
    set({
      deviceState: 'disconnected',
      deviceInfo: null,
      currentReading: null,
      decision: null,
      statusBadge: 'OFFLINE',
      riskTheme: 'safe',
      sparklineData: [],
    });
    set({ activeTab: 'home' });
    get().showToast('Device disconnected');
  },

  simulateConnect: (mode = 'safe') => {
    set({ deviceState: 'connecting' });

    setTimeout(() => {
      const deviceId = 'sim-grain-01';
      const info: DeviceInfo = {
        id: deviceId,
        name: 'GRAIN-01',
        firmware: 'v1.2.4',
        platform: 'ESP32',
        grainType: get().settings.grainType,
        battery: 85,
        signal: 82,
      };

      set({ deviceInfo: info, deviceState: 'connected' });
      get().showToast('GRAIN-01 connected');

      startSimulation(deviceId, get().settings.grainType, (reading) => {
        get().handleReading(reading);
      }, mode);
    }, 1500);
  },

  sendProbeCommand: async (cmd) => {
    if (isSimulating()) {
      get().showToast(`Command sent: ${cmd}`);
      if (cmd === 'sleep') set({ deviceState: 'sleeping' });
      if (cmd === 'wake') set({ deviceState: 'connected' });
      if (cmd === 'sync') set({ deviceState: 'syncing' });
      if (cmd === 'sync') setTimeout(() => set({ deviceState: 'connected' }), 2000);
      return;
    }
    const ok = await sendCommand(cmd);
    get().showToast(ok ? `Command sent: ${cmd}` : `Command failed: ${cmd}`);
  },

  clearHistory: async () => {
    await clearAllHistory();
    set({ historyEntries: [] });
    get().showToast('History cleared');
  },

  loadHistory: async () => {
    const entries = await getHistoryEntries(get().deviceInfo?.id);
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
    // In a real scenario, this would request historical data from the probe
    // For now, simulate a sync delay
    await new Promise((r) => setTimeout(r, 2000));
    set({ deviceState: 'connected' });
    get().showToast('History synchronised');
  },

  /* ═══ Internal ═══ */
  handleReading: (reading: Reading) => {
    const { settings } = get();

    // Save to IndexedDB
    saveReading(reading);

    // Get recent history for engine evaluation
    getRecentReadings(reading.deviceId, 20).then((recent) => {
      const allRecent = [reading, ...recent];
      const decision = evaluate(reading, allRecent, settings.thresholds);
      const badge = getStatusBadge(decision, get().deviceState);

      // Save history entry
      saveHistoryEntry({ reading, decision });

      // Update sparkline
      const sparkline = allRecent.slice(0, 12).reverse().map((r) => r.moisture);

      // Update device info from reading
      const info = get().deviceInfo;
      const updatedInfo = info
        ? { ...info, battery: reading.battery, signal: reading.signal, grainType: reading.grainType }
        : null;

      set({
        currentReading: reading,
        decision,
        statusBadge: badge,
        riskTheme: decision.state,
        sparklineData: sparkline,
        deviceInfo: updatedInfo,
        // If battery is low, override device state
        deviceState: reading.battery < 15 ? 'low-battery' : get().deviceState,
      });

      // Refresh history in background
      getHistoryEntries(reading.deviceId, 50).then((entries) => {
        set({ historyEntries: entries });
      });
    });
  },
}));
