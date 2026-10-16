/* ═══════════════════════════════════════════════════════════════
   THRESHOLD EDITING — pure ordering/validation helpers
   ─────────────────────────────────────────────────────────────
   The Advanced Settings sliders use these bounds so a user can
   NEVER produce safe ≥ warn ≥ critical. The engine's
   normalizeThresholds() is the defensive backstop (imports,
   legacy data); this module is the interactive layer.

   Grain-specific calibrated defaults (GRAIN_PROFILES) are never
   rewritten here — clamping only applies to the value a user is
   actively moving, relative to its live neighbours.
   ═══════════════════════════════════════════════════════════════ */

import type { GrainThresholds } from './grain-types';

/** Minimum pp/°C gap between adjacent thresholds */
export const THRESHOLD_GAP = 0.5;

/** Absolute slider bounds per key (covers every grain profile) */
export const THRESHOLD_LIMITS = {
  safe:     { min: 5,  max: 25 },
  warn:     { min: 8,  max: 30 },
  critical: { min: 10, max: 40 },
  tempSafe:     { min: 10, max: 40 },
  tempWarn:     { min: 15, max: 45 },
  tempCritical: { min: 20, max: 55 },
} as const;

export type MoistureThresholdKey = 'safe' | 'warn' | 'critical';
export type TemperatureThresholdKey = 'tempSafe' | 'tempWarn' | 'tempCritical';
export type ThresholdKey = MoistureThresholdKey | TemperatureThresholdKey;

export const MOISTURE_KEYS: MoistureThresholdKey[] = ['safe', 'warn', 'critical'];
export const TEMPERATURE_KEYS: TemperatureThresholdKey[] = ['tempSafe', 'tempWarn', 'tempCritical'];

/** Is the whole set a valid ordered chain? */
export function isThresholdSetValid(t: GrainThresholds): boolean {
  return (
    t.safe < t.warn && t.warn < t.critical &&
    t.tempSafe < t.tempWarn && t.tempWarn < t.tempCritical
  );
}

/**
 * Slider bounds for ONE key given its live neighbours.
 * Guarantees any value inside [min, max] keeps the chain ordered.
 */
export function sliderBounds(
  thresholds: GrainThresholds,
  key: ThresholdKey,
): { min: number; max: number } {
  const limits = THRESHOLD_LIMITS[key];
  switch (key) {
    case 'safe':
      return { min: limits.min, max: round1(thresholds.warn - THRESHOLD_GAP) };
    case 'warn':
      return {
        min: round1(thresholds.safe + THRESHOLD_GAP),
        max: round1(thresholds.critical - THRESHOLD_GAP),
      };
    case 'critical':
      return { min: round1(thresholds.warn + THRESHOLD_GAP), max: limits.max };
    case 'tempSafe':
      return { min: limits.min, max: round1(thresholds.tempWarn - THRESHOLD_GAP) };
    case 'tempWarn':
      return {
        min: round1(thresholds.tempSafe + THRESHOLD_GAP),
        max: round1(thresholds.tempCritical - THRESHOLD_GAP),
      };
    case 'tempCritical':
      return { min: round1(thresholds.tempWarn + THRESHOLD_GAP), max: limits.max };
  }
}

/**
 * Clamp a user edit so the resulting set stays strictly ordered.
 * Returns the SAME object when nothing changes (avoids needless writes).
 */
export function clampThresholdEdit(
  thresholds: GrainThresholds,
  key: ThresholdKey,
  rawValue: number,
): GrainThresholds {
  const { min, max } = sliderBounds(thresholds, key);
  const value = round1(Math.min(max, Math.max(min, Number.isFinite(rawValue) ? rawValue : min)));
  if (thresholds[key] === value) return thresholds;
  return { ...thresholds, [key]: value };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
