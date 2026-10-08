'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { HistoryEntry } from '@/lib/grain-types';
import type { AccentColor } from '@/lib/grain-types';
import { getAccentHex } from '@/lib/accent-hex';
import { useGrainStore } from '@/lib/grain-store';
import { haptic } from '@/lib/haptics';
import { format } from 'date-fns';

/* ═══════════════════════════════════════════════════════════════
   ReadingDetail context sparkline
   ─────────────────────────────────────────────────────────────
   Plots the ~16 readings surrounding the selected entry (up to 8
   older + up to 7 newer) so the detail view answers "where does
   this reading sit in its local trajectory?" at a glance.
   • Accent curve + soft fill, theme-aware
   • Metric toggle: moisture % (primary) or temperature °C
   • Selected point: enlarged dot in the reading's risk color
   • Safe / critical dashed hairlines when inside the value window
   • First/last time labels of the window
   • Scrub inspection (drag / desktop hover / arrow keys) with the
     shared glass tooltip — same interaction pattern as the hero
     sparkline and the trends chart
   ═══════════════════════════════════════════════════════════════ */

const W = 322;
const H = 88;
const PAD_X = 14;
const PAD_TOP = 12;
const PAD_BOT = 16;
const OLDER = 8;
const NEWER = 7;
const SCRUB_AUTO_CLEAR_MS = 2800;
const TOOLTIP_CLAMP = 44;

interface SparkPt {
  x: number;
  y: number;
  v: number;
  t: number;
}

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
  metric = 'moisture',
  safe,
  critical,
  tempSafe,
  tempCritical,
  positionLabel,
  scrubAria,
}: {
  entries: HistoryEntry[]; // newest-first store list
  selected: HistoryEntry;
  accentColor: AccentColor;
  metric?: 'moisture' | 'temp';
  safe: number;
  critical: number;
  tempSafe: number;
  tempCritical: number;
  positionLabel: string; // localized aria description, e.g. "5 of 16 shown"
  scrubAria: string;     // localized chart interaction hint for the focusable wrapper
}) {
  const { settings } = useGrainStore();

  const geo = useMemo(() => {
    const idx = entries.findIndex((e) => e.reading.id === selected.reading.id);
    if (idx < 0) return null;

    // Slice the window out of the newest-first list, then rebuild chronologically
    const older = entries.slice(idx + 1, idx + 1 + OLDER); // indices BELOW are newer
    const newer = entries.slice(Math.max(0, idx - NEWER), idx);
    const windowAll = [...older.slice().reverse(), selected, ...newer.slice().reverse()];
    // Temperature is required for temp mode — tolerate legacy entries without it
    const windowEntries = metric === 'temp'
      ? windowAll.filter((e) => typeof e.reading.temperature === 'number')
      : windowAll;
    if (windowEntries.length < 2) return null;

    const selIdx = windowEntries.findIndex((e) => e.reading.id === selected.reading.id);
    if (selIdx < 0) return null; // selected dropped out (e.g. no temp value)

    const isTemp = metric === 'temp';
    const getV = (e: HistoryEntry) => (isTemp ? e.reading.temperature : e.reading.moisture);
    const values = windowEntries.map(getV);

    // Threshold hairlines follow the metric (moisture % vs temperature °C)
    const loThr = isTemp ? tempSafe : safe;
    const hiThr = isTemp ? tempCritical : critical;
    const unit = isTemp ? '°C' : '%';

    let lo = Math.min(...values);
    let hi = Math.max(...values);
    const vPad = Math.max((hi - lo) * 0.3, isTemp ? 1.2 : 0.8);
    lo -= vPad;
    hi += vPad;

    const tMin = windowEntries[0].reading.timestamp;
    const tMax = windowEntries[windowEntries.length - 1].reading.timestamp;
    const tRange = tMax - tMin || 1;

    const drawW = W - PAD_X * 2;
    const drawH = H - PAD_TOP - PAD_BOT;
    const xOf = (ts: number) => PAD_X + ((ts - tMin) / tRange) * drawW;
    const yOf = (v: number) => PAD_TOP + drawH - ((v - lo) / (hi - lo)) * drawH;

    const pts: SparkPt[] = windowEntries.map((e) => ({
      x: xOf(e.reading.timestamp),
      y: yOf(getV(e)),
      v: getV(e),
      t: e.reading.timestamp,
    }));

    let pathD = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (const seg of monotoneCubic(pts)) {
      pathD += ` C${seg.cp1x.toFixed(2)},${seg.cp1y.toFixed(2)} ${seg.cp2x.toFixed(2)},${seg.cp2y.toFixed(2)} ${seg.x.toFixed(2)},${seg.y.toFixed(2)}`;
    }
    const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(2)},${H - PAD_BOT} L${pts[0].x.toFixed(2)},${H - PAD_BOT} Z`;

    // Threshold hairlines — drawn only when inside the window's value range
    const hairlines = [
      { v: loThr, cls: 'grain-trend-thresh grain-trend-thresh-safe', stroke: 'rgba(34,197,94,0.35)' },
      { v: hiThr, cls: 'grain-trend-thresh grain-trend-thresh-crit', stroke: 'rgba(239,68,68,0.35)' },
    ]
      .filter((h) => h.v > lo && h.v < hi)
      .map((h) => ({ y: yOf(h.v), cls: h.cls, v: h.v, unit, stroke: h.stroke }));

    const sel = pts[selIdx];
    const spanMs = tMax - tMin;
    const fmtTs = (ts: number) => (spanMs > 36 * 3600e3 ? format(ts, 'MMM d') : format(ts, 'HH:mm'));
    const fmtTooltip = (ts: number) => (spanMs > 36 * 3600e3 ? format(ts, 'MMM d · HH:mm') : format(ts, 'HH:mm'));

    return {
      pts, pathD, fillD, hairlines, sel, selIdx, spanMs, unit,
      first: { x: pts[0].x, label: fmtTs(tMin) },
      last: { x: pts[pts.length - 1].x, label: fmtTs(tMax) },
      fmtTooltip,
    };
  }, [entries, selected, safe, critical, tempSafe, tempCritical, metric]);

  /* ── Scrub state (timestamp-anchored, same pattern as hero + trends) ── */
  const [scrubSel, setScrubSel] = useState<{ t: number; leftPx: number; topPx: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const autoClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrubPt = useMemo(
    () => (scrubSel && geo ? geo.pts.find((p) => p.t === scrubSel.t) ?? null : null),
    [geo, scrubSel],
  );
  const scrubIdx = useMemo(
    () => (geo && scrubSel ? geo.pts.findIndex((p) => p.t === scrubSel.t) : -1),
    [geo, scrubSel],
  );

  const clearAutoTimer = useCallback(() => {
    if (autoClearRef.current) {
      clearTimeout(autoClearRef.current);
      autoClearRef.current = null;
    }
  }, []);

  const clearScrub = useCallback(() => {
    clearAutoTimer();
    draggingRef.current = false;
    setScrubSel(null);
  }, [clearAutoTimer]);

  useEffect(() => () => clearAutoTimer(), [clearAutoTimer]);

  const anchorFor = useCallback(
    (i: number): { leftPx: number; topPx: number } | null => {
      const svg = svgRef.current;
      const wrap = wrapRef.current;
      if (!svg || !wrap || !geo || i < 0 || i >= geo.pts.length) return null;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = geo.pts[i];
      let cx: number;
      let cy: number;
      if (typeof DOMPoint === 'function') {
        const sp = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
        cx = sp.x; cy = sp.y;
      } else {
        cx = pt.x * ctm.a + pt.y * ctm.c + ctm.e;
        cy = pt.x * ctm.b + pt.y * ctm.d + ctm.f;
      }
      const rect = wrap.getBoundingClientRect();
      const leftPx = Math.min(Math.max(cx - rect.left, TOOLTIP_CLAMP), Math.max(rect.width - TOOLTIP_CLAMP, TOOLTIP_CLAMP));
      const topPx = cy - rect.top;
      return { leftPx, topPx };
    },
    [geo],
  );

  const nearestIndex = useCallback(
    (vx: number): number => {
      if (!geo || geo.pts.length === 0) return -1;
      const pts = geo.pts;
      let lo = 0;
      let hi = pts.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].x < vx) lo = mid;
        else hi = mid;
      }
      return Math.abs(pts[lo].x - vx) <= Math.abs(pts[hi].x - vx) ? lo : hi;
    },
    [geo],
  );

  const scrubTo = useCallback(
    (i: number) => {
      const anchor = anchorFor(i);
      if (!anchor || !geo) return;
      const sel = { t: geo.pts[i].t, ...anchor };
      setScrubSel((prev) => {
        if (prev && prev.t !== sel.t) haptic(settings.hapticsEnabled, 4);
        return sel;
      });
    },
    [anchorFor, geo, settings.hapticsEnabled],
  );

  const clientToViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    if (typeof DOMPoint === 'function') {
      const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
      return { x: p.x, y: p.y };
    }
    const inv = ctm.inverse();
    return {
      x: clientX * inv.a + clientY * inv.c + inv.e,
      y: clientX * inv.b + clientY * inv.d + inv.f,
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!geo || geo.pts.length < 2) return;
      clearAutoTimer();
      draggingRef.current = true;
      try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* no-op */ }
      const p = clientToViewBox(e.clientX, e.clientY);
      if (p) scrubTo(nearestIndex(p.x));
    },
    [geo, clearAutoTimer, clientToViewBox, nearestIndex, scrubTo],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!geo || geo.pts.length < 2) return;
      const hoverScrub = e.pointerType === 'mouse' && e.buttons === 0;
      if (!draggingRef.current && !hoverScrub) return;
      const p = clientToViewBox(e.clientX, e.clientY);
      if (p) scrubTo(nearestIndex(p.x));
    },
    [geo, clientToViewBox, nearestIndex, scrubTo],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      draggingRef.current = false;
      try { svgRef.current?.releasePointerCapture(e.pointerId); } catch { /* no-op */ }
      if (e.pointerType !== 'mouse') {
        clearAutoTimer();
        autoClearRef.current = setTimeout(() => setScrubSel(null), SCRUB_AUTO_CLEAR_MS);
      }
    },
    [clearAutoTimer],
  );

  const onPointerLeave = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'mouse' && !draggingRef.current) setScrubSel(null);
    },
    [],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!geo || geo.pts.length < 2) return;
      const lastIdx = geo.pts.length - 1;
      if (e.key === 'Escape') { clearScrub(); return; }
      let next: number | null = null;
      const cur = scrubIdx >= 0 ? scrubIdx : null;
      if (e.key === 'ArrowLeft') next = Math.max(0, (cur ?? lastIdx) - 1);
      else if (e.key === 'ArrowRight') next = Math.min(lastIdx, (cur ?? lastIdx - 1) + 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = lastIdx;
      if (next === null) return;
      e.preventDefault();
      clearAutoTimer();
      scrubTo(next);
    },
    [geo, scrubIdx, clearScrub, clearAutoTimer, scrubTo],
  );

  const onBlur = useCallback(() => clearScrub(), [clearScrub]);

  if (!geo) return null;

  const accentHex = getAccentHex(accentColor);

  return (
    <div
      ref={wrapRef}
      className="grain-detail-spark relative grain-trends-wrap"
      tabIndex={0}
      role="application"
      aria-label={scrubAria}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto grain-trends-svg"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
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
              stroke={h.stroke}
              strokeWidth="0.7" strokeDasharray="3,4"
            />
            <text
              x={W - PAD_X - 1} y={h.y - 2.5} textAnchor="end"
              className={h.cls}
              fontSize="6.5" fontWeight="700" fontFamily="system-ui, sans-serif"
            >
              {h.v}{h.unit}
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
            <circle
              key={i} cx={p.x} cy={p.y} r={1.8}
              fill={accentHex}
              opacity={scrubPt ? (scrubIdx === i ? 1 : 0.25) : 0.45}
            />
          ),
        )}

        {/* Selected point: halo + risk ring */}
        <circle
          cx={geo.sel.x} cy={geo.sel.y} r={6.5}
          fill={accentHex}
          opacity={scrubPt ? 0.08 : 0.18}
        />
        <circle
          cx={geo.sel.x} cy={geo.sel.y} r={3.4}
          fill={accentHex}
          stroke="var(--gm-text-primary)"
          strokeOpacity={scrubPt ? 0.25 : 0.55}
          strokeWidth="1.1"
        />

        {/* Scrub guide + marker */}
        {scrubPt && (
          <g className="grain-scrub-group">
            <line
              x1={scrubPt.x} y1={PAD_TOP - 4}
              x2={scrubPt.x} y2={H - PAD_BOT + 4}
              stroke="var(--gm-text-tertiary)"
              strokeOpacity="0.55"
              strokeWidth="1"
              strokeDasharray="2,3"
            />
            <circle cx={scrubPt.x} cy={scrubPt.y} r={6} fill="rgba(255,255,255,0.14)" />
            <circle
              cx={scrubPt.x} cy={scrubPt.y} r={3.4}
              fill={accentHex}
              stroke="#ffffff" strokeWidth="1.3"
            />
          </g>
        )}

        {/* Window time labels */}
        <text x={geo.first.x} y={H - 4} textAnchor="start" fill="var(--gm-text-tertiary)" fontSize="7" fontWeight="600" fontFamily="system-ui, sans-serif">
          {geo.first.label}
        </text>
        <text x={geo.last.x} y={H - 4} textAnchor="end" fill="var(--gm-text-tertiary)" fontSize="7" fontWeight="600" fontFamily="system-ui, sans-serif">
          {geo.last.label}
        </text>
      </svg>

      {/* Glass tooltip */}
      {scrubPt && scrubSel && (
        <div
          className="grain-scrub-tooltip"
          style={{ left: scrubSel.leftPx, top: scrubSel.topPx }}
          role="status"
        >
          <span className="v">{scrubPt.v.toFixed(1)}{geo.unit}</span>
          <span className="t">{geo.fmtTooltip(scrubPt.t)}</span>
        </div>
      )}
    </div>
  );
}
