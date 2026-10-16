/* ═══════════════════════════════════════════════════════════════
   MOCHI DECISION ENGINE v2.1  (ENGINE_VERSION = '2.1.0')
   Deterministic, offline-first rule system.
   ─────────────────────────────────────────────────────────────
   v2.1 formalization contract:
   1. DETERMINISTIC — evaluate() is a pure function of
      (reading, history, thresholds, options). No hidden module
      state: the notification cooldown / previous-state memory is
      INJECTED via options.cooldown and returned via
      decision.cooldown so any caller (web client, Android
      background service, tests) can own and persist it.
   2. INJECTABLE CLOCK — options.now replaces Date.now() so
      staleness and stability windows are reproducible in tests.
   3. INPUT VALIDATION — readings are classified as
      missing / malformed / implausible / stale before any risk
      logic runs. Invalid readings are NEVER classified safe.
   4. TREND GUARDS — trend escalation requires a minimum time
      interval between readings (rapid successive packets never
      escalate risk) and is suppressed across data gaps.
   5. THRESHOLD SAFETY — user thresholds are defensively
      normalized (safe < warn < critical) without inventing
      values; the settings UI enforces the same ordering.
   6. SEPARATION OF CONCERNS — risk classification is never
      influenced by cooldown state; cooldown only gates the
      decision.alertSuppressed flag (notification dedup).

   The engine classifies supplied measurements. It does not
   improve the sensor's physical accuracy, and its thresholds
   come from the documented grain profiles — not universal
   scientific truth.
   ═══════════════════════════════════════════════════════════════ */

import type {
  Reading,
  GrainThresholds,
  TrendDirection,
  MochiDecision,
  EngineState,
  EngineCooldownState,
  MochiExpression,
  StatusBadge,
} from './grain-types';
import { STATE, EXPRESSION, PRIORITY, TREND, stateToRiskTheme } from './grain-types';

/** Engine version — distinct from the overall "Mochi Grain 2.0" app version. */
export const ENGINE_VERSION = '2.1.0';

/* ═══════════════════════════════════════════════════════════════
   ENGINE SETTINGS (defaults — all injectable via options.settings)
   ═══════════════════════════════════════════════════════════════ */

export interface EngineSettings {
  /** Window (hours) verified to confirm a stable storage condition */
  stabilityWindowHours: number;
  /** Moisture jitter (pp) treated as noise within the stability window */
  moistureTolerance: number;
  /** Temperature jitter (°C) treated as noise within the stability window */
  temperatureTolerance: number;
  /** Moisture change (pp) between consecutive readings that counts as rapid */
  rapidChangeThreshold: number;
  /** Minimum interval (ms) between two readings for trend logic to run.
   *  Prevents escalation when packets arrive in rapid succession. */
  minTrendIntervalMs: number;
  /** Notification cooldown (ms) for repeated alerts of the same rule */
  messageCooldownMs: number;
  /** A reading older than this (ms, vs now) is stale */
  staleThresholdMs: number;
  /** A history gap larger than this (ms) breaks trend continuity */
  historyGapThresholdMs: number;
}

export const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  stabilityWindowHours: 72,
  moistureTolerance: 0.5,
  temperatureTolerance: 1.0,
  rapidChangeThreshold: 1.5,
  minTrendIntervalMs: 10 * 60 * 1000,
  messageCooldownMs: 1800000,
  staleThresholdMs: 3600000,
  historyGapThresholdMs: 6 * 3600 * 1000,
};

/** Cooldown / transition memory injected by the caller and persisted by it.
 *  Empty state ⇒ no suppression and no recovery detection (pure evaluation). */
export type CooldownState = EngineCooldownState;

export const EMPTY_COOLDOWN: CooldownState = { ruleId: '', state: '', timestamp: 0 };

export interface EvaluateOptions {
  /** Deterministic clock (epoch ms). Defaults to Date.now(). */
  now?: number;
  /** Overrides for engine tuning knobs. */
  settings?: Partial<EngineSettings>;
  /** Caller-owned cooldown / previous-decision memory. Defaults to empty. */
  cooldown?: CooldownState | null;
}

/* ═══════════════════════════════════════════════════════════════
   INPUT VALIDATION CLASSES
   Sensor values are classified BEFORE any risk logic. An invalid
   reading always resolves to STATE.INVALID (never SAFE).
   ═══════════════════════════════════════════════════════════════ */

/** Physical plausibility domain for the GRAIN-01 probe */
export const MOISTURE_DOMAIN = { min: 0, max: 100 } as const;   // volumetric %
export const TEMPERATURE_DOMAIN = { min: -20, max: 85 } as const; // probe electronics range

export type InvalidReason =
  | 'MISSING_MOISTURE'
  | 'MALFORMED_MOISTURE'
  | 'IMPLAUSIBLE_MOISTURE'
  | 'MISSING_TEMPERATURE'
  | 'MALFORMED_TEMPERATURE'
  | 'IMPLAUSIBLE_TEMPERATURE'
  | 'STALE_READING';

export interface InputValidation {
  ok: boolean;
  reason?: InvalidReason;
}

export function validateReading(reading: Reading | null | undefined, now: number, settings: EngineSettings): InputValidation {
  if (!reading) return { ok: false, reason: 'MISSING_MOISTURE' };

  const m = reading.moisture as unknown;
  if (m == null) return { ok: false, reason: 'MISSING_MOISTURE' };
  if (typeof m !== 'number' || !Number.isFinite(m)) return { ok: false, reason: 'MALFORMED_MOISTURE' };
  if (m < MOISTURE_DOMAIN.min || m > MOISTURE_DOMAIN.max) return { ok: false, reason: 'IMPLAUSIBLE_MOISTURE' };

  const t = reading.temperature as unknown;
  if (t == null) return { ok: false, reason: 'MISSING_TEMPERATURE' };
  if (typeof t !== 'number' || !Number.isFinite(t)) return { ok: false, reason: 'MALFORMED_TEMPERATURE' };
  if (t < TEMPERATURE_DOMAIN.min || t > TEMPERATURE_DOMAIN.max) return { ok: false, reason: 'IMPLAUSIBLE_TEMPERATURE' };

  if (reading.timestamp && now - reading.timestamp > settings.staleThresholdMs) {
    return { ok: false, reason: 'STALE_READING' };
  }
  return { ok: true };
}

/* ═══════════════════════════════════════════════════════════════
   THRESHOLD NORMALIZATION — defensive ordering (safe < warn < critical)
   The Settings UI enforces ordering at edit time; this is the engine's
   last line of defense against legacy/imports. Values are only pulled
   DOWN/UP to restore ordering — calibrated profile defaults are never
   rewritten here.
   ═══════════════════════════════════════════════════════════════ */

export const THRESHOLD_MIN_GAP = 0.5;

export function normalizeThresholds(t: GrainThresholds): GrainThresholds {
  const safe = Number.isFinite(t.safe) ? t.safe : 13;
  let warn = Number.isFinite(t.warn) ? t.warn : safe + THRESHOLD_MIN_GAP;
  let critical = Number.isFinite(t.critical) ? t.critical : warn + THRESHOLD_MIN_GAP;
  if (warn <= safe) warn = safe + THRESHOLD_MIN_GAP;
  if (critical <= warn) critical = warn + THRESHOLD_MIN_GAP;

  const tempSafe = Number.isFinite(t.tempSafe) ? t.tempSafe : 30;
  let tempWarn = Number.isFinite(t.tempWarn) ? t.tempWarn : tempSafe + THRESHOLD_MIN_GAP;
  let tempCritical = Number.isFinite(t.tempCritical) ? t.tempCritical : tempWarn + THRESHOLD_MIN_GAP;
  if (tempWarn <= tempSafe) tempWarn = tempSafe + THRESHOLD_MIN_GAP;
  if (tempCritical <= tempWarn) tempCritical = tempWarn + THRESHOLD_MIN_GAP;

  return { safe, warn, critical, tempSafe, tempWarn, tempCritical };
}

/* ═══════════════════════════════════════════════════════════════
   GRAIN PROFILE MAPPING
   ═══════════════════════════════════════════════════════════════ */

interface GrainProfileRisk {
  moisture: { criticalAbove: number; warningMax: number; monitorMax: number };
  temperature: { highAbove: number; warmAbove: number };
}

function thresholdsToProfile(t: GrainThresholds): GrainProfileRisk {
  return {
    moisture: {
      criticalAbove: t.critical,
      warningMax: t.warn,
      monitorMax: t.safe + (t.warn - t.safe) * 0.5,
    },
    temperature: {
      highAbove: t.tempCritical,
      warmAbove: t.tempWarn,
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   1. TREND ANALYZER
   Time-aware: consecutive readings closer than minTrendIntervalMs
   never produce an escalating trend (rapid packet bursts are noise,
   not storage dynamics); intervals beyond historyGapThresholdMs are
   treated as insufficient data (a trend across a gap is meaningless).
   ═══════════════════════════════════════════════════════════════ */

interface TrendResult {
  trend: TrendDirection;
  moistureChange: number | null;
  tempChange: number | null;
  /** Why trend evaluation was degraded, for reason codes / debug */
  trendNote: 'ok' | 'interval_too_short' | 'gap_too_long' | 'no_previous';
}

function analyzeTrend(
  current: Reading,
  previous: Reading | null,
  settings: EngineSettings,
): TrendResult {
  if (!previous || current.moisture == null || previous.moisture == null) {
    return { trend: TREND.INSUFFICIENT_DATA, moistureChange: null, tempChange: null, trendNote: 'no_previous' };
  }

  const moistureChange = current.moisture - previous.moisture;
  const tempChange =
    current.temperature != null && previous.temperature != null
      ? current.temperature - previous.temperature
      : null;

  // Data-driven guard — deterministic (no clock involved)
  const interval = current.timestamp - previous.timestamp;
  if (interval < settings.minTrendIntervalMs) {
    return { trend: TREND.STABLE, moistureChange, tempChange, trendNote: 'interval_too_short' };
  }
  if (interval > settings.historyGapThresholdMs) {
    return { trend: TREND.INSUFFICIENT_DATA, moistureChange, tempChange, trendNote: 'gap_too_long' };
  }

  const absDelta = Math.abs(moistureChange);
  const tolerance = settings.moistureTolerance;
  const rapidThreshold = settings.rapidChangeThreshold;

  let trend: TrendDirection = TREND.STABLE;
  if (absDelta > tolerance) {
    if (moistureChange > 0) {
      trend = absDelta >= rapidThreshold ? TREND.RISING_RAPIDLY : TREND.RISING;
    } else {
      trend = absDelta >= rapidThreshold ? TREND.FALLING_RAPIDLY : TREND.FALLING;
    }
  }

  return { trend, moistureChange, tempChange, trendNote: 'ok' };
}

/* ═══════════════════════════════════════════════════════════════
   2. HISTORY ANALYZER
   Handles duplicates (same timestamp), out-of-order input (chronological
   sort), gapped series (gap list) and the stability window (relative to
   the injected `now`, never a live clock).
   ═══════════════════════════════════════════════════════════════ */

interface HistoryAnalysis {
  trend: TrendDirection;
  trendNote: TrendResult['trendNote'];
  isStableWindow: boolean;
  gaps: { from: number; to: number }[];
  duplicatesRemoved: number;
  outOfOrderCount: number;
  previousReading: Reading | null;
  recentReadingsCount: number;
  moistureChange: number | null;
  tempChange: number | null;
}

function analyzeHistory(
  history: Reading[],
  currentReading: Reading | null,
  settings: EngineSettings,
  now: number,
): HistoryAnalysis {
  const empty: HistoryAnalysis = {
    trend: TREND.INSUFFICIENT_DATA,
    trendNote: 'no_previous',
    isStableWindow: false,
    gaps: [],
    duplicatesRemoved: 0,
    outOfOrderCount: 0,
    previousReading: null,
    recentReadingsCount: 0,
    moistureChange: null,
    tempChange: null,
  };
  if (!history || history.length === 0) return empty;

  // Dedup by timestamp (retransmitted packets must not inflate the series)
  const seen = new Set<number>();
  const deduped: Reading[] = [];
  let duplicates = 0;

  const allReadings =
    currentReading && currentReading.timestamp
      ? [...history, currentReading]
      : [...history];

  for (const r of allReadings) {
    if (r && r.timestamp) {
      if (seen.has(r.timestamp)) {
        duplicates++;
      } else {
        seen.add(r.timestamp);
        deduped.push(r);
      }
    }
  }

  // Out-of-order tolerance: count inversions before sorting (diagnostic),
  // then sort chronologically so trend math is always time-consistent.
  let outOfOrder = 0;
  for (let i = 1; i < deduped.length; i++) {
    if (deduped[i].timestamp < deduped[i - 1].timestamp) outOfOrder++;
  }
  deduped.sort((a, b) => a.timestamp - b.timestamp);

  // Gap detection
  const gapThresholdMs = settings.historyGapThresholdMs;
  const gaps: { from: number; to: number }[] = [];
  for (let i = 1; i < deduped.length; i++) {
    const diff = deduped[i].timestamp - deduped[i - 1].timestamp;
    if (diff > gapThresholdMs) {
      gaps.push({ from: deduped[i - 1].timestamp, to: deduped[i].timestamp });
    }
  }

  // Stability window — anchored to the injected `now` (deterministic)
  const windowMs = settings.stabilityWindowHours * 3600 * 1000;
  const windowStart = now - windowMs;
  const recentReadings = deduped.filter((r) => r.timestamp >= windowStart);

  let isStableWindow = false;
  if (recentReadings.length >= 3 && gaps.length === 0) {
    const moistures = recentReadings.map((r) => r.moisture).filter((m) => m != null);
    const temps = recentReadings.map((r) => r.temperature).filter((t) => t != null);

    if (
      moistures.length === recentReadings.length &&
      temps.length === recentReadings.length
    ) {
      const mVar = Math.max(...moistures) - Math.min(...moistures);
      const tVar = Math.max(...temps) - Math.min(...temps);

      if (mVar <= settings.moistureTolerance && tVar <= settings.temperatureTolerance) {
        isStableWindow = true;
      }
    }
  }

  // Trend between the last two chronological readings
  const current = deduped[deduped.length - 1];
  const previous = deduped.length > 1 ? deduped[deduped.length - 2] : null;
  const trendData = analyzeTrend(current, previous, settings);

  return {
    ...trendData,
    isStableWindow,
    gaps,
    duplicatesRemoved: duplicates,
    outOfOrderCount: outOfOrder,
    previousReading: previous,
    recentReadingsCount: recentReadings.length,
  };
}

/* ═══════════════════════════════════════════════════════════════
   3. RISK EVALUATOR — classification ONLY (never cooldown-aware)
   ═══════════════════════════════════════════════════════════════ */

interface RiskAssessment {
  state: EngineState;
  severity: number;
  reasonCodes: string[];
  profile: GrainProfileRisk;
}

function evaluateRisk(
  reading: Reading,
  historyAnalysis: HistoryAnalysis,
  thresholds: GrainThresholds,
  settings: EngineSettings,
): RiskAssessment {
  const profile = thresholdsToProfile(thresholds);
  const { moisture, temperature } = reading;
  const reasonCodes: string[] = [];
  let state: EngineState = STATE.SAFE;
  let severity: number = PRIORITY.SAFE;

  // Moisture evaluation
  if (moisture > profile.moisture.criticalAbove) {
    state = STATE.CRITICAL;
    severity = PRIORITY.CRITICAL;
    reasonCodes.push('MOISTURE_ABOVE_LIMIT');
  } else if (moisture > profile.moisture.warningMax) {
    state = STATE.WARNING;
    severity = PRIORITY.WARNING;
    reasonCodes.push('MOISTURE_ABOVE_LIMIT');
  } else if (moisture > profile.moisture.monitorMax) {
    if (state === STATE.SAFE) {
      state = STATE.MONITOR;
      severity = PRIORITY.MONITOR;
    }
    reasonCodes.push('MOISTURE_NEAR_LIMIT');
  } else {
    reasonCodes.push('MOISTURE_WITHIN_SAFE_RANGE');
  }

  // Temperature evaluation (can escalate state)
  if (temperature > profile.temperature.highAbove) {
    if (state !== STATE.CRITICAL) {
      state = STATE.WARNING;
      severity = Math.max(severity, PRIORITY.WARNING);
    }
    reasonCodes.push('TEMPERATURE_HIGH');
  } else if (temperature > profile.temperature.warmAbove) {
    if (state === STATE.SAFE) {
      state = STATE.MONITOR;
      severity = Math.max(severity, PRIORITY.MONITOR);
    }
    reasonCodes.push('TEMPERATURE_WARM');
  }

  // Trend escalation — only from qualified intervals (see analyzeTrend)
  if (historyAnalysis.trend === TREND.RISING_RAPIDLY) {
    reasonCodes.push('MOISTURE_RISING_RAPIDLY');
    if (state === STATE.MONITOR) {
      state = STATE.WARNING;
      severity = PRIORITY.WARNING;
    }
  } else if (historyAnalysis.trend === TREND.RISING) {
    reasonCodes.push('MOISTURE_RISING');
  } else if (historyAnalysis.trendNote === 'interval_too_short') {
    reasonCodes.push('TREND_INTERVAL_TOO_SHORT');
  } else if (historyAnalysis.trendNote === 'gap_too_long') {
    reasonCodes.push('TREND_GAP_TOO_LONG');
  } else if (
    historyAnalysis.trend === TREND.STABLE &&
    historyAnalysis.trendNote === 'ok' &&
    historyAnalysis.isStableWindow
  ) {
    reasonCodes.push('STABLE_WINDOW_CONFIRMED');
  }

  return { state, severity, reasonCodes, profile };
}

/* ═══════════════════════════════════════════════════════════════
   4. RULE EVALUATOR — stable rule IDs + reason codes
   ═══════════════════════════════════════════════════════════════ */

interface SelectedRule {
  state: EngineState;
  priority: number;
  expression: MochiExpression;
  ruleId: string;
  messageId: string;
  reasonCodes: string[];
  action: string;
}

function selectGrainRule(
  risk: RiskAssessment,
  historyAnalysis: HistoryAnalysis,
  prevEngineState: CooldownState,
): SelectedRule {
  const baseRule: SelectedRule = {
    state: risk.state,
    priority: 0,
    expression: EXPRESSION.SAFE,
    ruleId: '',
    messageId: '',
    reasonCodes: risk.reasonCodes,
    action: 'monitor',
  };

  // Recovery: previous evaluated state was warning/critical, now safe.
  // Driven by the INJECTED cooldown memory — never by module state.
  const priorCriticalStates: string[] = [STATE.WARNING, STATE.CRITICAL];
  if (
    prevEngineState &&
    priorCriticalStates.includes(prevEngineState.state) &&
    risk.state === STATE.SAFE
  ) {
    return {
      ...baseRule,
      state: STATE.SAFE,
      priority: PRIORITY.SAFE,
      expression: EXPRESSION.SUCCESS,
      ruleId: 'RECOVERY',
      messageId: 'RECOVERY',
      action: 'none',
    };
  }

  if (risk.state === STATE.CRITICAL) {
    baseRule.priority = PRIORITY.CRITICAL;
    baseRule.expression = EXPRESSION.CRITICAL;
    baseRule.ruleId = 'CRITICAL_CONDITION';
    baseRule.messageId = 'CRITICAL_CONDITION';
    baseRule.action = 'dry_grain_immediately';
  } else if (risk.state === STATE.WARNING) {
    const isHighMoistureWarm =
      risk.reasonCodes.includes('MOISTURE_ABOVE_LIMIT') &&
      risk.reasonCodes.includes('TEMPERATURE_WARM');
    baseRule.priority = PRIORITY.WARNING;
    baseRule.expression = EXPRESSION.CONCERNED;
    baseRule.ruleId = isHighMoistureWarm ? 'HIGH_MOISTURE_WARM' : 'WARNING_CONDITION';
    baseRule.messageId = baseRule.ruleId;
    baseRule.action = 'inspect_storage';
  } else if (historyAnalysis.trend === TREND.RISING_RAPIDLY) {
    baseRule.priority = PRIORITY.MONITOR;
    baseRule.expression = EXPRESSION.CONCERNED;
    baseRule.ruleId = 'MOISTURE_RISING_RAPIDLY';
    baseRule.messageId = 'MOISTURE_RISING_RAPIDLY';
  } else if (historyAnalysis.trend === TREND.RISING) {
    baseRule.priority = PRIORITY.MONITOR;
    baseRule.expression = EXPRESSION.THINKING;
    baseRule.ruleId = 'MOISTURE_RISING';
    baseRule.messageId = 'MOISTURE_RISING';
  } else if (risk.state === STATE.MONITOR) {
    baseRule.priority = PRIORITY.MONITOR;
    baseRule.expression = EXPRESSION.THINKING;
    baseRule.ruleId = 'MONITOR_CONDITION';
    baseRule.messageId = 'MONITOR_CONDITION';
  } else if (
    historyAnalysis.trend === TREND.STABLE &&
    historyAnalysis.trendNote === 'ok' &&
    historyAnalysis.isStableWindow
  ) {
    baseRule.priority = PRIORITY.SAFE;
    baseRule.expression = EXPRESSION.SAFE;
    baseRule.ruleId = 'MOISTURE_STABLE';
    baseRule.messageId = 'MOISTURE_STABLE';
    baseRule.action = 'none';
  } else if (risk.state === STATE.SAFE) {
    baseRule.priority = PRIORITY.SAFE;
    baseRule.expression = EXPRESSION.SAFE;
    baseRule.ruleId = 'SAFE_CONDITION';
    baseRule.messageId = 'SAFE_CONDITION';
    baseRule.action = 'none';
  } else if (
    risk.state === STATE.INSUFFICIENT_DATA ||
    historyAnalysis.trend === TREND.INSUFFICIENT_DATA
  ) {
    baseRule.priority = PRIORITY.INSUFFICIENT_DATA;
    baseRule.expression = EXPRESSION.THINKING;
    baseRule.ruleId = 'INSUFFICIENT_DATA';
    baseRule.messageId = 'INSUFFICIENT_DATA';
    baseRule.state = STATE.INSUFFICIENT_DATA;
    baseRule.action = 'collect_data';
  } else {
    baseRule.priority = PRIORITY.IDLE;
    baseRule.expression = EXPRESSION.THINKING;
    baseRule.ruleId = 'IDLE';
    baseRule.messageId = 'IDLE';
    baseRule.state = STATE.IDLE;
  }

  return baseRule;
}

/* ═══════════════════════════════════════════════════════════════
   5. COOLDOWN / NOTIFICATION DEDUP (pure helpers)
   Risk classification never depends on these — they only decide
   whether a NEW alert of the same rule should reach the user.
   The state itself is owned and persisted by the CALLER.
   ═══════════════════════════════════════════════════════════════ */

/** True when an alert for `ruleId` is still inside the cooldown window. */
export function isSuppressed(
  cooldown: CooldownState | null | undefined,
  ruleId: string,
  cooldownMs: number,
  now: number,
): boolean {
  if (!cooldown || !cooldown.ruleId) return false;
  if (cooldown.ruleId !== ruleId) return false;
  return now - cooldown.timestamp < cooldownMs;
}

/* ═══════════════════════════════════════════════════════════════
   6. MESSAGE RESOLVER — stable i18n keys + English fallbacks
   (Stored history keeps the English text; the UI renders via keys.)
   ═══════════════════════════════════════════════════════════════ */

const MESSAGES: Record<string, { en: string; key: string; action: string; actionKey: string }> = {
  SAFE_CONDITION: {
    en: 'All readings within normal range.',
    key: 'engine.safe_condition',
    action: 'Maintain current storage conditions.',
    actionKey: 'engine.safe_action',
  },
  MOISTURE_STABLE: {
    en: 'Conditions are stable. Readings consistent over the monitoring window.',
    key: 'engine.moisture_stable',
    action: 'No action needed. Continue monitoring.',
    actionKey: 'engine.stable_action',
  },
  MONITOR_CONDITION: {
    en: 'Moisture or temperature approaching threshold. Close monitoring recommended.',
    key: 'engine.monitor_condition',
    action: 'Check ventilation. Monitor for changes.',
    actionKey: 'engine.monitor_action',
  },
  WARNING_CONDITION: {
    en: 'Moisture above safe limit. Risk of grain quality degradation.',
    key: 'engine.warning_condition',
    action: 'Inspect storage. Improve ventilation or begin aeration.',
    actionKey: 'engine.warning_action',
  },
  HIGH_MOISTURE_WARM: {
    en: 'High moisture combined with elevated temperature. Spoilage risk increasing.',
    key: 'engine.high_moisture_warm',
    action: 'Act immediately — aerate grain, reduce temperature, inspect for hot spots.',
    actionKey: 'engine.high_moisture_warm_action',
  },
  CRITICAL_CONDITION: {
    en: 'Dangerous moisture and temperature levels detected. Spoilage imminent.',
    key: 'engine.critical_condition',
    action: 'Begin drying immediately. Contact storage facility. Do not delay.',
    actionKey: 'engine.critical_action',
  },
  MOISTURE_RISING: {
    en: 'Moisture is gradually rising. Trend detected in recent readings.',
    key: 'engine.moisture_rising',
    action: 'Monitor closely. Check for moisture sources or leaks.',
    actionKey: 'engine.rising_action',
  },
  MOISTURE_RISING_RAPIDLY: {
    en: 'Moisture rising rapidly. Significant increase detected between readings.',
    key: 'engine.moisture_rising_rapidly',
    action: 'Investigate immediately. Check ventilation, condensation, and grain condition.',
    actionKey: 'engine.rising_rapidly_action',
  },
  RECOVERY: {
    en: 'Storage conditions have returned to safe levels. Improvement detected.',
    key: 'engine.recovery',
    action: 'Conditions improving. Continue current practices.',
    actionKey: 'engine.recovery_action',
  },
  INSUFFICIENT_DATA: {
    en: 'Not enough data for analysis. Collecting readings to establish baseline.',
    key: 'engine.insufficient_data',
    action: 'Keep the probe connected. Analysis will improve with more readings.',
    actionKey: 'engine.insufficient_data_action',
  },
  INVALID_READING: {
    en: 'Sensor reading appears invalid. Check probe connection.',
    key: 'engine.invalid_reading',
    action: 'Verify the probe is properly inserted and connected.',
    actionKey: 'engine.invalid_action',
  },
  STALE_READING: {
    en: 'Data is stale. No recent readings received.',
    key: 'engine.stale_reading',
    action: 'Check probe battery and Bluetooth connection.',
    actionKey: 'engine.stale_action',
  },
  IDLE: {
    en: 'Waiting for readings...',
    key: 'engine.idle',
    action: 'Ensure probe is connected and sending data.',
    actionKey: 'engine.idle_action',
  },
};

function resolveMessage(messageId: string): {
  en: string;
  key: string;
  action: string;
  actionKey: string;
} {
  return (
    MESSAGES[messageId] || {
      en: 'Unknown state.',
      key: 'engine.unknown',
      action: 'Monitor the situation.',
      actionKey: 'engine.unknown_action',
    }
  );
}

/* ═══════════════════════════════════════════════════════════════
   7. PUBLIC API — evaluate()
   Deterministic: same (reading, history, thresholds, options) ⇒
   same decision. No module-level mutable state.
   ═══════════════════════════════════════════════════════════════ */

export function evaluate(
  reading: Reading,
  recentHistory: Reading[],
  thresholds: GrainThresholds,
  options: EvaluateOptions = {},
): MochiDecision {
  const settings: EngineSettings = { ...DEFAULT_ENGINE_SETTINGS, ...options.settings };
  const now = options.now ?? Date.now();
  const prevCooldown: CooldownState = options.cooldown ?? EMPTY_COOLDOWN;
  const safeThresholds = normalizeThresholds(thresholds);

  // 1. Validate input — invalid readings are NEVER classified safe
  const validation = validateReading(reading, now, settings);
  if (!validation.ok) {
    return buildInvalidResponse(reading, safeThresholds, settings, prevCooldown, validation.reason!, now);
  }

  // 2. Analyze history (dedup / order / gaps / stability window vs `now`)
  const historyAnalysis = analyzeHistory(recentHistory, reading, settings, now);

  // 3. Evaluate risk — classification only, cooldown-blind
  const risk = evaluateRisk(reading, historyAnalysis, safeThresholds, settings);

  // 4. Select rule (recovery detection via injected cooldown memory)
  const grainRule = selectGrainRule(risk, historyAnalysis, prevCooldown);

  // 5. Build response (+ notification dedup, returned for caller persistence)
  return buildResponse(
    grainRule,
    reading,
    historyAnalysis,
    risk,
    settings,
    prevCooldown,
    now,
  );
}

function buildInvalidResponse(
  reading: Reading | null,
  thresholds: GrainThresholds,
  settings: EngineSettings,
  prevCooldown: CooldownState,
  reasonCode: InvalidReason,
  now: number,
): MochiDecision {
  const isStale = reasonCode === 'STALE_READING';
  const ruleId = isStale ? 'STALE_READING' : 'INVALID_READING';

  // Cooldown memory: invalid readings refresh the memory so a recovery
  // message only fires once conditions genuinely return to safe.
  const nextCooldown: CooldownState = {
    ruleId,
    state: STATE.INVALID,
    timestamp: now,
  };

  const m = reading?.moisture;
  const t = reading?.temperature;
  return {
    state: STATE.INVALID,
    severity: PRIORITY.INVALID,
    ruleId,
    messageId: isStale ? 'STALE_READING' : 'INVALID_READING',
    message: isStale
      ? 'Data is stale. No recent readings received.'
      : 'Sensor reading appears invalid.',
    action: isStale
      ? 'Check probe battery and Bluetooth connection.'
      : 'Verify the probe is properly inserted.',
    messageKey: isStale ? 'engine.stale_reading' : 'engine.invalid_reading',
    actionKey: isStale ? 'engine.stale_action' : 'engine.invalid_action',
    reasonCodes: [reasonCode],
    secondaryObservations: [],
    trend: TREND.INSUFFICIENT_DATA,
    expression: EXPRESSION.THINKING,
    confidence: 'low',
    alertSuppressed: false,
    cooldown: nextCooldown,
    variables: {
      moisture: typeof m === 'number' && Number.isFinite(m) ? m : 0,
      temperature: typeof t === 'number' && Number.isFinite(t) ? t : 0,
      battery: reading?.battery ?? 0,
      grainType: reading?.grainType ?? 'wheat',
    },
    debug: {
      triggeredRules: [ruleId],
      selectedRule: ruleId,
      riskAssessment: {
        state: STATE.INVALID,
        severity: PRIORITY.INVALID,
        reasonCodes: [reasonCode],
      },
    },
  };
}

function buildResponse(
  selectedRule: SelectedRule,
  reading: Reading,
  historyAnalysis: HistoryAnalysis,
  risk: RiskAssessment,
  settings: EngineSettings,
  prevCooldown: CooldownState,
  now: number,
): MochiDecision {
  // Notification dedup — separate from classification.
  const bypassCooldown =
    selectedRule.ruleId === 'RECOVERY' ||
    selectedRule.ruleId === 'CRITICAL_CONDITION' ||
    selectedRule.state === STATE.CRITICAL;
  const suppressed =
    !bypassCooldown && isSuppressed(prevCooldown, selectedRule.ruleId, settings.messageCooldownMs, now);

  const msg = resolveMessage(selectedRule.messageId);

  // Cooldown memory advances whenever a (non-suppressed) alert would reach
  // the user, so dedup windows anchor to the last DELIVERED alert.
  const nextCooldown: CooldownState = suppressed
    ? prevCooldown
    : { ruleId: selectedRule.ruleId, state: selectedRule.state, timestamp: now };

  // Confidence
  const hasGaps = historyAnalysis.gaps.length > 0;
  const confidence:
    | 'high'
    | 'medium'
    | 'low' =
    historyAnalysis.recentReadingsCount >= 3 && !hasGaps
      ? 'high'
      : historyAnalysis.recentReadingsCount > 0
        ? 'medium'
        : 'low';

  // Secondary observations — real telemetry only, null-safe
  const secondaryObservations: string[] = [];
  if (typeof reading.battery === 'number' && Number.isFinite(reading.battery) && reading.battery < 20) {
    secondaryObservations.push('obs.low_battery');
  }
  if (typeof reading.signal === 'number' && Number.isFinite(reading.signal) && reading.signal < 30) {
    secondaryObservations.push('obs.weak_signal');
  }

  return {
    state: selectedRule.state,
    severity: selectedRule.priority,
    ruleId: selectedRule.ruleId,
    messageId: selectedRule.messageId,
    message: msg.en,
    action: msg.action,
    messageKey: msg.key,
    actionKey: msg.actionKey,
    reasonCodes: selectedRule.reasonCodes,
    secondaryObservations,
    trend: historyAnalysis.trend,
    expression: selectedRule.expression,
    confidence,
    alertSuppressed: suppressed,
    cooldown: nextCooldown,
    variables: {
      moisture: reading.moisture,
      temperature: reading.temperature,
      battery: reading.battery,
      grainType: reading.grainType,
      previousMoisture: historyAnalysis.previousReading?.moisture ?? 0,
      previousTemperature: historyAnalysis.previousReading?.temperature ?? 0,
      moistureChange: historyAnalysis.moistureChange ?? 0,
      temperatureChange: historyAnalysis.tempChange ?? 0,
      trend: historyAnalysis.trend,
      readingsCount: historyAnalysis.recentReadingsCount,
    },
    debug: {
      triggeredRules: [selectedRule.ruleId],
      selectedRule: selectedRule.ruleId,
      historySummary: {
        trend: historyAnalysis.trend,
        isStableWindow: historyAnalysis.isStableWindow,
        gaps: historyAnalysis.gaps.map((g) => ({
          from: new Date(g.from).toISOString(),
          to: new Date(g.to).toISOString(),
        })),
        duplicatesRemoved: historyAnalysis.duplicatesRemoved,
        recentReadingsCount: historyAnalysis.recentReadingsCount,
      },
      riskAssessment: {
        state: risk.state,
        severity: risk.severity,
        reasonCodes: risk.reasonCodes,
      },
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE (for header)
   Device-level states (disconnected/sleeping/syncing) come from the
   device state machine, not from the reading — the engine never
   returns STATE.DISCONNECTED for a measured reading.
   ═══════════════════════════════════════════════════════════════ */

export function getStatusBadge(
  decision: MochiDecision | null,
  deviceState: string,
): StatusBadge {
  if (deviceState === 'sleeping') return 'SLEEPING';
  if (deviceState === 'syncing') return 'SYNCING';
  if (deviceState === 'connecting') return 'OFFLINE';
  if (!decision) return 'OFFLINE';

  switch (decision.state) {
    case STATE.CRITICAL:
    case STATE.INVALID:
      return 'CRITICAL';
    case STATE.WARNING:
      if (
        decision.trend === TREND.RISING ||
        decision.trend === TREND.RISING_RAPIDLY
      )
        return 'RISING';
      return 'WARNING';
    case STATE.MONITOR:
      return 'MONITOR';
    case STATE.RECOVERY:
      return 'RECOVERY';
    case STATE.INSUFFICIENT_DATA:
      return 'LEARNING';
    case STATE.IDLE:
      return 'IDLE';
    case STATE.SAFE:
    default:
      return 'STABLE';
  }
}

/* ═══════════════════════════════════════════════════════════════
   INSIGHT TITLE (for InsightCard header)
   ═══════════════════════════════════════════════════════════════ */

export function getInsightTitle(decision: MochiDecision): string {
  switch (decision.state) {
    case STATE.CRITICAL:
      return 'engine.title_critical';
    case STATE.WARNING:
      return 'engine.title_warning';
    case STATE.MONITOR:
      return 'engine.title_monitor';
    case STATE.RECOVERY:
      return 'engine.title_recovery';
    case STATE.INSUFFICIENT_DATA:
      return 'engine.title_learning';
    case STATE.IDLE:
      return 'engine.title_idle';
    case STATE.INVALID:
      return 'engine.title_invalid';
    case STATE.SAFE:
    default:
      return 'engine.title_safe';
  }
}

/* ═══════════════════════════════════════════════════════════════
   TREND LABEL (for status display)
   ═══════════════════════════════════════════════════════════════ */

export function getTrendLabel(trend: TrendDirection): string {
  switch (trend) {
    case TREND.RISING_RAPIDLY:
      return 'trend.rising_rapidly';
    case TREND.RISING:
      return 'trend.rising';
    case TREND.FALLING_RAPIDLY:
      return 'trend.falling_rapidly';
    case TREND.FALLING:
      return 'trend.falling';
    case TREND.STABLE:
      return 'trend.stable';
    case TREND.INSUFFICIENT_DATA:
    default:
      return 'trend.insufficient_data';
  }
}

/* ═══════════════════════════════════════════════════════════════
   RISK THEME helper re-export (UI contract stability)
   ═══════════════════════════════════════════════════════════════ */

export { stateToRiskTheme };
