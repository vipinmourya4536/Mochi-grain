'use client';

import { useMemo } from 'react';
import type { HistoryEntry } from '@/lib/grain-types';
import type { AccentColor } from '@/lib/grain-types';
import { getAccentHex } from '@/lib/accent-hex';
import { format } from 'date-fns';

/* ═══════════════════════════════════════════════════════════════
   ReadingDetail context sparkline
   ─────────────────────────────────────────────────────────────
   Plots the ~16 readings surrounding the selected entry (up to 8
   older + up to 7 newer) so the detail view answers "where does
   this reading sit in its local trajectory?" at a glance.
   • Accent curve + soft fill, theme-aware
   • Selected point: enlarged dot in the reading's risk color
   • Safe / critical dashed hairlines when inside the value window
   • First/last time labels of the window
   ═══════════════════════════════════════════════════════════════ */

const W = 322;
const H = 88;
const PAD_X = 14;
const PAD_TOP = 12;
const PAD_BOT = 16;
const OLDER = 8;
const NEWER = 7;

/** Monotone cubic (Fritsch–Carlson) — same algorithm family as the trends chart */
function monotoneCubic(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 2) return [];
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    dy.push(pts[i + 1].y - pts[i].y);
    m.push(dy[i] / (dx[i] || 1));
  }
  const c: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) c.push(0);
    else {
      const common = dx[i - 1] + dx[i];
      c.push((3 * common) / ((common + dx[i]) / m[i - 1] + (common + dx[i - 1]) / m[i]));
    }
  }
  c.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    const acc = c[i] / (m[i] || 1);
    const succ = c[i + 1] / (m[i] || 1);
    if (acc < 0 || succ < 0) {
      c[i] = 0;
      c[i + 1] = 0;
    }
  }
  const segs: { x: number; y: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const segDx = dx[i];
    segs.push({
      x: p1.x, y: p1.y,
      cp1x: p0.x + segDx / 3, cp1y: p0.y + (segDx / 3) * c[i],
      cp2x: p1.x - segDx / 3, cp2y: p1.y - (segDx / 3) * c[i + 1],
    });
  }
  return segs;
}

export function DetailSparkline({
  entries,
  selected,
  accentColor,
  safe,
  critical,
  positionLabel,
}: {
  entries: HistoryEntry[]; // newest-first store list
  selected: HistoryEntry;
  accentColor: AccentColor;
  safe: number;
  critical: number;
  positionLabel: string; // localized aria description, e.g. "5 of 16 shown"
}) {
  const geo = useMemo(() => {
    const idx = entries.findIndex((e) => e.reading.id === selected.reading.id);
    if (idx < 0) return null;

    // Slice the window out of the newest-first list, then rebuild chronologically
    const older = entries.slice(idx + 1, idx + 1 + OLDER); // indices BELOW are newer
    const newer = entries.slice(Math.max(0, idx - NEWER), idx);
    const windowEntries = [...older.slice().reverse(), selected, ...newer.slice().reverse()];
    if (windowEntries.length < 2) return null;

    const selIdx = older.length; // selected sits after the older block
    const values = windowEntries.map((e) => e.reading.moisture);

    let lo = Math.min(...values);
    let hi = Math.max(...values);
    const vPad = Math.max((hi - lo) * 0.3, 0.8);
    lo -= vPad;
    hi += vPad;

    const tMin = windowEntries[0].reading.timestamp;
    const tMax = windowEntries[windowEntries.length - 1].reading.timestamp;
    const tRange = tMax - tMin || 1;

    const drawW = W - PAD_X * 2;
    const drawH = H - PAD_TOP - PAD_BOT;
    const xOf = (ts: number) => PAD_X + ((ts - tMin) / tRange) * drawW;
    const yOf = (v: number) => PAD_TOP + drawH - ((v - lo) / (hi - lo)) * drawH;

    const pts = windowEntries.map((e) => ({
      x: xOf(e.reading.timestamp),
      y: yOf(e.reading.moisture),
    }));

    let pathD = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (const seg of monotoneCubic(pts)) {
      pathD += ` C${seg.cp1x.toFixed(2)},${seg.cp1y.toFixed(2)} ${seg.cp2x.toFixed(2)},${seg.cp2y.toFixed(2)} ${seg.x.toFixed(2)},${seg.y.toFixed(2)}`;
    }
    const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(2)},${H - PAD_BOT} L${pts[0].x.toFixed(2)},${H - PAD_BOT} Z`;

    // Threshold hairlines — drawn only when inside the window's value range
    const hairlines = [
      { v: safe, cls: 'grain-trend-thresh grain-trend-thresh-safe' },
      { v: critical, cls: 'grain-trend-thresh grain-trend-thresh-crit' },
    ]
      .filter((h) => h.v > lo && h.v < hi)
      .map((h) => ({ y: yOf(h.v), cls: h.cls, v: h.v }));

    const sel = pts[selIdx];
    const spanMs = tMax - tMin;
    const fmtTs = (ts: number) => (spanMs > 36 * 3600e3 ? format(ts, 'MMM d') : format(ts, 'HH:mm'));

    return {
      pts, pathD, fillD, hairlines, sel, selIdx,
      first: { x: pts[0].x, label: fmtTs(tMin) },
      last: { x: pts[pts.length - 1].x, label: fmtTs(tMax) },
    };
  }, [entries, selected, safe, critical]);

  if (!geo) return null;

  const accentHex = getAccentHex(accentColor);

  return (
    <div className="grain-detail-spark" role="img" aria-label={positionLabel}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="detailSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: accentHex }} stopOpacity="0.22" />
            <stop offset="100%" style={{ stopColor: accentHex }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal hairlines — subtle grid */}
        {[0.5].map((f) => {
          const gy = PAD_TOP + (H - PAD_TOP - PAD_BOT) * f;
          return <line key={f} x1={PAD_X} y1={gy} x2={W - PAD_X} y2={gy} stroke="var(--gm-separator)" strokeWidth="0.5" />;
        })}

        {/* Threshold hairlines */}
        {geo.hairlines.map((h) => (
          <g key={h.v}>
            <line
              x1={PAD_X} y1={h.y} x2={W - PAD_X} y2={h.y}
              stroke={h.v >= critical ? 'rgba(239,68,68,0.35)' : 'rgba(34,197,94,0.35)'}
              strokeWidth="0.7" strokeDasharray="3,4"
            />
            <text
              x={W - PAD_X - 1} y={h.y - 2.5} textAnchor="end"
              className={h.cls}
              fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif"
            >
              {h.v}%
            </text>
          </g>
        ))}

        {/* Fill + curve */}
        <path d={geo.fillD} fill="url(#detailSparkFill)" stroke="none" />
        <path
          d={geo.pathD}
          fill="none"
          stroke={accentHex}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Neighbor dots */}
        {geo.pts.map((p, i) =>
          i === geo.selIdx ? null : (
            <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={accentHex} opacity={0.45} />
          ),
        )}

        {/* Selected point: halo + risk ring */}
        <circle cx={geo.sel.x} cy={geo.sel.y} r={6.5} fill={accentHex} opacity={0.18} />
        <circle
          cx={geo.sel.x} cy={geo.sel.y} r={3.4}
          fill={accentHex}
          stroke="var(--gm-text-primary)"
          strokeOpacity="0.55"
          strokeWidth="1.1"
        />

        {/* Window time labels */}
        <text x={geo.first.x} y={H - 4} textAnchor="start" fill="var(--gm-text-tertiary)" fontSize="7" fontWeight="600" fontFamily="system-ui, sans-serif">
          {geo.first.label}
        </text>
        <text x={geo.last.x} y={H - 4} textAnchor="end" fill="var(--gm-text-tertiary)" fontSize="7" fontWeight="600" fontFamily="system-ui, sans-serif">
          {geo.last.label}
        </text>
      </svg>
    </div>
  );
}
