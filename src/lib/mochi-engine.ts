/* ═══════════════════════════════════════════════════════════════
   MOCHI DECISION ENGINE v2.0
   Full rule-based expert system with:
   - History analysis (dedup, gap detection, stability windows)
   - Trend detection (stable/rising/falling/rapid)
   - Risk evaluation (moisture + temperature + trend escalation)
   - Rule selection with recovery detection
   - Cooldown management (suppresses repeated alerts)
   - Confidence scoring
   ═══════════════════════════════════════════════════════════════ */

import type {
  Reading,
  GrainThresholds,
  TrendDirection,
  MochiDecision,
  EngineState,
  MochiExpression,
  RiskTheme,
  StatusBadge,
} from './grain-types';
import { STATE, EXPRESSION, PRIORITY, TREND, stateToRiskTheme } from './grain-types';

/* ═══════════════════════════════════════════════════════════════
   ENGINE SETTINGS (defaults)
   ═══════════════════════════════════════════════════════════════ */

export interface EngineSettings {
  stabilityWindowHours: number;
  moistureTolerance: number;
  temperatureTolerance: number;
  rapidChangeThreshold: number;
  messageCooldownMs: number;
  staleThresholdMs: number;
  historyGapThresholdMs: number;
}

const DEFAULT_ENGINE_SETTINGS: EngineSettings = {
  stabilityWindowHours: 72,
  moistureTolerance: 0.5,
  temperatureTolerance: 1.0,
  rapidChangeThreshold: 1.5,
  messageCooldownMs: 1800000,
  staleThresholdMs: 3600000,
  historyGapThresholdMs: 6 * 3600 * 1000,
};

/* ═══════════════════════════════════════════════════════════════
   GRAIN PROFILES — risk thresholds mapped to engine
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
   ═══════════════════════════════════════════════════════════════ */

interface TrendResult {
  trend: TrendDirection;
  moistureChange: number | null;
  tempChange: number | null;
}

function analyzeTrend(
  current: Reading,
  previous: Reading | null,
  settings: EngineSettings,
): TrendResult {
  if (!current || !previous || current.moisture == null || previous.moisture == null) {
    return { trend: TREND.INSUFFICIENT_DATA, moistureChange: null, tempChange: null };
  }

  const moistureChange = current.moisture - previous.moisture;
  const tempChange =
    current.temperature != null && previous.temperature != null
      ? current.temperature - previous.temperature
      : null;

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

  return { trend, moistureChange, tempChange };
}

/* ═══════════════════════════════════════════════════════════════
   2. HISTORY ANALYZER
   ═══════════════════════════════════════════════════════════════ */

interface HistoryAnalysis {
  trend: TrendDirection;
  isStableWindow: boolean;
  gaps: { from: number; to: number }[];
  duplicatesRemoved: number;
  previousReading: Reading | null;
  recentReadingsCount: number;
  moistureChange: number | null;
  tempChange: number | null;
}

function analyzeHistory(
  history: Reading[],
  currentReading: Reading | null,
  settings: EngineSettings,
): HistoryAnalysis {
  if (!history || history.length === 0) {
    return {
      trend: TREND.INSUFFICIENT_DATA,
      isStableWindow: false,
      gaps: [],
      duplicatesRemoved: 0,
      previousReading: null,
      recentReadingsCount: 0,
      moistureChange: null,
      tempChange: null,
    };
  }

  // Dedup by timestamp
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

  // Sort chronologically
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

  // Stability window check
  const windowMs = settings.stabilityWindowHours * 3600 * 1000;
  const windowStart = Date.now() - windowMs;
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

  // Trend between last two readings
  const current = deduped[deduped.length - 1];
  const previous = deduped.length > 1 ? deduped[deduped.length - 2] : null;
  const trendData = analyzeTrend(current, previous, settings);

  return {
    ...trendData,
    isStableWindow,
    gaps,
    duplicatesRemoved: duplicates,
    previousReading: previous,
    recentReadingsCount: recentReadings.length,
  };
}

/* ═══════════════════════════════════════════════════════════════
   3. RISK EVALUATOR
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
  let severity = PRIORITY.SAFE;

  // Moisture evaluation
  if (moisture > profile.moisture.criticalAbove) {
    state = STATE.CRITICAL;
    severity = PRIORITY.CRITICAL;
    reasonCodes.push('MOISTURE_ABOVE_LIMIT');
  } else if (moisture > profile.moisture.warningMax) {
    if (state !== STATE.CRITICAL) {
      state = STATE.WARNING;
      severity = PRIORITY.WARNING;
    }
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

  // Trend escalation
  if (historyAnalysis.trend === TREND.RISING_RAPIDLY) {
    reasonCodes.push('MOISTURE_RISING_RAPIDLY');
    if (state === STATE.MONITOR) {
      state = STATE.WARNING;
      severity = PRIORITY.WARNING;
    }
  } else if (historyAnalysis.trend === TREND.RISING) {
    reasonCodes.push('MOISTURE_RISING');
  } else if (
    historyAnalysis.trend === TREND.STABLE &&
    historyAnalysis.isStableWindow
  ) {
    reasonCodes.push('STABLE_WINDOW_CONFIRMED');
  }

  return { state, severity, reasonCodes, profile };
}

/* ═══════════════════════════════════════════════════════════════
   4. RULE EVALUATOR
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
  prevEngineState: { state: string } | null,
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

  // Recovery: previous was warning/critical, now safe
  if (
    prevEngineState &&
    [STATE.WARNING, STATE.CRITICAL].includes(prevEngineState.state as EngineState) &&
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
  } else if (historyAnalysis.isStableWindow) {
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
   5. COOLDOWN MANAGER
   ═══════════════════════════════════════════════════════════════ */

interface CooldownState {
  ruleId: string;
  state: string;
  timestamp: number;
}

function createCooldownManager(): {
  shouldSuppress: (ruleId: string) => boolean;
  updateCooldown: (ruleId: string, engineState: string) => void;
  getState: () => CooldownState;
} {
  let state: CooldownState = { ruleId: '', state: '', timestamp: 0 };

  return {
    shouldSuppress(ruleId: string): boolean {
      if (state.ruleId === ruleId) {
        const cooldownMs = DEFAULT_ENGINE_SETTINGS.messageCooldownMs;
        if (Date.now() - state.timestamp < cooldownMs) {
          return true;
        }
      }
      return false;
    },
    updateCooldown(ruleId: string, engineState: string) {
      state = { ruleId, state: engineState, timestamp: Date.now() };
    },
    getState() {
      return state;
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   6. MESSAGE RESOLVER
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
   ═══════════════════════════════════════════════════════════════ */

// Module-level cooldown state persists across calls within the same session
const cooldownManager = createCooldownManager();

export function evaluate(
  reading: Reading,
  recentHistory: Reading[],
  thresholds: GrainThresholds,
): MochiDecision {
  const settings: EngineSettings = { ...DEFAULT_ENGINE_SETTINGS };
  const prevEngineState = cooldownManager.getState();

  // 1. Validate input
  if (
    !reading ||
    reading.moisture == null ||
    isNaN(reading.moisture) ||
    reading.moisture < 0
  ) {
    return buildInvalidResponse(reading, thresholds, settings, prevEngineState, 'INVALID_MOISTURE');
  }
  if (
    reading.temperature == null ||
    isNaN(reading.temperature) ||
    reading.temperature < -20
  ) {
    return buildInvalidResponse(reading, thresholds, settings, prevEngineState, 'INVALID_TEMPERATURE');
  }

  // Check stale data
  const isStale = reading.timestamp
    ? Date.now() - reading.timestamp > settings.staleThresholdMs
    : false;
  if (isStale) {
    return buildInvalidResponse(reading, thresholds, settings, prevEngineState, 'STALE_READING', true);
  }

  // 2. Analyze history
  const historyAnalysis = analyzeHistory(recentHistory, reading, settings);

  // 3. Evaluate risk
  const risk = evaluateRisk(reading, historyAnalysis, thresholds, settings);

  // 4. Select grain rule (includes recovery check)
  const grainRule = selectGrainRule(risk, historyAnalysis, prevEngineState);

  // 5. Build response
  return buildResponse(
    grainRule,
    reading,
    historyAnalysis,
    risk,
    settings,
    prevEngineState,
    isStale,
  );
}

function buildInvalidResponse(
  reading: Reading,
  thresholds: GrainThresholds,
  settings: EngineSettings,
  prevEngineState: CooldownState,
  reasonCode: string,
  isStale = false,
): MochiDecision {
  return {
    state: STATE.INVALID,
    severity: PRIORITY.INVALID,
    ruleId: 'INVALID_READING',
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
    variables: {
      moisture: reading?.moisture ?? 0,
      temperature: reading?.temperature ?? 0,
      battery: reading?.battery ?? 0,
      grainType: reading?.grainType ?? 'wheat',
    },
    debug: {
      triggeredRules: [isStale ? 'STALE_READING' : 'INVALID_READING'],
      selectedRule: isStale ? 'STALE_READING' : 'INVALID_READING',
    },
  };
}

function buildResponse(
  selectedRule: SelectedRule,
  reading: Reading,
  historyAnalysis: HistoryAnalysis,
  risk: RiskAssessment,
  settings: EngineSettings,
  prevEngineState: CooldownState,
  isStale: boolean,
): MochiDecision {
  // Cooldown check
  const suppressed = cooldownManager.shouldSuppress(selectedRule.ruleId);
  const bypassCooldown =
    selectedRule.ruleId === 'RECOVERY' ||
    selectedRule.ruleId === 'CRITICAL_CONDITION' ||
    selectedRule.state === STATE.CRITICAL;

  const msg = resolveMessage(selectedRule.messageId);

  if (!suppressed || bypassCooldown) {
    cooldownManager.updateCooldown(selectedRule.ruleId, selectedRule.state);
  }

  // Confidence
  const hasGaps = historyAnalysis.gaps.length > 0;
  const confidence:
    | 'high'
    | 'medium'
    | 'low' =
    historyAnalysis.recentReadingsCount >= 3 && !isStale && !hasGaps
      ? 'high'
      : historyAnalysis.recentReadingsCount > 0
        ? 'medium'
        : 'low';

  // Secondary observations
  const secondaryObservations: string[] = [];
  if (reading.battery < 20) secondaryObservations.push('obs.low_battery');
  if (reading.signal < 30) secondaryObservations.push('obs.weak_signal');

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
