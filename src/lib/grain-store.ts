/* ═════════════════════════════════════════════════════
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
  startSimulation,
  stopSimulation,
  switchSimulationMode,
  isSimulating,
  getSimMode,
} from './bluetooth';
import type { SimConnectCallbacks } from './bluetooth';

export type TabId = 'home' | 'discover' | 'history' | 'settings';

interface GrainStore {
  /* ── Navigation ── */
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  /* ── Bluetooth ── */
  btAvailable: boolean | null; // null = checking, true = on, false = off
  setBtAvailable: (v: boolean) => void;

  /* ── Device ── */
  deviceState: DeviceState;
  deviceInfo: DeviceInfo | null;
  hasDevice: boolean; // true once a device has been connected (survives re-renders)

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
  simulateConnect: (mode?: 'safe' | 'warn' | 'critical') => void;
  switchDemoMode: (mode: 'safe' | 'warn' | 'critical') => void;
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

  /** Select grain type → update thresholds from grain profile → re-simulate if running */
  selectGrainType: (grain) => {
    const profile = GRAIN_PROFILES[grain];
    const updated = { ...get().settings, grainType: grain, thresholds: { ...profile } };
    set({ settings: updated });
    storeSettings(updated);

    // If simulation is running, re-simulate with new grain
    if (isSimulating() && get().deviceInfo) {
      const mode = getSimMode();
      const deviceId = get().deviceInfo!.id;
      // Switch mode in place (no connecting state)
      set({ deviceState: 'syncing' });
      switchSimulationMode(deviceId, grain, {
        onSyncStart: () => {},
        onReading: (r) => get().handleReading(r),
        onSyncComplete: () => set({ deviceState: 'connected' }),
      }, mode);
    }
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

    set({ deviceState: 'connected', hasDevice: true });
    get().showToast(`${info.name} connected`);

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

  simulateConnect: (mode = 'safe') => {
    stopSimulation();
    set({ deviceState: 'connecting' });

    setTimeout(() => {
      const deviceId = 'sim-grain-01';
      const info: DeviceInfo = {
        id: deviceId,
        name: 'GRAIN-01',
        firmware: 'v1.2.4',
        platform: 'ESP32',
        grainType: get().settings.grainType,
        battery: 92,
        signal: 85,
      };

      set({ deviceInfo: info, hasDevice: true });

      const simCallbacks: SimConnectCallbacks = {
        onSyncStart: () => set({ deviceState: 'syncing' }),
        onReading: (reading) => get().handleReading(reading),
        onSyncComplete: () => {
          set({ deviceState: 'connected' });
          get().showToast('GRAIN-01 connected');
        },
      };

      startSimulation(deviceId, get().settings.grainType, simCallbacks, mode);
    }, 1200);
  },

  /** Switch demo mode WITHOUT going through connecting state */
  switchDemoMode: (mode) => {
    if (!isSimulating() || !get().deviceInfo) {
      get().simulateConnect(mode);
      return;
    }
    const deviceId = get().deviceInfo!.id;
    set({ deviceState: 'syncing' });
    switchSimulationMode(deviceId, get().settings.grainType, {
      onSyncStart: () => {},
      onReading: (r) => get().handleReading(r),
      onSyncComplete: () => {
        set({ deviceState: 'connected' });
        get().showToast(`Demo: ${mode}`);
      },
    }, mode);
  },

  sendProbeCommand: async (cmd) => {
    if (isSimulating()) {
      get().showToast(`Command sent: ${cmd}`);
      if (cmd === 'sleep') set({ deviceState: 'sleeping' });
      if (cmd === 'wake') set({ deviceState: 'connected' });
      if (cmd === 'sync') {
        set({ deviceState: 'syncing' });
        setTimeout(() => set({ deviceState: 'connected' }), 2000);
      }
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
    await new Promise((r) => setTimeout(r, 2000));
    set({ deviceState: 'connected' });
    get().showToast('History synchronised');
  },

  /* ═══ Internal ═══ */
  handleReading: (reading: Reading) => {
    const { settings, deviceState } = get();

    // If we're not in a state that should process readings, ignore
    if (deviceState === 'disconnected' || deviceState === 'connecting') return;

    // Save to IndexedDB, evaluate, save history, refresh list
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

      // Only update deviceState from battery if we're in connected/awake
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
