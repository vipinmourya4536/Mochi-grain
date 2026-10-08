'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import type { HistoryEntry } from '@/lib/grain-types';
import { getAccentHex, getRiskColor } from '@/lib/accent-hex';
import { t, type AppLanguage } from '@/lib/i18n';
import { haptic } from '@/lib/haptics';
import { ChartLine } from '@phosphor-icons/react/dist/ssr';
import { format } from 'date-fns';

/* ═══════════════════════════════════════════════════════════════
   History Trends – large interactive moisture chart
   ─────────────────────────────────────────────────────────────
   • Range selector (24H / 7D / 30D / ALL) with auto-detect
   • Time-proportional X axis, monotone cubic curve, accent fill
   • Threshold zone bands from the ACTIVE grain profile
   • Dots colored by the risk state captured with each reading
   • Avg reference line + threshold hairlines
   • Scrub inspection (drag / hover / arrow keys) with glass tooltip
   ═══════════════════════════════════════════════════════════════ */

type RangeId = '24h' | '7d' | '30d' | 'all';

const RANGES: { id: RangeId; label: string; ms: number | null }[] = [
  { id: '24h', label: '24H', ms: 24 * 3600e3 },
  { id: '7d', label: '7D', ms: 7 * 24 * 3600e3 },
  { id: '30d', label: '30D', ms: 30 * 24 * 3600e3 },
  { id: 'all', label: 'ALL', ms: null },
];

const SCRUB_AUTO_CLEAR_MS = 3200;
const TOOLTIP_CLAMP = 50;

const W = 358;
const H = 216;
const PAD_X = 18;
const PAD_TOP = 18;
const PAD_BOT = 24;

interface TrendPt {
  x: number;
  y: number;
  v: number;
  t: number;
  state: string;
}

function filterEntries(entries: HistoryEntry[], range: RangeId): HistoryEntry[] {
  const r = RANGES.find((x) => x.id === range);
  if (!r || r.ms == null) return entries;
  const cutoff = Date.now() - r.ms;
  return entries.filter((e) => e.reading.timestamp >= cutoff);
}

/** Smallest range with ≥2 points, falling back to ALL */
function detectRange(entries: HistoryEntry[]): RangeId {
  for (const r of RANGES) {
    if (filterEntries(entries, r.id).length >= 2) return r.id;
  }
  return 'all';
}

/** Monotone cubic Bézier (Fritsch–Carlson) — shared curve algorithm */
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

export function HistoryTrends({ entries }: { entries: HistoryEntry[] }) {
  const { settings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const accentHex = getAccentHex(settings.accentColor);
  const { safe, warn, critical } = settings.thresholds;

  const [rangeSel, setRangeSel] = useState<RangeId>(() => detectRange(entries));

  const filtered = useMemo(() => filterEntries(entries, rangeSel), [entries, rangeSel]);

  /* ── Geometry ── */
  const geo = useMemo(() => {
    if (filtered.length < 2) return null;

    // Ascending by time
    const sorted = [...filtered].sort((a, b) => a.reading.timestamp - b.reading.timestamp);
    const values = sorted.map((e) => e.reading.moisture);

    const tMin = sorted[0].reading.timestamp;
    const tMax = sorted[sorted.length - 1].reading.timestamp;
    const tRange = tMax - tMin || 1;

    const vMin = Math.min(...values, safe - 1);
    const vMax = Math.max(...values, critical + 1);
    // Include thresholds in the domain so zone bands are always visible
    const lo = Math.min(...values, safe);
    const hi = Math.max(...values, critical);
    const vPad = Math.max((hi - lo) * 0.25, 1.2);
    const vLo = lo - vPad;
    const vHi = hi + vPad;
    const vSpan = vHi - vLo;

    const drawW = W - PAD_X * 2;
    const drawH = H - PAD_TOP - PAD_BOT;

    const xOf = (ts: number) => PAD_X + ((ts - tMin) / tRange) * drawW;
    const yOf = (v: number) => PAD_TOP + drawH - ((v - vLo) / vSpan) * drawH;

    const pts: TrendPt[] = sorted.map((e) => ({
      x: xOf(e.reading.timestamp),
      y: yOf(e.reading.moisture),
      v: e.reading.moisture,
      t: e.reading.timestamp,
      state: e.decision.state,
    }));

    // Curve path
    let pathD = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (const seg of monotoneCubic(pts)) {
      pathD += ` C${seg.cp1x.toFixed(2)},${seg.cp1y.toFixed(2)} ${seg.cp2x.toFixed(2)},${seg.cp2y.toFixed(2)} ${seg.x.toFixed(2)},${seg.y.toFixed(2)}`;
    }
    const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(2)},${H - PAD_BOT} L${pts[0].x.toFixed(2)},${H - PAD_BOT} Z`;

    // Zone bands (clamped to the plot area)
    const plotBottom = H - PAD_BOT;
    const band = (vFrom: number, vTo: number) => {
      const yA = Math.max(PAD_TOP, Math.min(plotBottom, yOf(vFrom)));
      const yB = Math.max(PAD_TOP, Math.min(plotBottom, yOf(vTo)));
      return { y: Math.min(yA, yB), h: Math.abs(yB - yA) };
    };
    const critBand = band(Math.max(critical, vLo), vHi);        // above critical
    const warnBand = band(safe, critical);                       // between safe and critical
    const safeBand = band(vLo, safe);                            // below safe

    // Stats
    const avg = values.reduce((s, v) => s + v, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Dot thinning for long ranges
    const dotStep = pts.length > 60 ? Math.ceil(pts.length / 48) : 1;

    // Time axis labels: first / mid / last
    const midIdx = Math.floor(pts.length / 2);
    const fmt = (ts: number) => (rangeSel === '24h' ? format(ts, 'HH:mm') : format(ts, 'MMM d'));
    const timeLabels = [
      { x: pts[0].x, anchor: 'start' as const, label: fmt(tMin) },
      ...(pts.length > 6 ? [{ x: pts[midIdx].x, anchor: 'middle' as const, label: fmt(sorted[midIdx].reading.timestamp) }] : []),
      { x: pts[pts.length - 1].x, anchor: 'end' as const, label: fmt(tMax) },
    ];

    return { pts, pathD, fillD, critBand, warnBand, safeBand, avg, min, max, avgY: yOf(avg), dotStep, timeLabels, safeY: yOf(safe), criticalY: yOf(critical) };
  }, [filtered, safe, critical, rangeSel]);

  /* ── Scrub state (timestamp-anchored, same pattern as hero sparkline) ── */
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

  /** Switch range: clears any active scrub (selection is range-scoped) */
  const selectRange = useCallback(
    (id: RangeId) => {
      clearAutoTimer();
      draggingRef.current = false;
      setScrubSel(null);
      setRangeSel(id);
    },
    [clearAutoTimer],
  );

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

  /* ── Render ── */
  return (
    <div className="grain-trends-card mb-4" role="group" aria-label={t('history.trends_title', lang)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <ChartLine size={13} weight="bold" style={{ color: 'var(--gm-accent)' }} />
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('history.trends_title', lang)}
        </span>
        <div className="ml-auto grain-seg" role="tablist" aria-label={t('history.trends_title', lang)}>
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={rangeSel === r.id}
              className={rangeSel === r.id ? 'active' : ''}
              onClick={() => { selectRange(r.id); haptic(settings.hapticsEnabled, 6); }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart / states */}
      {!geo ? (
        <p className="text-[11px] leading-relaxed py-6 text-center" style={{ color: 'var(--gm-text-tertiary)' }}>
          {filtered.length === 0
            ? t('history.trends_empty', lang)
            : t('history.trends_need_more', lang)}
        </p>
      ) : (
        <>
          <div
            ref={wrapRef}
            className="relative w-full grain-trends-wrap"
            tabIndex={0}
            role="application"
            aria-label="Moisture trend chart. Use left and right arrow keys to inspect readings."
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
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: 'var(--gm-accent)' }} stopOpacity="0.26" />
                  <stop offset="70%" style={{ stopColor: 'var(--gm-accent)' }} stopOpacity="0.05" />
                  <stop offset="100%" style={{ stopColor: 'var(--gm-accent)' }} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Threshold zone bands */}
              <rect x={PAD_X} y={geo.critBand.y} width={W - PAD_X * 2} height={geo.critBand.h} fill="rgba(239, 68, 68, 0.10)" rx="4" />
              <rect x={PAD_X} y={geo.warnBand.y} width={W - PAD_X * 2} height={geo.warnBand.h} fill="rgba(245, 158, 11, 0.09)" rx="4" />
              <rect x={PAD_X} y={geo.safeBand.y} width={W - PAD_X * 2} height={geo.safeBand.h} fill="rgba(34, 197, 94, 0.09)" rx="4" />

              {/* Threshold hairlines + labels */}
              <line x1={PAD_X} y1={geo.safeY} x2={W - PAD_X} y2={geo.safeY} stroke="rgba(34,197,94,0.35)" strokeWidth="0.75" strokeDasharray="3,4" />
              <line x1={PAD_X} y1={geo.criticalY} x2={W - PAD_X} y2={geo.criticalY} stroke="rgba(239,68,68,0.35)" strokeWidth="0.75" strokeDasharray="3,4" />
              <text
                x={W - PAD_X - 2} y={geo.safeY - 3} textAnchor="end"
                fill="rgba(34,197,94,0.75)" stroke="rgba(0,0,0,0.18)" strokeWidth={2} paintOrder="stroke"
                fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif"
              >
                {safe}%
              </text>
              <text
                x={W - PAD_X - 2} y={geo.criticalY - 3} textAnchor="end"
                fill="rgba(239,68,68,0.75)" stroke="rgba(0,0,0,0.18)" strokeWidth={2} paintOrder="stroke"
                fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif"
              >
                {critical}%
              </text>

              {/* Area + curve */}
              <path d={geo.fillD} fill="url(#trendFill)" stroke="none" />
              <path
                d={geo.pathD}
                fill="none"
                stroke={accentHex}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Avg reference line */}
              <line
                x1={PAD_X} y1={geo.avgY} x2={W - PAD_X} y2={geo.avgY}
                stroke={accentHex} strokeOpacity="0.4" strokeWidth="0.9" strokeDasharray="5,4"
                opacity={scrubPt ? 0.35 : 1}
              />

              {/* Risk-colored dots */}
              {geo.pts.map((p, i) =>
                (i % geo.dotStep === 0 || i === geo.pts.length - 1) ? (
                  <circle
                    key={p.t}
                    cx={p.x} cy={p.y}
                    r={i === geo.pts.length - 1 ? 3.2 : 2.1}
                    fill={getRiskColor(p.state, settings.accentColor)}
                    stroke="rgba(0,0,0,0.18)"
                    strokeWidth="0.6"
                    opacity={scrubPt && scrubPt.t !== p.t ? 0.55 : 1}
                  />
                ) : null,
              )}

              {/* Scrub guide + marker */}
              {scrubPt && (
                <g>
                  <line
                    x1={scrubPt.x} y1={PAD_TOP - 4}
                    x2={scrubPt.x} y2={H - PAD_BOT + 4}
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                  <circle cx={scrubPt.x} cy={scrubPt.y} r={7} fill="rgba(255,255,255,0.14)" />
                  <circle
                    cx={scrubPt.x} cy={scrubPt.y} r={4}
                    fill={getRiskColor(scrubPt.state, settings.accentColor)}
                    stroke="#ffffff" strokeWidth="1.4"
                  />
                </g>
              )}

              {/* Time axis labels */}
              {geo.timeLabels.map((tl, i) => (
                <text
                  key={i}
                  x={tl.x}
                  y={H - 6}
                  textAnchor={tl.anchor}
                  fill="var(--gm-text-tertiary)"
                  fillOpacity="0.9"
                  fontSize="8"
                  fontWeight="600"
                  fontFamily="system-ui, sans-serif"
                >
                  {tl.label}
                </text>
              ))}
            </svg>

            {/* Glass tooltip */}
            {scrubPt && scrubSel && (
              <div
                className="grain-scrub-tooltip"
                style={{ left: scrubSel.leftPx, top: scrubSel.topPx }}
                role="status"
              >
                <span className="v">{scrubPt.v.toFixed(1)}%</span>
                <span className="t">{format(scrubPt.t, 'MMM d · HH:mm')}</span>
              </div>
            )}
          </div>

          {/* Per-range mini stats */}
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 grain-trends-stats grain-tabular">
            <MiniStat label={t('history.stat_avg', lang)} value={`${geo.avg.toFixed(1)}%`} color={accentHex} />
            <MiniStat label={t('history.stat_min', lang)} value={`${geo.min.toFixed(1)}%`} />
            <MiniStat label={t('history.stat_max', lang)} value={`${geo.max.toFixed(1)}%`} />
            <MiniStat label={t('history.trends_count', lang)} value={String(geo.pts.length)} />
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-[7.5px] font-bold tracking-[0.12em] uppercase mb-0.5 truncate" style={{ color: 'var(--gm-text-tertiary)' }}>{label}</div>
      <div className="text-[12px] font-bold leading-tight" style={{ color: color ?? 'var(--gm-text-secondary)' }}>{value}</div>
    </div>
  );
}
