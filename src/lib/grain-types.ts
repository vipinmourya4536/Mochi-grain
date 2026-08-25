/* ─── Grain Monitor – Core Type Definitions ─── */

export type DeviceState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'sleeping'
  | 'low-battery'
  | 'awake';

/* ─── Mochi Engine States ─── */
export const STATE = {
  SAFE: 'safe',
  MONITOR: 'monitor',
  WARNING: 'warning',
  CRITICAL: 'critical',
  INSUFFICIENT_DATA: 'insufficient_data',
  IDLE: 'idle',
  RECOVERY: 'recovery',
  INVALID: 'invalid',
  DISCONNECTED: 'disconnected',
  SLEEPING: 'sleeping',
  SYNCING: 'syncing',
} as const;
export type EngineState = (typeof STATE)[keyof typeof STATE];

/* ─── Mochi Expressions (Mochi face) ─── */
export const EXPRESSION = {
  SAFE: 'safe',
  CONCERNED: 'concerned',
  CRITICAL: 'critical',
  THINKING: 'thinking',
  SUCCESS: 'success',
  CONNECTED: 'connected',
  SLEEPING: 'sleeping',
} as const;
export type MochiExpression = (typeof EXPRESSION)[keyof typeof EXPRESSION];

/* ─── Priority Levels ─── */
export const PRIORITY = {
  IDLE: 0,
  INSUFFICIENT_DATA: 5,
  SAFE: 10,
  MONITOR: 40,
  WARNING: 60,
  CRITICAL: 80,
  INVALID: 90,
  SYNCING_SLEEPING_LOW_BATT: 70,
} as const;

/* ─── Trend Directions ─── */
export const TREND = {
  STABLE: 'stable',
  RISING: 'rising',
  RISING_RAPIDLY: 'rising_rapidly',
  FALLING: 'falling',
  FALLING_RAPIDLY: 'falling_rapidly',
  INSUFFICIENT_DATA: 'insufficient_data',
} as const;
export type TrendDirection = (typeof TREND)[keyof typeof TREND];

/* ─── Legacy compat: RiskTheme used for CSS theming ─── */
export type RiskTheme = 'safe' | 'warn' | 'critical' | 'monitor';

/* Map engine state → risk theme for CSS */
export function stateToRiskTheme(state: EngineState): RiskTheme {
  if (state === STATE.CRITICAL || state === STATE.INVALID) return 'critical';
  if (state === STATE.WARNING) return 'warn';
  if (state === STATE.MONITOR) return 'monitor';
  return 'safe';
}

/* ─── Status Badge ─── */
export type StatusBadge =
  | 'STABLE'
  | 'RISING'
  | 'WARNING'
  | 'CRITICAL'
  | 'MONITOR'
  | 'RECOVERY'
  | 'SLEEPING'
  | 'SYNCING'
  | 'LEARNING'
  | 'IDLE'
  | 'OFFLINE';

/* ─── Grain Types ─── */
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
export interface MochiDecision {
  state: EngineState;
  severity: number; // 0–100
  ruleId: string;
  messageId: string;
  message: string;       // English fallback (for stored history)
  action: string;       // English fallback (for stored history)
  messageKey: string;   // i18n translation key
  actionKey: string;    // i18n translation key
  reasonCodes: string[];
  secondaryObservations: string[];
  trend: TrendDirection;
  expression: MochiExpression;
  confidence: 'high' | 'medium' | 'low';
  variables: Record<string, number | string>;
  /* Engine debug */
  debug?: {
    triggeredRules: string[];
    selectedRule: string;
    historySummary?: {
      trend: TrendDirection;
      isStableWindow: boolean;
      gaps: { from: string; to: string }[];
      duplicatesRemoved: number;
      recentReadingsCount: number;
    };
    riskAssessment?: {
      state: EngineState;
      severity: number;
      reasonCodes: string[];
    };
  };
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
