/* ═══════════════════════════════════════════════════════════════
   MOCHI DECISION ENGINE – DUMMY PLACEHOLDER
   Will be replaced with the real engine later.
   For now: simple threshold check → decision object.
   ═══════════════════════════════════════════════════════════════ */

import type {
  Reading,
  GrainThresholds,
  RiskTheme,
  TrendDirection,
  MochiDecision,
} from './grain-types';

/* ── Simple deterministic messages ── */
const SAFE_MESSAGES = [
  'Storage conditions are stable.',
  'All readings within normal range.',
  'Moisture and temperature look good.',
];
const WARN_MESSAGES = [
  'Moisture is rising. Check ventilation and storage conditions.',
  'Temperature is elevated. Ensure proper airflow.',
  'Readings above normal. Monitor closely.',
];
const CRITICAL_MESSAGES = [
  'High moisture may increase spoilage risk. Dry the grain promptly.',
  'Temperature dangerously high. Risk of spontaneous heating.',
  'Both readings at dangerous levels. Act immediately.',
];

const SAFE_ACTIONS = [
  'Continue monitoring. No action needed.',
  'Maintain current storage conditions.',
];
const WARN_ACTIONS = [
  'Check ventilation. Consider running fans or aerating.',
  'Inspect grain bin for condensation or hot spots.',
];
const CRITICAL_ACTIONS = [
  'Begin drying immediately. Contact storage facility.',
  'Move grain to a safer environment. Do not delay.',
];

function pickByIndex(arr: string[], reading: Reading): string {
  // Deterministic based on reading id so same reading always gets same message
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

  // Pick message + action deterministically
  const messages = state === 'critical' ? CRITICAL_MESSAGES : state === 'warn' ? WARN_MESSAGES : SAFE_MESSAGES;
  const actions = state === 'critical' ? CRITICAL_ACTIONS : state === 'warn' ? WARN_ACTIONS : SAFE_ACTIONS;
  const message = pickByIndex(messages, reading);
  const action = pickByIndex(actions, reading);

  // Severity: 0-100
  let severity: number;
  if (state === 'safe') severity = Math.min(30, Math.round((moisture / thresholds.critical) * 30));
  else if (state === 'warn') severity = Math.round(40 + ((moisture - thresholds.safe) / (thresholds.critical - thresholds.safe)) * 30);
  else severity = Math.round(70 + ((moisture - thresholds.warn) / (thresholds.critical - thresholds.warn + 5)) * 25);
  severity = Math.min(100, Math.max(0, severity));

  // Secondary observations
  const secondaryObservations: string[] = [];
  if (reading.battery < 20) secondaryObservations.push('LOW_BATTERY');
  if (reading.signal < 30) secondaryObservations.push('WEAK_SIGNAL');

  const messageId = `DUMMY_${state.toUpperCase()}`;

  return {
    state,
    severity,
    ruleId: `R-${messageId}`,
    messageId,
    message,
    action,
    reasonCodes,
    secondaryObservations,
    trend,
    confidence: 0.5, // Low confidence for dummy
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
