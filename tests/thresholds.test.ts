/* ═══════════════════════════════════════════════════════════════
   THRESHOLD EDITING — ordering validation + persistence shape
   bun:test. Verifies the Advanced Settings slider contract:
   • no edit can produce safe ≥ warn ≥ critical (moisture or temp)
   • clamping only touches the edited key (grain profile defaults
     are never silently rewritten)
   • the persisted AppSettings shape stays valid after an edit
   • the engine consumes the updated thresholds on its next evaluation
   ═══════════════════════════════════════════════════════════════ */

import { describe, test, expect } from 'bun:test';
import {
  clampThresholdEdit,
  sliderBounds,
  isThresholdSetValid,
  THRESHOLD_LIMITS,
  MOISTURE_KEYS,
  TEMPERATURE_KEYS,
} from '../src/lib/thresholds';
import { evaluate } from '../src/lib/mochi-engine';
import {
  GRAIN_PROFILES,
  DEFAULT_SETTINGS,
  type GrainThresholds,
  type GrainType,
  type Reading,
} from '../src/lib/grain-types';

const WHEAT = GRAIN_PROFILES.wheat;

let seq = 0;
function mk(moisture: number, temperature = 25): Reading {
  seq += 1;
  return {
    id: `t-${seq}`, deviceId: 'TEST-01', grainType: 'wheat',
    moisture, temperature, battery: 90, timestamp: Date.now(),
    signal: 80, deviceStatus: 'connected',
  };
}

describe('ordering invariants', () => {
  test('every shipped grain profile is a valid ordered set', () => {
    for (const grain of Object.keys(GRAIN_PROFILES) as GrainType[]) {
      expect(isThresholdSetValid(GRAIN_PROFILES[grain])).toBe(true);
    }
    expect(isThresholdSetValid(DEFAULT_SETTINGS.thresholds)).toBe(true);
  });

  test('slider bounds always leave room: min < max for every key + profile', () => {
    for (const profile of Object.values(GRAIN_PROFILES)) {
      for (const key of [...MOISTURE_KEYS, ...TEMPERATURE_KEYS]) {
        const b = sliderBounds(profile, key);
        expect(b.min).toBeLessThan(b.max);
      }
    }
  });

  test('editing safe up to warn stops one gap below warn', () => {
    const next = clampThresholdEdit(WHEAT, 'safe', WHEAT.warn + 5);
    expect(next.safe).toBeCloseTo(WHEAT.warn - 0.5, 5);
    expect(next.warn).toBe(WHEAT.warn);           // neighbours untouched
    expect(next.critical).toBe(WHEAT.critical);
    expect(isThresholdSetValid(next)).toBe(true);
  });

  test('editing warn down to safe stops one gap above safe', () => {
    const next = clampThresholdEdit(WHEAT, 'warn', WHEAT.safe - 5);
    expect(next.warn).toBeCloseTo(WHEAT.safe + 0.5, 5);
    expect(isThresholdSetValid(next)).toBe(true);
  });

  test('editing warn into critical is clamped; critical never moves silently', () => {
    const next = clampThresholdEdit(WHEAT, 'warn', WHEAT.critical + 3);
    expect(next.warn).toBeCloseTo(WHEAT.critical - 0.5, 5);
    expect(next.critical).toBe(WHEAT.critical);
    expect(isThresholdSetValid(next)).toBe(true);
  });

  test('editing critical down to warn stops one gap above warn', () => {
    const next = clampThresholdEdit(WHEAT, 'critical', WHEAT.warn - 2);
    expect(next.critical).toBeCloseTo(WHEAT.warn + 0.5, 5);
    expect(isThresholdSetValid(next)).toBe(true);
  });

  test('temperature keys follow the same contract', () => {
    let t: GrainThresholds = WHEAT;
    t = clampThresholdEdit(t, 'tempSafe', t.tempWarn + 4);
    expect(t.tempSafe).toBeCloseTo(t.tempWarn - 0.5, 5);
    t = clampThresholdEdit(t, 'tempCritical', t.tempWarn - 4);
    expect(t.tempCritical).toBeCloseTo(t.tempWarn + 0.5, 5);
    expect(isThresholdSetValid(t)).toBe(true);
  });

  test('non-finite / NaN edits are rejected to the lower bound', () => {
    const next = clampThresholdEdit(WHEAT, 'warn', Number.NaN);
    expect(Number.isFinite(next.warn)).toBe(true);
    expect(isThresholdSetValid(next)).toBe(true);
  });

  test('identity: an in-range edit returns a NEW object with only that key changed', () => {
    const next = clampThresholdEdit(WHEAT, 'warn', WHEAT.warn + 1);
    expect(next).not.toBe(WHEAT);
    expect(next.warn).toBeCloseTo(WHEAT.warn + 1, 5);
    expect({ ...next, warn: next.warn - 1 }).toEqual(WHEAT); // rest identical
  });
});

describe('persistence shape', () => {
  test('a clamped edit merged into AppSettings stays valid (updateSettings flow)', () => {
    // settings-tab does: updateSettings({ thresholds: clampThresholdEdit(...) })
    // grain-store does:  { ...settings, ...partial } → replace the thresholds object
    const edited = clampThresholdEdit(WHEAT, 'safe', 24);
    const persisted = { ...DEFAULT_SETTINGS, thresholds: edited };
    expect(isThresholdSetValid(persisted.thresholds)).toBe(true);
    expect(persisted.thresholds.safe).toBeLessThan(persisted.thresholds.warn);
  });

  test('clamp respects absolute limits (never outside THRESHOLD_LIMITS)', () => {
    const high = clampThresholdEdit(WHEAT, 'critical', 999);
    expect(high.critical).toBeLessThanOrEqual(THRESHOLD_LIMITS.critical.max);
    const low = clampThresholdEdit(WHEAT, 'safe', -99);
    expect(low.safe).toBeGreaterThanOrEqual(THRESHOLD_LIMITS.safe.min);
  });
});

describe('engine consumes updated thresholds', () => {
  test('after a user raises the warning threshold, the same reading reclassifies', () => {
    const reading = mk(14.5); // wheat: monitor zone under defaults
    const before = evaluate(reading, [], WHEAT);
    expect(before.state).toBe('monitor');

    const raised = clampThresholdEdit(WHEAT, 'warn', 16); // user raises warn 15 → 16
    const after = evaluate(reading, [], raised);
    expect(after.state).toBe('safe');
  });

  test('after a user lowers the critical threshold, the same reading becomes critical', () => {
    const reading = mk(16); // wheat: warning under defaults (warn 15 < 16 < 17)
    const lowered = clampThresholdEdit(WHEAT, 'critical', 15.5);
    const after = evaluate(reading, [], lowered);
    expect(after.state).toBe('critical');
  });
});
