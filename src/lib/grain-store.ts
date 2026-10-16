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
  EngineCooldownState,
} from './grain-types';
import { DEFAULT_SETTINGS, GRAIN_PROFILES, GRAIN_OPTIONS, stateToRiskTheme } from './grain-types';
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
  reconnect as bleReconnect,
  onReading as bleOnReading,
  onDisconnected as bleOnDisconnected,
  disconnect as bleDisconnect,
  sendCommand,
} from './bluetooth';
import { t, tp, type AppLanguage } from './i18n';
import { haptic } from './haptics';

export type TabId = 'home' | 'discover' | 'history' | 'settings';

/** Time-stamped sparkline point */
export interface SparklinePoint {
  v: number;   // moisture value
  t: number;   // epoch ms
}

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
  /** Caller-owned engine cooldown/transition memory (v2.1 contract:
   *  injected into evaluate(), updated from decision.cooldown). */
  engineCooldown: EngineCooldownState | null;

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

  /* ── Internal ── */
  handleReading: (reading: Reading) => void;
  handleUnexpectedDisconnect: () => void;
}

/** Helper to get current lang from store */
function getLang(store: GrainStore): AppLanguage {
  return store.settings.language as AppLanguage;
}

/* ══ Store-level MA-crossing signal (moisture) ══
 * The trends chart draws crossing rings locally, but the tactile cue
 * must fire wherever the user happens to be — so the store runs the
 * SAME rule on every new reading: sign flip of (value − trailing MA)
 * between the previous and the newest sample. Pure sign flip, no
 * dead-band — identical to detectCrossings() in the trends chart.
 * Returns the crossing direction of the NEWEST value, or null. */
function detectMaCrossing(chrono: number[], win: number): 'up' | 'down' | null {
  if (chrono.length < win + 1 || win < 2) return null;
  const prev = chrono.slice(0, -1);
  const last = chrono[chrono.length - 1];
  // MA at the previous sample: last `win` values BEFORE the new one
  const prevWin = prev.slice(-win);
  const maPrev = prevWin.reduce((a, b) => a + b, 0) / win;
  // MA at the newest sample: trailing (win−1) previous values + the new one
  const tail = prev.slice(-(win - 1));
  const maNew = [...tail, last].reduce((a, b) => a + b, 0) / win;
  const dPrev = prev[prev.length - 1] - maPrev;
  const dNew = last - maNew;
  if (dPrev < 0 && dNew > 0) return 'up';
  if (dPrev > 0 && dNew < 0) return 'down';
  return null;
}

/** Soft one-shot tick when a NEW reading crosses its trailing MA.
 *  Moisture-only (storage-risk semantics); respects the MA overlay
 *  toggle — when the user turned the line off, no cue. Up-crossing
 *  (rising momentum = risk direction) gets a double tick, down gets
 *  a single one. */
function notifyMaCrossing(values: number[], win: number, movingAvgOn: boolean, hapticsOn: boolean): void {
  if (!movingAvgOn) return;
  const dir = detectMaCrossing(values, win);
  if (dir === 'up') haptic(hapticsOn, [12, 70, 12]);
  else if (dir === 'down') haptic(hapticsOn, 12);
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
  engineCooldown: null,

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
    if (!GRAIN_OPTIONS.includes(grain)) return;

    const profile = GRAIN_PROFILES[grain];
    const updated = { ...get().settings, grainType: grain, thresholds: { ...profile } };

    // 1–3. Update + persist settings (source of truth)
    set({ settings: updated });
    storeSettings(updated);

    // 4–6. Immediately reflect the new grain everywhere it is interpreted.
    // Do NOT wait for the next BLE packet, do NOT reset the connection,
    // do NOT clear the current reading, do NOT create a history entry.
    const { currentReading, deviceInfo, engineCooldown } = get();
    if (currentReading) {
      const normalizedReading: Reading = { ...currentReading, grainType: grain };
      const decision = evaluate(
        normalizedReading,
        get().historyEntries.map((e) => e.reading),
        profile,
        { cooldown: engineCooldown },
      );
      const badge = getStatusBadge(decision, get().deviceState);
      const riskTheme = stateToRiskTheme(decision.state);

      set({
        currentReading: normalizedReading,
        decision,
        statusBadge: badge,
        riskTheme,
        engineCooldown: decision.cooldown ?? null,
        deviceInfo: deviceInfo ? { ...deviceInfo, grainType: grain } : null,
      });
    } else if (deviceInfo) {
      set({ deviceInfo: { ...deviceInfo, grainType: grain } });
    }
  },

  /* ── Toast ── */
  toast: '',
  showToast: (msg) => {
    set({ toast: msg });
    setTimeout(() => set({ toast: '' }), 2500);
  },

  /* ═══ BLE Actions ═══ */

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

    // Watch for unexpected GATT drops (out of range / probe sleep)
    bleOnDisconnected(() => get().handleUnexpectedDisconnect());
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
      engineCooldown: null,
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
    const stored = await getStoredSettings();
    // Merge with defaults so settings added in newer versions (e.g. hapticsEnabled)
    // are defined for settings persisted by older versions.
    const settings: AppSettings = { ...DEFAULT_SETTINGS, ...stored };
    set({ settings });
  },

  loadSelectedEntry: async () => {
    const id = get().selectedHistoryId;
    if (!id) return;
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
  handleReading: (rawReading: Reading) => {
    const { settings, deviceState } = get();

    if (deviceState === 'disconnected' || deviceState === 'connecting') return;

    // ── GRAIN NORMALIZATION ──
    // settings.grainType is the single source of truth. The firmware grain code
    // (rawReading.deviceGrain) is diagnostic metadata only and never overwrites
    // the user's selected monitoring profile.
    const reading: Reading = { ...rawReading, grainType: settings.grainType };

    saveReading(reading).then(() =>
      getRecentReadings(reading.deviceId, 20)
    ).then((recent) => {
      const allRecent = [reading, ...recent];
      const decision = evaluate(reading, allRecent, settings.thresholds, {
        cooldown: get().engineCooldown,
      });
      const badge = getStatusBadge(decision, get().deviceState);
      const riskTheme = stateToRiskTheme(decision.state);

      // Store-level momentum cue (moisture): soft tick on an MA crossing,
      // independent of which tab the user is currently on
      notifyMaCrossing(
        allRecent.slice(0, settings.trendsMaWindow + 1).map((r) => r.moisture).reverse(),
        settings.trendsMaWindow,
        settings.trendsMovingAvg,
        settings.hapticsEnabled,
      );

      // Build timestamped sparkline from real readings
      const sparkline: SparklinePoint[] = allRecent.slice(0, 16).reverse().map((r) => ({
        v: r.moisture,
        t: r.timestamp,
      }));

      const info = get().deviceInfo;
      // deviceInfo.grainType follows the SELECTED grain, not the BLE packet
      const updatedInfo = info
        ? { ...info, battery: reading.battery, signal: reading.signal, grainType: settings.grainType }
        : null;

      let newState = get().deviceState;
      if ((newState === 'connected' || newState === 'awake') && reading.battery < 15) {
        newState = 'low-battery';
      }

      set({
        currentReading: reading,
        decision,
        statusBadge: badge,
        riskTheme,
        sparklineData: sparkline,
        deviceInfo: updatedInfo,
        deviceState: newState,
        engineCooldown: decision.cooldown ?? null,
      });

      return saveHistoryEntry({ reading, decision }).then(() =>
        getHistoryEntries(reading.deviceId, 100)
      );
    }).then((entries) => {
      if (entries) set({ historyEntries: entries });
    });
  },

  /* ═══ Unexpected GATT disconnect → graceful state + optional auto-reconnect ═══ */
  handleUnexpectedDisconnect: () => {
    const s = get();
    const lang = getLang(s);

    // Intentional disconnects already cleaned up via disconnectProbe
    // (which clears hasDevice first).
    if (!s.hasDevice || s.deviceState === 'connecting') return;

    bleDisconnect(); // release characteristics; listener removed inside
    set({
      deviceState: 'disconnected',
      deviceInfo: null,
      hasDevice: false,
      currentReading: null,
      decision: null,
      statusBadge: 'OFFLINE',
      riskTheme: 'safe',
      sparklineData: [],
      engineCooldown: null,
    });
    get().showToast(t('toast.probe_disconnected', lang));

    if (!s.settings.autoReconnect) return;

    // Auto-reconnect: 3 quiet attempts, 4s apart, no browser chooser
    let attempt = 0;
    const tryReconnect = async () => {
      // Bail out if the user started another connect meanwhile
      const cur = get();
      if (cur.hasDevice) return;

      attempt += 1;
      set({ deviceState: 'connecting' });
      get().showToast(t('toast.reconnecting', lang));

      const ok = await bleReconnect();
      const after = get();
      if (ok && !after.hasDevice) {
        set({ deviceState: 'connected', hasDevice: true });
        get().showToast(t('toast.reconnected', lang));
        bleOnReading((reading) => get().handleReading(reading));
        if (after.settings.wakeOnConnect) {
          sendCommand('wake');
        }
      } else if (attempt < 3 && !get().hasDevice) {
        set({ deviceState: 'disconnected' });
        setTimeout(tryReconnect, 4000);
      } else if (!get().hasDevice) {
        set({ deviceState: 'disconnected' });
      }
    };
    setTimeout(tryReconnect, 1500);
  },
}));
