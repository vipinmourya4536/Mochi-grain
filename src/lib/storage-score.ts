/* ═══════════════════════════════════════════════════
   Storage Score – single-number storage safety index
   ═══════════════════════════════════════════════════
   0–100 composite over the stored history:
   • ZONES     (55%) how much of the history sits below
                 the active grain's safe/warn/critical lines
   • STABILITY (25%) moisture stddev — steady grain is
                 safe grain
   • TREND     (20%) direction of the most recent
                 readings (rising moisture is the risk)
   ═══════════════════════════════════════════════════ */

import type { HistoryEntry, GrainThresholds } from './grain-types';

export type ScoreBand = 'excellent' | 'good' | 'fair' | 'risky';

export interface StorageScore {
  score: number; // 0–100
  band: ScoreBand;
  parts: { zones: number; stability: number; trend: number }; // 0–100 each
}

/** Band → display color (semantic, accent-independent) */
export function scoreBandColor(band: ScoreBand): string {
  switch (band) {
    case 'excellent': return '#22C55E';
    case 'good':      return '#84CC16';
    case 'fair':      return '#F59E0B';
    default:          return '#EF4444';
  }
}

export function computeStorageScore(
  entries: HistoryEntry[],
  thresholds: GrainThresholds,
): StorageScore | null {
  if (entries.length === 0) return null;

  /* ── 1. Zone distribution (55%) ──
     Each reading earns full credit below safe, partial in warn,
     almost none in the critical band, zero above critical. */
  let zonePts = 0;
  for (const e of entries) {
    const m = e.reading.moisture;
    if (m <= thresholds.safe) zonePts += 1;
    else if (m <= thresholds.warn) zonePts += 0.55;
    else if (m <= thresholds.critical) zonePts += 0.15;
  }
  const zones = (zonePts / entries.length) * 100;

  /* ── 2. Stability (25%) ──
     stddev ≤ 0.4% → full marks; ≥ 2.5% → zero. */
  const mean = entries.reduce((s, e) => s + e.reading.moisture, 0) / entries.length;
  const variance = entries.reduce((s, e) => s + (e.reading.moisture - mean) ** 2, 0) / entries.length;
  const std = Math.sqrt(variance);
  const stability = Math.max(0, Math.min(100, ((2.5 - std) / (2.5 - 0.4)) * 100));

  /* ── 3. Recent trend (20%) ──
     Direction across the newest window (oldest → newest):
     flat/falling is safe; every +1% of rise costs half the marks. */
  const sorted = [...entries].sort((a, b) => a.reading.timestamp - b.reading.timestamp);
  const recent = sorted.slice(-8);
  const delta = recent[recent.length - 1].reading.moisture - recent[0].reading.moisture;
  const trend = delta <= 0 ? 100 : Math.max(0, 100 - (delta / 2) * 100);

  const score = Math.round(zones * 0.55 + stability * 0.25 + trend * 0.2);
  const band: ScoreBand =
    score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'fair' : 'risky';

  return {
    score,
    band,
    parts: {
      zones: Math.round(zones),
      stability: Math.round(stability),
      trend: Math.round(trend),
    },
  };
}
