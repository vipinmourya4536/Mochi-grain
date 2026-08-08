/* ═══════════════════════════════════════════════════════════════
   MOCHI DECISION ENGINE
   Pure logic – no UI, no DOM, no external API calls.
   Takes a reading + history → outputs a MochiDecision.
   ═══════════════════════════════════════════════════════════════ */

import type {
  Reading,
  GrainType,
  GrainThresholds,
  RiskTheme,
  TrendDirection,
  MochiDecision,
} from './grain-types';

/* ── Message pool (pre-written, calm, human-friendly) ── */
const MESSAGES: Record<string, string[]> = {
  // Safe
  'safe-stable': [
    'Storage conditions are stable.',
    'All readings within normal range.',
    'Moisture and temperature look good.',
  ],
  'safe-falling': [
    'Moisture is slowly decreasing.',
    'Drying trend detected. Readings normal.',
  ],
  // Warning
  'warn-rising': [
    'Moisture is rising. Check ventilation and storage conditions.',
    'Moisture trending upward. Monitor closely for the next few hours.',
  ],
  'warn-temp': [
    'Temperature is elevated. Ensure proper airflow around the grain.',
    'Ambient temperature higher than usual. Improve ventilation.',
  ],
  'warn-combined': [
    'Both moisture and temperature are elevated. Increase ventilation immediately.',
    'Higher than normal readings detected. Inspect storage area.',
  ],
  'warn-spike': [
    'Sudden moisture spike detected. Verify probe placement and check for leaks.',
    'Unusual reading spike. Cross-check with a manual measurement.',
  ],
  // Critical
  'critical-moisture': [
    'High moisture may increase spoilage risk. Dry the grain promptly.',
    'Moisture critically high. Immediate action required to prevent loss.',
  ],
  'critical-temp': [
    'Temperature dangerously high. Risk of spontaneous heating.',
    'Extreme temperature detected. Move grain to a cooler location.',
  ],
  'critical-both': [
    'Critical levels for moisture and temperature. Spoilage is likely without action.',
    'Both readings at dangerous levels. Act immediately to protect the grain.',
  ],
};

/* ── Action pool ── */
const ACTIONS: Record<string, string[]> = {
  safe: ['Continue monitoring. No action needed.', 'Maintain current storage conditions.'],
  warn: ['Check ventilation. Consider running fans or aerating.', 'Inspect grain bin for condensation or hot spots.'],
  critical: ['Begin drying immediately. Contact storage facility.', 'Move grain to a safer environment. Do not delay.'],
};

/* ── Helpers ── */
function trendFromHistory(readings: Reading[]): TrendDirection {
  if (readings.length < 3) return 'stable';
  const recent = readings.slice(-5).map((r) => r.moisture);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = last - first;
  const avgDiff = Math.abs(diff) / recent.length;

  if (avgDiff < 0.3) return 'stable';
  if (diff > 0 && avgDiff > 0.8) return 'spike';
  if (diff > 0) return 'rising';
  if (diff < 0 && avgDiff > 0.8) return 'drop';
  if (diff < 0) return 'falling';
  return 'stable';
}

function severityForState(state: RiskTheme, moisture: number, temperature: number, thresholds: GrainThresholds): number {
  if (state === 'safe') return Math.min(30, Math.round((moisture / thresholds.critical) * 30));
  if (state === 'warn') return Math.round(40 + ((moisture - thresholds.safe) / (thresholds.critical - thresholds.safe)) * 30);
  return Math.round(70 + ((moisture - thresholds.warn) / (thresholds.critical - thresholds.warn + 5)) * 25);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ── Cooldown tracker (suppresses repeated same-state messages) ── */
const _cooldowns: Map<string, { messageId: string; timestamp: number }> = new Map();
const COOLDOWN_MS = 60_000; // 1 minute minimum between same messages

export function clearCooldowns() {
  _cooldowns.clear();
}

/* ═══════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════ */

/**
 * evaluate – takes the latest reading, recent history, thresholds,
 * and returns a MochiDecision. Pure function (side-effect only in
 * cooldown cache for message dedup).
 */
export function evaluate(
  reading: Reading,
  recentHistory: Reading[],
  thresholds: GrainThresholds,
): MochiDecision {
  const { moisture, temperature } = reading;
  const trend = trendFromHistory(recentHistory);

  // ── Determine state ──
  let state: RiskTheme = 'safe';
  let moistureFlag = false;
  let tempFlag = false;

  if (moisture >= thresholds.critical) { state = 'critical'; moistureFlag = true; }
  else if (moisture >= thresholds.warn) { state = 'warn'; moistureFlag = true; }

  if (temperature >= thresholds.tempCritical) { state = 'critical'; tempFlag = true; }
  else if (temperature >= thresholds.tempWarn && state !== 'critical') { state = 'warn'; tempFlag = true; }

  // ── Select message ──
  let messageId: string;
  const reasonCodes: string[] = [];
  const secondaryObservations: string[] = [];

  if (state === 'critical') {
    if (moistureFlag && tempFlag) { messageId = 'critical-both'; reasonCodes.push('HIGH_MOISTURE', 'HIGH_TEMP'); }
    else if (moistureFlag) { messageId = 'critical-moisture'; reasonCodes.push('HIGH_MOISTURE'); }
    else { messageId = 'critical-temp'; reasonCodes.push('HIGH_TEMP'); }
  } else if (state === 'warn') {
    if (moistureFlag && tempFlag) { messageId = 'warn-combined'; reasonCodes.push('ELEVATED_MOISTURE', 'ELEVATED_TEMP'); }
    else if (moistureFlag) {
      if (trend === 'spike') { messageId = 'warn-spike'; reasonCodes.push('MOISTURE_SPIKE'); }
      else { messageId = 'warn-rising'; reasonCodes.push('RISING_MOISTURE'); }
    } else {
      messageId = 'warn-temp'; reasonCodes.push('ELEVATED_TEMP'); }
  } else {
    if (trend === 'falling' || trend === 'drop') { messageId = 'safe-falling'; reasonCodes.push('FALLING_TREND'); }
    else { messageId = 'safe-stable'; reasonCodes.push('NORMAL'); }
  }

  // Secondary observations
  if (reading.battery < 20) secondaryObservations.push('LOW_BATTERY');
  if (reading.signal < 30) secondaryObservations.push('WEAK_SIGNAL');
  if (trend === 'spike') secondaryObservations.push('READINGS_UNSTABLE');
  if (recentHistory.length >= 3) {
    const tempTrend = recentHistory.slice(-3).map((r) => r.temperature);
    if (tempTrend[2] - tempTrend[0] > 3) secondaryObservations.push('TEMP_RISING');
  }

  // ── Cooldown: avoid repeating the same message ──
  const cooldownKey = reading.deviceId;
  const prev = _cooldowns.get(cooldownKey);
  const now = Date.now();
  let message: string;
  const pool = MESSAGES[messageId] || MESSAGES['safe-stable'];

  if (prev && prev.messageId === messageId && (now - prev.timestamp) < COOLDOWN_MS) {
    // Same state, within cooldown – pick a different message if possible
    const alternatives = pool.filter((m) => m !== prev.messageId);
    message = alternatives.length > 0 ? pickRandom(alternatives) : pool[0];
  } else {
    message = pickRandom(pool);
  }

  _cooldowns.set(cooldownKey, { messageId, timestamp: now });

  const action = pickRandom(ACTIONS[state]);
  const confidence = Math.min(0.98, 0.7 + (recentHistory.length / 20) * 0.25);
  const severity = severityForState(state, moisture, temperature, thresholds);

  return {
    state,
    severity,
    ruleId: `R-${messageId.toUpperCase().replace(/-/g, '_')}`,
    messageId,
    message,
    action,
    reasonCodes,
    secondaryObservations,
    trend,
    confidence,
    variables: {
      moisture,
      temperature,
      battery: reading.battery,
      grainType: reading.grainType,
      readingsCount: recentHistory.length,
    },
  };
}

/**
 * Get a status badge label from decision + device state.
 */
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
