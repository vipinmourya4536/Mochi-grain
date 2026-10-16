'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import type { HistoryEntry, TrendsMetric, TrendsRange } from '@/lib/grain-types';
import { MA_WINDOW_OPTIONS } from '@/lib/grain-types';
import { getAccentHex, getRiskColor } from '@/lib/accent-hex';
import { t, type AppLanguage } from '@/lib/i18n';
import { haptic } from '@/lib/haptics';
import { ChartLine, TrendUp, TrendDown, Minus, WaveSine } from '@phosphor-icons/react/dist/ssr';
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

type RangeId = Exclude<TrendsRange, 'auto'>;
type MetricId = TrendsMetric;

const RANGES: { id: RangeId; label: string; ms: number | null }[] = [
  { id: '24h', label: '24H', ms: 24 * 3600e3 },
  { id: '7d', label: '7D', ms: 7 * 24 * 3600e3 },
  { id: '30d', label: '30D', ms: 30 * 24 * 3600e3 },
  { id: 'all', label: 'ALL', ms: null },
];

const SCRUB_AUTO_CLEAR_MS = 3200;
const TOOLTIP_CLAMP = 50;
const MA_DEFAULT = 7; // fallback when the persisted window is out of range

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

/** A point where the raw curve crosses the moving-average line (momentum shift) */
interface CrossPt {
  i: number;              // index into geo.pts
  x: number;
  y: number;
  dir: 'up' | 'down';
}

interface TrendDir {
  dir: 'up' | 'down' | 'flat';
  delta: number;
  labelKey: string;
}

/** Direction + signed delta across the visible range (per metric) */
function trendDirection(delta: number, metric: MetricId): TrendDir {
  const eps = metric === 'moisture' ? 0.15 : 0.3;
  if (delta > eps) return { dir: 'up', delta, labelKey: 'history.trend_rising' };
  if (delta < -eps) return { dir: 'down', delta, labelKey: 'history.trend_falling' };
  return { dir: 'flat', delta, labelKey: 'history.trend_stable' };
}

function filterEntries(entries: HistoryEntry[], range: RangeId): HistoryEntry[] {
  const r = RANGES.find((x) => x.id === range);
  if (!r || r.ms == null) return entries;
  const cutoff = Date.now() - r.ms;
  return entries.filter((e) => e.reading.timestamp >= cutoff);
}

/** Trailing moving average with a shrinking window at the series head, so the
 *  overlay spans the full chart even for the first win-1 readings. */
function movingAverage(values: number[], win: number): number[] {
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= win) sum -= values[i - win];
    out.push(sum / Math.min(i + 1, win));
  }
  return out;
}

/** Points where the raw curve crosses the MA line — the classic momentum-shift
 *  signal. A crossing counts when the sign flips with at least one side clearly
 *  off the line; when BOTH sides hug the line it is jitter and skipped. */
function detectCrossings(values: number[], ma: number[], xOf: (i: number) => number, yOf: (v: number) => number): CrossPt[] {
  const eps = 0.05;
  const crossings: CrossPt[] = [];
  for (let i = 1; i < values.length; i++) {
    const dPrev = values[i - 1] - ma[i - 1];
    const dCur = values[i] - ma[i];
    if (Math.abs(dPrev) < eps && Math.abs(dCur) < eps) continue;
    if (dPrev < 0 && dCur > 0) crossings.push({ i, x: xOf(i), y: yOf(values[i]), dir: 'up' });
    else if (dPrev > 0 && dCur < 0) crossings.push({ i, x: xOf(i), y: yOf(values[i]), dir: 'down' });
  }
  // Long ranges: subsample so the chart stays readable (keeps most recent)
  const MAX_CROSS = 40;
  if (crossings.length > MAX_CROSS) {
    const step = Math.ceil(crossings.length / MAX_CROSS);
    return crossings.filter((_, k) => k % step === 0);
  }
  return crossings;
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
  const { settings, updateSettings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const accentHex = getAccentHex(settings.accentColor);
  const { safe, warn, critical } = settings.thresholds;

  // Advanced chart layer (MA overlay + crossings + avg line + per-range
  // stats) is opt-in so the primary chart stays clean. Session-local:
  // the default experience is the simple curve.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Moving-average window (persisted; falls back to 7 for out-of-range values)
  const maWin = MA_WINDOW_OPTIONS.includes(settings.trendsMaWindow) ? settings.trendsMaWindow : MA_DEFAULT;

  // Metric + range persist across sessions via AppSettings ('auto' re-detects)
  const [rangeSel, setRangeSel] = useState<RangeId>(() =>
    settings.trendsRange === 'auto' ? detectRange(entries) : settings.trendsRange,
  );
  const [metric, setMetric] = useState<MetricId>(settings.trendsMetric);

  const filtered = useMemo(() => filterEntries(entries, rangeSel), [entries, rangeSel]);

  /* ── Geometry ── */
  const geo = useMemo(() => {
    if (filtered.length < 2) return null;

    // Ascending by time
    const sorted = [...filtered].sort((a, b) => a.reading.timestamp - b.reading.timestamp);
    const getV = (e: HistoryEntry) =>
      metric === 'moisture' ? e.reading.moisture : e.reading.temperature;
    // Temperature is required for temp mode — tolerate legacy entries without it
    const usable = metric === 'temp'
      ? sorted.filter((e) => typeof e.reading.temperature === 'number')
      : sorted;
    if (usable.length < 2) return null;

    const values = usable.map(getV);

    const tMin = usable[0].reading.timestamp;
    const tMax = usable[usable.length - 1].reading.timestamp;
    const tRange = tMax - tMin || 1;

    let lo: number;
    let hi: number;
    let vPad: number;
    if (metric === 'moisture') {
      // Include thresholds in the domain so zone bands are always visible
      lo = Math.min(...values, safe);
      hi = Math.max(...values, critical);
      vPad = Math.max((hi - lo) * 0.25, 1.2);
    } else {
      lo = Math.min(...values);
      hi = Math.max(...values);
      vPad = Math.max((hi - lo) * 0.3, 1.5);
    }
    const vLo = lo - vPad;
    const vHi = hi + vPad;
    const vSpan = vHi - vLo;

    const drawW = W - PAD_X * 2;
    const drawH = H - PAD_TOP - PAD_BOT;

    const xOf = (ts: number) => PAD_X + ((ts - tMin) / tRange) * drawW;
    const yOf = (v: number) => PAD_TOP + drawH - ((v - vLo) / vSpan) * drawH;

    const pts: TrendPt[] = usable.map((e) => ({
      x: xOf(e.reading.timestamp),
      y: yOf(getV(e)),
      v: getV(e),
      t: e.reading.timestamp,
      state: e.decision.state,
    }));

    // Trailing moving average overlay (same x coordinates as the raw curve)
    const maValues = movingAverage(values, maWin);
    const maPts = pts.map((p, i) => ({ x: p.x, y: yOf(maValues[i]) }));
    let maPathD = '';
    if (maPts.length >= 2) {
      maPathD = `M${maPts[0].x.toFixed(2)},${maPts[0].y.toFixed(2)}`;
      for (const seg of monotoneCubic(maPts)) {
        maPathD += ` C${seg.cp1x.toFixed(2)},${seg.cp1y.toFixed(2)} ${seg.cp2x.toFixed(2)},${seg.cp2y.toFixed(2)} ${seg.x.toFixed(2)},${seg.y.toFixed(2)}`;
      }
    }

    // Momentum-shift markers: raw curve crossing the MA line
    const crossings = settings.trendsMovingAvg
      ? detectCrossings(values, maValues, (i) => pts[i].x, yOf)
      : [];

    // Curve path
    let pathD = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (const seg of monotoneCubic(pts)) {
      pathD += ` C${seg.cp1x.toFixed(2)},${seg.cp1y.toFixed(2)} ${seg.cp2x.toFixed(2)},${seg.cp2y.toFixed(2)} ${seg.x.toFixed(2)},${seg.y.toFixed(2)}`;
    }
    const fillD = `${pathD} L${pts[pts.length - 1].x.toFixed(2)},${H - PAD_BOT} L${pts[0].x.toFixed(2)},${H - PAD_BOT} Z`;

    // Zone bands (clamped to the plot area) — moisture only (thresholds are moisture-specific)
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
      ...(pts.length > 6 ? [{ x: pts[midIdx].x, anchor: 'middle' as const, label: fmt(usable[midIdx].reading.timestamp) }] : []),
      { x: pts[pts.length - 1].x, anchor: 'end' as const, label: fmt(tMax) },
    ];

    return {
      pts, pathD, fillD, critBand, warnBand, safeBand, avg, min, max,
      avgY: yOf(avg), dotStep, timeLabels,
      safeY: yOf(safe), criticalY: yOf(critical),
      trend: trendDirection(values[values.length - 1] - values[0], metric),
      maPathD, maValues, crossings,
    };
  }, [filtered, safe, critical, rangeSel, metric, maWin, settings.trendsMovingAvg]);

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

  /** Switch range or metric: clears any active scrub (selection is scope-scoped)
   *  and persists the choice so the chart reopens in the same configuration. */
  const selectRange = useCallback(
    (id: RangeId) => {
      clearAutoTimer();
      draggingRef.current = false;
      setScrubSel(null);
      setRangeSel(id);
      updateSettings({ trendsRange: id });
    },
    [clearAutoTimer, updateSettings],
  );

  const selectMetric = useCallback(
    (m: MetricId) => {
      clearAutoTimer();
      draggingRef.current = false;
      setScrubSel(null);
      setMetric(m);
      updateSettings({ trendsMetric: m });
    },
    [clearAutoTimer, updateSettings],
  );

  /** MA window select / MA toggle — persists like metric + range. */
  const selectMaWindow = useCallback(
    (w: number) => {
      haptic(settings.hapticsEnabled, 6);
      updateSettings({ trendsMaWindow: w, trendsMovingAvg: true });
    },
    [settings.hapticsEnabled, updateSettings],
  );

  const toggleMaOff = useCallback(() => {
    haptic(settings.hapticsEnabled, 6);
    updateSettings({ trendsMovingAvg: false });
  }, [settings.hapticsEnabled, updateSettings]);

  /** Index set of crossing points, for the scrub tooltip crossover row */
  const crossByIdx = useMemo(() => {
    const m = new Map<number, CrossPt>();
    if (geo) for (const c of geo.crossings) m.set(c.i, c);
    return m;
  }, [geo]);

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

  /* ── New-crossover pulse (live attention cue) ──
   * When a NEW reading extends the series AND it crosses the MA line,
   * pulse that marker once so the momentum shift is noticed even when
   * the user is not scrubbing. Signature-guarded so range/metric/window
   * switches never trigger a spurious pulse. */
  const lastCrossTopRef = useRef(-1);
  const lastSigRef = useRef('');
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pulseIdx, setPulseIdx] = useState<number | null>(null);
  const geoSig = `${rangeSel}|${metric}|${maWin}|${settings.trendsMovingAvg}`;

  useEffect(() => {
    if (!geo) {
      // Dataset gone (history cleared / tab empty) — reset tracking so the
      // next dataset never pulses off a stale comparison.
      lastCrossTopRef.current = -1;
      lastSigRef.current = '';
      return;
    }
    // Crossings are index-ascending → the last one is the most recent
    const top = geo.crossings.length > 0 ? geo.crossings[geo.crossings.length - 1].i : -1;
    const prevTop = lastCrossTopRef.current;
    const sigChanged = lastSigRef.current !== geoSig;
    lastCrossTopRef.current = top;
    lastSigRef.current = geoSig;
    if (!sigChanged && prevTop >= 0 && top > prevTop) {
      // Defer out of the effect body (no synchronous setState in effects)
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setPulseIdx(top), 0);
    }
  }, [geo, geoSig]);

  useEffect(() => () => {
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
  }, []);

  /* ── Render ── */
  const trend = geo?.trend ?? null;
  const unitSuffix = metric === 'moisture' ? '%' : '°C';
  const isMoisture = metric === 'moisture';
  const showMa = advancedOpen && settings.trendsMovingAvg;

  return (
    <div className="grain-trends-card mb-4" role="group" aria-label={t('history.trends_title', lang)}>
      {/* Header row: title + range direction chip + advanced disclosure */}
      <div className="flex items-center gap-2 mb-2">
        <ChartLine size={13} weight="bold" style={{ color: 'var(--gm-accent)' }} />
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('history.trends_title', lang)}
        </span>
        {trend && (
          <span
            className="ml-auto grain-trend-chip grain-tabular"
            style={{
              color: trend.dir === 'flat'
                ? 'var(--gm-text-secondary)'
                : isMoisture
                  ? (trend.dir === 'up' ? 'var(--gm-up)' : 'var(--gm-down)')
                  : 'var(--gm-accent)',
            }}
            role="status"
            aria-label={`${t(trend.labelKey, lang)} ${Math.abs(trend.delta).toFixed(1)}${unitSuffix}`}
          >
            {trend.dir === 'up'
              ? <TrendUp size={11} weight="bold" />
              : trend.dir === 'down'
                ? <TrendDown size={11} weight="bold" />
                : <Minus size={11} weight="bold" />}
            {(trend.delta > 0 ? '+' : '') + trend.delta.toFixed(1)}{unitSuffix}
          </span>
        )}
        {geo && (
          <button
            type="button"
            className={`grain-ma-chip grain-tabular ${advancedOpen ? 'on' : ''}`}
            aria-expanded={advancedOpen}
            aria-label={t('history.chart_options', lang)}
            title={t('history.chart_options', lang)}
            onClick={() => { haptic(settings.hapticsEnabled, 6); setAdvancedOpen((v) => !v); }}
          >
            <WaveSine size={10} weight="bold" />
            {t('history.chart_options_short', lang)}
          </button>
        )}
      </div>

      {/* Header row 2: metric toggle + range selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="grain-seg grain-seg-metric" role="tablist" aria-label={t('history.trends_title', lang)}>
          <button
            role="tab"
            aria-selected={metric === 'moisture'}
            className={metric === 'moisture' ? 'active' : ''}
            onClick={() => { selectMetric('moisture'); haptic(settings.hapticsEnabled, 6); }}
          >
            {t('hero.moisture', lang)}
          </button>
          <button
            role="tab"
            aria-selected={metric === 'temp'}
            className={metric === 'temp' ? 'active' : ''}
            onClick={() => { selectMetric('temp'); haptic(settings.hapticsEnabled, 6); }}
          >
            {t('metric.temp', lang)}
          </button>
        </div>
        <div className="grain-seg" role="tablist" aria-label={t('history.trends_title', lang)}>
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

              {/* Horizontal grid hairlines – subtle instrument feel */}
              {[0.25, 0.5, 0.75].map((f) => {
                const gy = PAD_TOP + (H - PAD_TOP - PAD_BOT) * f;
                return (
                  <line
                    key={f}
                    x1={PAD_X} y1={gy} x2={W - PAD_X} y2={gy}
                    stroke="var(--gm-separator)" strokeWidth="0.6"
                  />
                );
              })}

              {/* Threshold zone bands — moisture only (thresholds are moisture-specific) */}
              {isMoisture && (
                <>
                  <rect x={PAD_X} y={geo.critBand.y} width={W - PAD_X * 2} height={geo.critBand.h} fill="rgba(239, 68, 68, 0.10)" rx="4" />
                  <rect x={PAD_X} y={geo.warnBand.y} width={W - PAD_X * 2} height={geo.warnBand.h} fill="rgba(245, 158, 11, 0.09)" rx="4" />
                  <rect x={PAD_X} y={geo.safeBand.y} width={W - PAD_X * 2} height={geo.safeBand.h} fill="rgba(34, 197, 94, 0.09)" rx="4" />
                </>
              )}

              {/* Threshold hairlines + labels — moisture only */}
              {isMoisture && (
                <>
                  <line x1={PAD_X} y1={geo.safeY} x2={W - PAD_X} y2={geo.safeY} stroke="rgba(34,197,94,0.35)" strokeWidth="0.75" strokeDasharray="3,4" />
                  <line x1={PAD_X} y1={geo.criticalY} x2={W - PAD_X} y2={geo.criticalY} stroke="rgba(239,68,68,0.35)" strokeWidth="0.75" strokeDasharray="3,4" />
                  <text
                    x={W - PAD_X - 2} y={geo.safeY - 3} textAnchor="end"
                    className="grain-trend-thresh grain-trend-thresh-safe"
                    fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif"
                  >
                    {safe}%
                  </text>
                  <text
                    x={W - PAD_X - 2} y={geo.criticalY - 3} textAnchor="end"
                    className="grain-trend-thresh grain-trend-thresh-crit"
                    fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif"
                  >
                    {critical}%
                  </text>
                </>
              )}

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

              {/* Moving-average overlay + crossings + avg reference — advanced layer only */}
              {showMa && geo.maPathD && (
                <path
                  d={geo.maPathD}
                  fill="none"
                  className="grain-trends-ma"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity={scrubPt ? 0.45 : 0.95}
                />
              )}

              {/* MA-crossover momentum markers (raw × MA sign change) — advanced only */}
              {showMa && geo.crossings.length > 0 && (
                <g className="grain-scrub-group">
                  {geo.crossings.map((c) => (
                    <circle
                      /* Key includes the pulse flag → the pulsing marker REMOUNTS,
                       * which (re)starts the one-shot animation reliably even when the
                       * element already existed before the new crossing appeared. */
                      key={`cx-${c.i}${c.i === pulseIdx ? '·pulse' : ''}`}
                      cx={c.x}
                      cy={c.y}
                      r={2.9}
                      fill="var(--gm-card)"
                      className={`grain-cross-marker${c.i === pulseIdx ? ' grain-cross-pulse' : ''}`}
                      stroke={isMoisture
                        ? (c.dir === 'up' ? 'var(--gm-up)' : 'var(--gm-down)')
                        : accentHex}
                      strokeWidth="1.3"
                      opacity={scrubPt && scrubIdx !== c.i ? 0.45 : 1}
                    >
                      <title>{t(c.dir === 'up' ? 'history.cross_up' : 'history.cross_down', lang)}</title>
                    </circle>
                  ))}
                </g>
              )}

              {/* Avg reference line — advanced layer only */}
              {showMa && (
                <line
                  x1={PAD_X} y1={geo.avgY} x2={W - PAD_X} y2={geo.avgY}
                  stroke={accentHex} strokeOpacity="0.4" strokeWidth="0.9" strokeDasharray="5,4"
                  opacity={scrubPt ? 0.35 : 1}
                />
              )}

              {/* Risk-colored dots (moisture) / accent dots (temp) */}
              {geo.pts.map((p, i) =>
                (i % geo.dotStep === 0 || i === geo.pts.length - 1) ? (
                  <circle
                    key={p.t}
                    cx={p.x} cy={p.y}
                    r={i === geo.pts.length - 1 ? 3.2 : 2.1}
                    fill={isMoisture ? getRiskColor(p.state, settings.accentColor) : accentHex}
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
                    stroke="var(--gm-text-tertiary)"
                    strokeOpacity="0.55"
                    strokeWidth="1"
                    strokeDasharray="2,3"
                  />
                  <circle cx={scrubPt.x} cy={scrubPt.y} r={7} fill="rgba(255,255,255,0.14)" />
                  <circle
                    cx={scrubPt.x} cy={scrubPt.y} r={4}
                    fill={isMoisture ? getRiskColor(scrubPt.state, settings.accentColor) : accentHex}
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
                <span className="v">{scrubPt.v.toFixed(1)}{unitSuffix}</span>
                {settings.trendsMovingAvg && geo && scrubIdx >= 0 && geo.maValues[scrubIdx] != null && (
                  <span className="ma">MA{maWin} {geo.maValues[scrubIdx].toFixed(1)}{unitSuffix}</span>
                )}
                {crossByIdx.has(scrubIdx) && (
                  <span className="x" style={{ color: isMoisture
                    ? (crossByIdx.get(scrubIdx)!.dir === 'up' ? 'var(--gm-up)' : 'var(--gm-down)')
                    : 'var(--gm-accent)' }}>
                    {crossByIdx.get(scrubIdx)!.dir === 'up' ? '↗' : '↘'} {t(crossByIdx.get(scrubIdx)!.dir === 'up' ? 'history.cross_up' : 'history.cross_down', lang)}
                  </span>
                )}
                <span className="t">{format(scrubPt.t, 'MMM d · HH:mm')}</span>
              </div>
            )}
          </div>

          {/* Advanced layer: MA controls + per-range mini stats.
              Collapsed by default — the primary chart stays readable. */}
          {advancedOpen && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--gm-separator)' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                {settings.trendsMovingAvg ? (
                  <div className="grain-ma-seg grain-tabular" role="group" aria-label={t('history.trends_ma_win', lang)}>
                    <span className="ma-cap" aria-hidden="true">MA</span>
                    <button
                      type="button"
                      className="ma-off"
                      onClick={toggleMaOff}
                      aria-label={t('history.trends_ma', lang)}
                      title={t('history.trends_ma', lang)}
                    >
                      <WaveSine size={10} weight="bold" />
                    </button>
                    {MA_WINDOW_OPTIONS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        className={w === maWin ? 'active' : ''}
                        aria-pressed={w === maWin}
                        onClick={() => selectMaWindow(w)}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="grain-ma-chip grain-tabular"
                    aria-pressed={false}
                    aria-label={t('history.trends_ma', lang)}
                    onClick={() => selectMaWindow(maWin)}
                  >
                    <WaveSine size={10} weight="bold" />
                    MA{maWin}
                  </button>
                )}
                <span className="text-[9px] font-semibold" style={{ color: 'var(--gm-text-tertiary)' }}>
                  {t('history.chart_options_hint', lang)}
                </span>
              </div>
              {geo && (
                <div className="grid grid-cols-4 gap-2 mt-3 grain-trends-stats grain-tabular">
                  <MiniStat
                    label={isMoisture ? t('history.stat_avg', lang) : t('history.stat_temp', lang)}
                    value={`${geo.avg.toFixed(1)}${unitSuffix}`}
                    color={accentHex}
                  />
                  <MiniStat label={t('history.stat_min', lang)} value={`${geo.min.toFixed(1)}${unitSuffix}`} />
                  <MiniStat label={t('history.stat_max', lang)} value={`${geo.max.toFixed(1)}${unitSuffix}`} />
                  <MiniStat label={t('history.trends_count', lang)} value={String(geo.pts.length)} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center">
      <div className="text-[7.5px] font-bold tracking-[0.12em] uppercase mb-0.5 truncate" style={{ color: 'var(--gm-text-tertiary)' }}>{label}</div>
      <div className="text-[12px] font-bold leading-tight grain-tabular" style={{ color: color ?? 'var(--gm-text-secondary)' }}>{value}</div>
    </div>
  );
}
