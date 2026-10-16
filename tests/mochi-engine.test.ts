/* ═══════════════════════════════════════════════════════════════
   MOCHI DECISION ENGINE v2.1 — shared test vectors
   bun:test. Covers: determinism, every grain profile, critical
   transitions (rising / rapid / high-temp / recovery), invalid
   data classes, stale data, missing history, rapid-succession
   guard, gap guard, dedup, and cooldown injection/persistence.
   ═══════════════════════════════════════════════════════════════ */

import { describe, test, expect } from 'bun:test';
import {
  evaluate,
  normalizeThresholds,
  validateReading,
  isSuppressed,
  ENGINE_VERSION,
  DEFAULT_ENGINE_SETTINGS,
} from '../src/lib/mochi-engine';
import { GRAIN_PROFILES, type GrainType, type Reading } from '../src/lib/grain-types';

/** Fixed clock — every vector is evaluated against this instant. */
const NOW = 1750000000000;

let seq = 0;
function mk(overrides: Partial<Reading> = {}): Reading {
  seq += 1;
  return {
    id: `t-${seq}`,
    deviceId: 'TEST-01',
    grainType: 'wheat',
    moisture: 12,
    temperature: 25,
    battery: 90,
    timestamp: NOW,
    signal: 80,
    deviceStatus: 'connected',
    ...overrides,
  };
}

const WHEAT = GRAIN_PROFILES.wheat;
const MIN = DEFAULT_ENGINE_SETTINGS.minTrendIntervalMs;

describe('engine v2.1 metadata', () => {
  test('version is 2.x and distinct from app version', () => {
    expect(ENGINE_VERSION.startsWith('2.')).toBe(true);
  });
});

describe('determinism', () => {
  test('same inputs + injected now + injected cooldown ⇒ identical decision', () => {
    const history = [mk({ timestamp: NOW - 30 * 60e3, moisture: 13.0, temperature: 25 })];
    const current = mk({ moisture: 13.1, temperature: 25.1 });
    const a = evaluate(current, history, WHEAT, { now: NOW, cooldown: null });
    const b = evaluate(current, history, WHEAT, { now: NOW, cooldown: null });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test('no hidden module state: two identical calls in sequence stay identical', () => {
    const current = mk({ moisture: 16 });
    const first = evaluate(current, [], WHEAT, { now: NOW });
    const second = evaluate(current, [], WHEAT, { now: NOW });
    expect(second.state).toBe(first.state);
    expect(second.alertSuppressed).toBe(false); // fresh evaluation is never suppressed
  });
});

describe('normal readings across ALL grain profiles', () => {
  for (const grain of Object.keys(GRAIN_PROFILES) as GrainType[]) {
    test(`${grain}: below-safe ⇒ SAFE, above-critical ⇒ CRITICAL, hot ⇒ WARNING`, () => {
      const p = GRAIN_PROFILES[grain];
      const safe = evaluate(mk({ grainType: grain, moisture: p.safe - 1, temperature: p.tempSafe - 5 }), [], p, { now: NOW });
      expect(safe.state).toBe('safe');

      const critical = evaluate(mk({ grainType: grain, moisture: p.critical + 0.5, temperature: p.tempSafe - 5 }), [], p, { now: NOW });
      expect(critical.state).toBe('critical');
      expect(critical.ruleId).toBe('CRITICAL_CONDITION');
      expect(critical.reasonCodes).toContain('MOISTURE_ABOVE_LIMIT');

      const hot = evaluate(mk({ grainType: grain, moisture: p.safe - 1, temperature: p.tempCritical + 2 }), [], p, { now: NOW });
      expect(hot.state).toBe('warning');
      expect(hot.reasonCodes).toContain('TEMPERATURE_HIGH');
    });
  }
});

describe('trend evaluation (qualified intervals only)', () => {
  test('rising moisture over a valid interval escalates monitor → rising rule', () => {
    const prev = mk({ timestamp: NOW - 30 * 60e3, moisture: 13.3, temperature: 25 });
    const current = mk({ moisture: 14.3, temperature: 25.1 });
    const d = evaluate(current, [prev], WHEAT, { now: NOW });
    expect(d.trend).toBe('rising');
    expect(d.reasonCodes).toContain('MOISTURE_RISING');
    expect(d.state).toBe('monitor'); // 14.3 sits in the monitor band
  });

  test('rapid succession NEVER escalates: interval < minTrendIntervalMs', () => {
    const prev = mk({ timestamp: NOW - 30e3, moisture: 13.3, temperature: 25 }); // 30 s apart
    const current = mk({ moisture: 14.3, temperature: 25.1 }); // +1.0 pp in 30 s is noise/burst
    const d = evaluate(current, [prev], WHEAT, { now: NOW });
    expect(d.trend).toBe('stable');
    expect(d.reasonCodes).toContain('TREND_INTERVAL_TOO_SHORT');
    expect(d.reasonCodes).not.toContain('MOISTURE_RISING');
    expect(d.ruleId).toBe('MONITOR_CONDITION'); // static band only — no trend escalation
  });

  test('trend across a data gap longer than historyGapThresholdMs is insufficient data', () => {
    const prev = mk({ timestamp: NOW - 7 * 3600e3, moisture: 10, temperature: 24 });
    const current = mk({ moisture: 18, temperature: 25 });
    const d = evaluate(current, [prev], WHEAT, { now: NOW });
    expect(d.trend).toBe('insufficient_data');
    expect(d.reasonCodes).toContain('TREND_GAP_TOO_LONG');
    // static moisture is still classified on its own merits
    expect(d.state).toBe('critical');
  });

  test('stable window confirmed → MOISTURE_STABLE', () => {
    const history = [
      mk({ timestamp: NOW - 45 * 60e3, moisture: 13.0, temperature: 25.0 }),
      mk({ timestamp: NOW - 30 * 60e3, moisture: 13.1, temperature: 25.2 }),
      mk({ timestamp: NOW - 15 * 60e3, moisture: 13.0, temperature: 25.1 }),
    ];
    const d = evaluate(mk({ moisture: 13.1, temperature: 25.0 }), history, WHEAT, { now: NOW });
    expect(d.ruleId).toBe('MOISTURE_STABLE');
    expect(d.reasonCodes).toContain('STABLE_WINDOW_CONFIRMED');
    expect(d.confidence).toBe('high');
  });

  test('history unavailable ⇒ no escalation, honest low confidence', () => {
    const d = evaluate(mk({ moisture: 12, temperature: 25 }), [], WHEAT, { now: NOW });
    expect(d.state).toBe('safe');
    expect(d.trend).toBe('insufficient_data');
    expect(d.confidence).toBe('low');
  });
});

describe('invalid data handling — never safe', () => {
  test('missing moisture', () => {
    const bad = { ...mk() } as unknown as Reading;
    (bad as unknown as { moisture: null }).moisture = null;
    const d = evaluate(bad, [], WHEAT, { now: NOW });
    expect(d.state).toBe('invalid');
    expect(d.reasonCodes).toEqual(['MISSING_MOISTURE']);
  });

  test('malformed moisture (NaN)', () => {
    const bad = { ...mk(), moisture: Number.NaN } as unknown as Reading;
    const d = evaluate(bad, [], WHEAT, { now: NOW });
    expect(d.state).toBe('invalid');
    expect(d.reasonCodes).toEqual(['MALFORMED_MOISTURE']);
  });

  test('implausible moisture (>100% / negative)', () => {
    expect(evaluate(mk({ moisture: 120 }), [], WHEAT, { now: NOW }).reasonCodes).toEqual(['IMPLAUSIBLE_MOISTURE']);
    expect(evaluate(mk({ moisture: -3 }), [], WHEAT, { now: NOW }).reasonCodes).toEqual(['IMPLAUSIBLE_MOISTURE']);
  });

  test('malformed / implausible temperature', () => {
    expect(evaluate({ ...mk(), temperature: Number.NaN } as unknown as Reading, [], WHEAT, { now: NOW }).reasonCodes)
      .toEqual(['MALFORMED_TEMPERATURE']);
    expect(evaluate(mk({ temperature: 120 }), [], WHEAT, { now: NOW }).reasonCodes).toEqual(['IMPLAUSIBLE_TEMPERATURE']);
    expect(evaluate(mk({ temperature: -40 }), [], WHEAT, { now: NOW }).reasonCodes).toEqual(['IMPLAUSIBLE_TEMPERATURE']);
  });

  test('stale reading (vs injected now) — STALE_READING message, not a measurement', () => {
    const old = mk({ timestamp: NOW - 2 * 3600e3, moisture: 12, temperature: 25 });
    const d = evaluate(old, [], WHEAT, { now: NOW });
    expect(d.state).toBe('invalid');
    expect(d.messageId).toBe('STALE_READING');
    expect(d.reasonCodes).toEqual(['STALE_READING']);
  });

  test('validateReading classification sanity', () => {
    const s = DEFAULT_ENGINE_SETTINGS;
    expect(validateReading(mk(), NOW, s).ok).toBe(true);
    expect(validateReading(null, NOW, s).ok).toBe(false);
    expect(validateReading(mk({ moisture: 120 }), NOW, s).reason).toBe('IMPLAUSIBLE_MOISTURE');
  });
});

describe('cooldown — injectable, persistable, separated from classification', () => {
  test('same warning rule twice within cooldown: second alert suppressed, state identical', () => {
    const current = mk({ moisture: 15.5, temperature: 25 }); // wheat: > warn 15, < critical 17
    const first = evaluate(current, [], WHEAT, { now: NOW, cooldown: null });
    expect(first.state).toBe('warning');
    expect(first.alertSuppressed).toBe(false);
    expect(first.cooldown?.ruleId).toBe('WARNING_CONDITION');

    const second = evaluate(current, [], WHEAT, { now: NOW + 60e3, cooldown: first.cooldown ?? null });
    expect(second.state).toBe('warning');              // classification NEVER changes
    expect(second.alertSuppressed).toBe(true);          // but the alert is deduped
  });

  test('after the cooldown window expires the alert delivers again', () => {
    const current = mk({ moisture: 15.5, temperature: 25 });
    const first = evaluate(current, [], WHEAT, { now: NOW, cooldown: null });
    const later = evaluate(current, [], WHEAT, {
      now: NOW + DEFAULT_ENGINE_SETTINGS.messageCooldownMs + 1,
      cooldown: first.cooldown ?? null,
    });
    expect(later.alertSuppressed).toBe(false);
  });

  test('critical alerts bypass cooldown (never silence a danger)', () => {
    const current = mk({ moisture: 18, temperature: 25 });
    const first = evaluate(current, [], WHEAT, { now: NOW, cooldown: null });
    expect(first.state).toBe('critical');
    const second = evaluate(current, [], WHEAT, { now: NOW + 1000, cooldown: first.cooldown ?? null });
    expect(second.alertSuppressed).toBe(false);
    expect(second.ruleId).toBe('CRITICAL_CONDITION');
  });

  test('recovery requires injected previous-state memory; fresh evaluation has none', () => {
    const safeNow = mk({ moisture: 12, temperature: 25 });
    const withMemory = evaluate(safeNow, [], WHEAT, {
      now: NOW,
      cooldown: { ruleId: 'WARNING_CONDITION', state: 'warning', timestamp: NOW - 60e3 },
    });
    expect(withMemory.ruleId).toBe('RECOVERY');

    const fresh = evaluate(safeNow, [], WHEAT, { now: NOW, cooldown: null });
    expect(fresh.ruleId).toBe('SAFE_CONDITION');
  });

  test('isSuppressed helper is stateless', () => {
    const cd = { ruleId: 'WARNING_CONDITION', state: 'warning', timestamp: NOW - 1000 };
    expect(isSuppressed(cd, 'WARNING_CONDITION', 30 * 60e3, NOW)).toBe(true);
    expect(isSuppressed(cd, 'MONITOR_CONDITION', 30 * 60e3, NOW)).toBe(false);
    expect(isSuppressed(null, 'WARNING_CONDITION', 30 * 60e3, NOW)).toBe(false);
  });
});

describe('threshold handling', () => {
  test('updated user thresholds drive the NEXT evaluation', () => {
    const custom = { ...WHEAT, safe: 10, warn: 12, critical: 14 };
    const d = evaluate(mk({ moisture: 13, temperature: 25 }), [], custom, { now: NOW });
    expect(d.state).toBe('warning');
    expect(d.reasonCodes).toContain('MOISTURE_ABOVE_LIMIT');
  });

  test('normalizeThresholds repairs ordering defensively', () => {
    const fixed = normalizeThresholds({ safe: 16, warn: 14, critical: 12, tempSafe: 30, tempWarn: 28, tempCritical: 26 });
    expect(fixed.safe).toBeLessThan(fixed.warn);
    expect(fixed.warn).toBeLessThan(fixed.critical);
    expect(fixed.tempSafe).toBeLessThan(fixed.tempWarn);
    expect(fixed.tempWarn).toBeLessThan(fixed.tempCritical);
  });

  test('normalizeThresholds leaves already-valid profiles untouched', () => {
    for (const p of Object.values(GRAIN_PROFILES)) {
      expect(normalizeThresholds(p)).toEqual(p);
    }
  });
});

describe('history hygiene', () => {
  test('duplicate timestamps are deduplicated', () => {
    const dup = mk({ timestamp: NOW - 30 * 60e3, moisture: 13, temperature: 25 });
    const d = evaluate(mk({ moisture: 13.1, temperature: 25 }), [dup, dup, dup], WHEAT, { now: NOW });
    expect(d.debug?.historySummary?.duplicatesRemoved).toBe(2);
  });

  test('out-of-order history is sorted chronologically before trend math', () => {
    // Newest-first storage order — the engine must not misread the trend
    const history = [
      mk({ timestamp: NOW - 10 * 60e3, moisture: 12.0, temperature: 25 }), // later reading, appears first
      mk({ timestamp: NOW - 30 * 60e3, moisture: 11.0, temperature: 25 }), // earlier reading, appears second
    ];
    const d = evaluate(mk({ moisture: 12.0, temperature: 25 }), history, WHEAT, { now: NOW });
    // current vs previous chronological (12.0@-10m) = stable, not +1.0 vs the older one
    expect(d.trend).toBe('stable');
  });
});
