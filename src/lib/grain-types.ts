/* ─── Grain Monitor – Core Type Definitions ─── */

export type DeviceState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'sleeping'
  | 'low-battery'
  | 'awake';

export type RiskTheme = 'safe' | 'warn' | 'critical';

export type StatusBadge = 'STABLE' | 'RISING' | 'WARNING' | 'CRITICAL' | 'SLEEPING' | 'SYNCING';

export type GrainType =
  | 'wheat'
  | 'rice'
  | 'corn'
  | 'barley'
  | 'soybean'
  | 'sorghum'
  | 'oats'
  | 'millet'
  | 'other';

export interface Reading {
  id: string;
  deviceId: string;
  grainType: GrainType;
  moisture: number;
  temperature: number;
  battery: number;
  timestamp: number; // epoch ms
  signal: number; // 0–100 RSSI quality
  deviceStatus: DeviceState;
}

export interface DeviceInfo {
  id: string;
  name: string;
  firmware: string;
  platform: string;
  grainType: GrainType;
  battery: number;
  signal: number;
}

/* ─── Mochi Decision Engine Output ─── */
export type TrendDirection = 'stable' | 'rising' | 'falling' | 'spike' | 'drop';

export interface MochiDecision {
  state: RiskTheme;
  severity: number; // 0–100
  ruleId: string;
  messageId: string;
  message: string;
  action: string;
  reasonCodes: string[];
  secondaryObservations: string[];
  trend: TrendDirection;
  confidence: number; // 0–1
  variables: Record<string, number | string>;
}

export interface HistoryEntry {
  reading: Reading;
  decision: MochiDecision;
}

/* ─── Discover / Content ─── */
export interface DiscoverVideo {
  id: string;
  title: string;
  source: string;
  thumbnail: string;
  url: string;
  why: string;
  tags: string[];
}

/* ─── Settings ─── */
export interface GrainThresholds {
  safe: number;
  warn: number;
  critical: number;
  tempSafe: number;
  tempWarn: number;
  tempCritical: number;
}

export type AccentColor = 'orange' | 'green' | 'purple' | 'blue' | 'teal';

export type AppTheme = 'dark' | 'light';

export interface AppSettings {
  autoReconnect: boolean;
  pushAlerts: boolean;
  autoSync: boolean;
  grainType: GrainType;
  thresholds: GrainThresholds;
  historyRetention: number; // days
  wakeOnConnect: boolean;
  accentColor: AccentColor;
  theme: AppTheme;
  language: string; // AppLanguage code
  glassOpacity: number; // 0.3–1.0, controls glassmorphism blur intensity
}

export const DEFAULT_THRESHOLDS: GrainThresholds = {
  safe: 13,
  warn: 15,
  critical: 17,
  tempSafe: 30,
  tempWarn: 33,
  tempCritical: 36,
};

/* ── Grain-specific calibration profiles ── */
export const GRAIN_PROFILES: Record<GrainType, GrainThresholds> = {
  wheat:   { safe: 13.0, warn: 15.0, critical: 17.0, tempSafe: 30, tempWarn: 33, tempCritical: 36 },
  rice:    { safe: 13.5, warn: 15.5, critical: 17.5, tempSafe: 28, tempWarn: 31, tempCritical: 34 },
  corn:    { safe: 14.0, warn: 15.5, critical: 18.0, tempSafe: 28, tempWarn: 32, tempCritical: 35 },
  barley:  { safe: 13.0, warn: 14.5, critical: 16.5, tempSafe: 29, tempWarn: 32, tempCritical: 35 },
  soybean: { safe: 12.0, warn: 14.0, critical: 16.0, tempSafe: 28, tempWarn: 31, tempCritical: 34 },
  sorghum: { safe: 12.5, warn: 14.0, critical: 16.0, tempSafe: 29, tempWarn: 32, tempCritical: 35 },
  oats:    { safe: 13.0, warn: 14.5, critical: 16.5, tempSafe: 28, tempWarn: 31, tempCritical: 34 },
  millet:  { safe: 12.0, warn: 13.5, critical: 15.5, tempSafe: 29, tempWarn: 32, tempCritical: 35 },
  other:   { safe: 13.0, warn: 15.0, critical: 17.0, tempSafe: 30, tempWarn: 33, tempCritical: 36 },
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoReconnect: true,
  pushAlerts: true,
  autoSync: true,
  grainType: 'wheat',
  thresholds: GRAIN_PROFILES.wheat,
  historyRetention: 90,
  wakeOnConnect: true,
  accentColor: 'orange',
  theme: 'dark',
  language: 'en',
  glassOpacity: 0.75,
};

/* Grain label map */
export const GRAIN_LABELS: Record<GrainType, string> = {
  wheat: 'Wheat',
  rice: 'Rice',
  corn: 'Corn',
  barley: 'Barley',
  soybean: 'Soybean',
  sorghum: 'Sorghum',
  oats: 'Oats',
  millet: 'Millet',
  other: 'Other',
};
