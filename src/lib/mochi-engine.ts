/* ═══════════════════════════════════════════════════════════════
   MOCHI DECISION ENGINE v1.0
   Threshold-based grain moisture analysis with trend detection.
   Returns translation keys for i18n support.
   ═══════════════════════════════════════════════════════════════ */

import type {
  Reading,
  GrainThresholds,
  RiskTheme,
  TrendDirection,
  MochiDecision,
} from './grain-types';

/* ── Translation key pools (deterministic by index) ── */
const SAFE_MESSAGE_KEYS = ['mochi.safe_0', 'mochi.safe_1', 'mochi.safe_2'];
const WARN_MESSAGE_KEYS = ['mochi.warn_0', 'mochi.warn_1', 'mochi.warn_2'];
const CRITICAL_MESSAGE_KEYS = ['mochi.critical_0', 'mochi.critical_1', 'mochi.critical_2'];

const SAFE_ACTION_KEYS = ['mochi.safe_action_0', 'mochi.safe_action_1'];
const WARN_ACTION_KEYS = ['mochi.warn_action_0', 'mochi.warn_action_1'];
const CRITICAL_ACTION_KEYS = ['mochi.critical_action_0', 'mochi.critical_action_1'];

function pickByIndex<T>(arr: T[], reading: Reading): T {
  const idx = Math.abs(hashCode(reading.id)) % arr.length;
  return arr[idx];
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function simpleTrend(readings: Reading[]): TrendDirection {
  if (readings.length < 3) return 'stable';
  const recent = readings.slice(-5).map((r) => r.moisture);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  if (Math.abs(diff) < 0.3) return 'stable';
  if (diff > 1.0) return 'spike';
  if (diff > 0) return 'rising';
  if (diff < -1.0) return 'drop';
  return 'falling';
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════ */

export function evaluate(
  reading: Reading,
  recentHistory: Reading[],
  thresholds: GrainThresholds,
): MochiDecision {
  const { moisture, temperature } = reading;
  const trend = simpleTrend(recentHistory);

  // Determine state from thresholds
  let state: RiskTheme = 'safe';
  let reasonCodes: string[] = ['NORMAL'];

  if (moisture >= thresholds.critical || temperature >= thresholds.tempCritical) {
    state = 'critical';
    reasonCodes = [];
    if (moisture >= thresholds.critical) reasonCodes.push('HIGH_MOISTURE');
    if (temperature >= thresholds.tempCritical) reasonCodes.push('HIGH_TEMP');
  } else if (moisture >= thresholds.warn || temperature >= thresholds.tempWarn) {
    state = 'warn';
    reasonCodes = [];
    if (moisture >= thresholds.warn) reasonCodes.push('ELEVATED_MOISTURE');
    if (temperature >= thresholds.tempWarn) reasonCodes.push('ELEVATED_TEMP');
  }

  // Pick message/action keys deterministically
  const messageKeys = state === 'critical' ? CRITICAL_MESSAGE_KEYS : state === 'warn' ? WARN_MESSAGE_KEYS : SAFE_MESSAGE_KEYS;
  const actionKeys = state === 'critical' ? CRITICAL_ACTION_KEYS : state === 'warn' ? WARN_ACTION_KEYS : SAFE_ACTION_KEYS;
  const messageKey = pickByIndex(messageKeys, reading);
  const actionKey = pickByIndex(actionKeys, reading);

  // For backward compat with stored history, store English as fallback
  const EN_SAFE_MSGS = ['Storage conditions are stable.', 'All readings within normal range.', 'Moisture and temperature look good.'];
  const EN_WARN_MSGS = ['Moisture is rising. Check ventilation and storage conditions.', 'Temperature is elevated. Ensure proper airflow.', 'Readings above normal. Monitor closely.'];
  const EN_CRIT_MSGS = ['High moisture may increase spoilage risk. Dry the grain promptly.', 'Temperature dangerously high. Risk of spontaneous heating.', 'Both readings at dangerous levels. Act immediately.'];
  const EN_SAFE_ACTS = ['Continue monitoring. No action needed.', 'Maintain current storage conditions.'];
  const EN_WARN_ACTS = ['Check ventilation. Consider running fans or aerating.', 'Inspect grain bin for condensation or hot spots.'];
  const EN_CRIT_ACTS = ['Begin drying immediately. Contact storage facility.', 'Move grain to a safer environment. Do not delay.'];
  const enMsgs = state === 'critical' ? EN_CRIT_MSGS : state === 'warn' ? EN_WARN_MSGS : EN_SAFE_MSGS;
  const enActs = state === 'critical' ? EN_CRIT_ACTS : state === 'warn' ? EN_WARN_ACTS : EN_SAFE_ACTS;

  // Severity: 0-100
  let severity: number;
  if (state === 'safe') severity = Math.min(30, Math.round((moisture / thresholds.critical) * 30));
  else if (state === 'warn') severity = Math.round(40 + ((moisture - thresholds.safe) / (thresholds.critical - thresholds.safe)) * 30);
  else severity = Math.round(70 + ((moisture - thresholds.warn) / (thresholds.critical - thresholds.warn + 5)) * 25);
  severity = Math.min(100, Math.max(0, severity));

  // Secondary observations (translation keys)
  const secondaryObservations: string[] = [];
  if (reading.battery < 20) secondaryObservations.push('obs.low_battery');
  if (reading.signal < 30) secondaryObservations.push('obs.weak_signal');

  const messageId = `${state.toUpperCase()}_THRESHOLD`;

  return {
    state,
    severity,
    ruleId: `R-${messageId}`,
    messageId,
    message: pickByIndex(enMsgs, reading),   // English fallback for stored data
    action: pickByIndex(enActs, reading),    // English fallback for stored data
    messageKey,                              // i18n key for UI
    actionKey,                               // i18n key for UI
    reasonCodes,
    secondaryObservations,
    trend,
    confidence: 0.85,
    variables: {
      moisture,
      temperature,
      battery: reading.battery,
      grainType: reading.grainType,
      readingsCount: recentHistory.length,
    },
  };
}

export function getStatusBadge(decision: MochiDecision | null, deviceState: string): string {
  if (deviceState === 'sleeping') return 'SLEEPING';
  if (deviceState === 'syncing') return 'SYNCING';
  if (deviceState === 'connecting') return 'PAIRING';
  if (!decision) return 'OFFLINE';
  if (decision.state === 'critical') return 'CRITICAL';
  if (decision.state === 'warn') {
    return decision.trend === 'rising' || decision.trend === 'spike' ? 'RISING' : 'WARNING';
  }
  return 'STABLE';
}
