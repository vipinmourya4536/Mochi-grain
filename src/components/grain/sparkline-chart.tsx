'use client';

import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import type { SparklinePoint } from '@/lib/grain-store';
import { haptic } from '@/lib/haptics';

interface SparklineChartProps {
  data: SparklinePoint[];
  height?: number;
  width?: number;
  /** Master haptics toggle from settings (drives the scrub tick) */
  hapticsEnabled?: boolean;
  /** Microcopy shown top-center until the first scrub (translated by parent) */
  scrubHint?: string;
}

interface ChartPt {
  x: number;
  y: number;
  v: number;
  t: number;
}

/**
 * Professional sparkline chart with:
 * - Smooth cubic Bézier curves (monotone interpolation)
 * - Time-proportional X-axis spacing
 * - Gradient fill under curve
 * - Time axis labels (first, middle, last)
 * - Min/Max value annotations
 * - Highlighted latest point with pulse
 * - SCRUB INSPECTION: pointer/touch drag or ←/→ keys inspect any historical
 *   point, with a glass tooltip (value + time), guide line and haptic tick.
 */

const SCRUB_AUTO_CLEAR_MS = 2800;
const TOOLTIP_CLAMP = 46;

export function SparklineChart({
  data,
  height = 120,
  width = 340,
  hapticsEnabled = true,
  scrubHint,
}: SparklineChartProps) {
  const {
    curvePath,
    fillPath,
    dotPositions,
    lastDot,
    minPt,
    maxPt,
    timeLabels,
    pts,
  } = useMemo(() => {
    if (data.length < 2)
      return {
        curvePath: '',
        fillPath: '',
        dotPositions: [],
        lastDot: null,
        minPt: null,
        maxPt: null,
        timeLabels: [],
        pts: [] as ChartPt[],
      };

    const padX = 32;
    const padTop = 14;
    const padBot = 20;
    const drawW = width - padX * 2;
    const drawH = height - padTop - padBot;

    // Time-proportional X positions
    const timestamps = data.map((d) => d.t);
    const tMin = timestamps[0];
    const tMax = timestamps[timestamps.length - 1];
    const tRange = tMax - tMin || 1;

    const values = data.map((d) => d.v);
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const vRange = vMax - vMin || 1;
    // Add 20% padding to value range
    const vPad = vRange * 0.2;
    const vLo = vMin - vPad;
    const vHi = vMax + vPad;
    const vSpan = vHi - vLo;

    // Map data to pixel coordinates (kept for scrub interaction)
    const pts: ChartPt[] = data.map((d) => ({
      x: padX + ((d.t - tMin) / tRange) * drawW,
      y: padTop + drawH - ((d.v - vLo) / vSpan) * drawH,
      v: d.v,
      t: d.t,
    }));

    // Monotone cubic Bézier interpolation
    const curve = monotoneCubic(pts);

    // Build SVG path string
    let pathD = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
    for (let i = 0; i < curve.length; i++) {
      const c = curve[i];
      pathD += ` C${c.cp1x.toFixed(2)},${c.cp1y.toFixed(2)} ${c.cp2x.toFixed(2)},${c.cp2y.toFixed(2)} ${c.x.toFixed(2)},${c.y.toFixed(2)}`;
    }

    // Fill path: same curve + close to bottom
    const last = pts[pts.length - 1];
    const first = pts[0];
    const bottomY = height - padBot;
    const fillD = `${pathD} L${last.x.toFixed(2)},${bottomY} L${first.x.toFixed(2)},${bottomY} Z`;

    // Dot positions: show all if ≤8, every other if >8
    const step = data.length > 8 ? 2 : 1;
    const dots: { x: number; y: number; isLast: boolean }[] = [];
    for (let i = 0; i < pts.length; i++) {
      const isLast = i === pts.length - 1;
      if (isLast || i % step === 0) {
        dots.push({ x: pts[i].x, y: pts[i].y, isLast });
      }
    }

    // Min/max points
    let minIdx = 0, maxIdx = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] < values[minIdx]) minIdx = i;
      if (values[i] > values[maxIdx]) maxIdx = i;
    }

    // Time labels: first, middle, last
    const timeLabels: { x: number; label: string }[] = [];
    const midIdx = Math.floor(pts.length / 2);
    timeLabels.push({
      x: first.x,
      label: formatTime(tMin),
    });
    if (pts.length > 4) {
      timeLabels.push({
        x: pts[midIdx].x,
        label: formatTime(timestamps[midIdx]),
      });
    }
    timeLabels.push({
      x: last.x,
      label: formatTime(tMax),
    });

    return {
      curvePath: pathD,
      fillPath: fillD,
      dotPositions: dots,
      lastDot: { x: last.x, y: last.y },
      minPt: { x: pts[minIdx].x, y: pts[minIdx].y, v: values[minIdx] },
      maxPt: { x: pts[maxIdx].x, y: pts[maxIdx].y, v: values[maxIdx] },
      timeLabels,
      pts,
    };
  }, [data, width, height]);

  /* ═══ Scrub interaction state ═══
     Selection is stored as the TIMESTAMP of the scrubbed point (not the
     index) so incoming readings never invalidate it: if the point ages out
     of the rolling window the tooltip simply disappears — no reset effect. */
  const [scrubSel, setScrubSel] = useState<{ t: number; leftPx: number; topPx: number } | null>(null);
  const [hasScrubbed, setHasScrubbed] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const autoClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrubPt = useMemo(
    () => (scrubSel ? pts.find((p) => p.t === scrubSel.t) ?? null : null),
    [pts, scrubSel],
  );

  /** Index of the scrubbed point, or -1 when nothing is selected / aged out */
  const scrubIdx = useMemo(
    () => (scrubSel ? pts.findIndex((p) => p.t === scrubSel.t) : -1),
    [pts, scrubSel],
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

  /** Map a client (pointer) position to viewBox coordinates via the SVG CTM */
  const clientToViewBox = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    // DOMPoint is widely supported; fall back to manual matrix math
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

  /** Nearest data-point index for a viewBox x (points are x-monotonic) */
  const nearestIndex = useCallback(
    (vx: number): number => {
      if (pts.length === 0) return -1;
      let lo = 0;
      let hi = pts.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (pts[mid].x < vx) lo = mid;
        else hi = mid;
      }
      return Math.abs(pts[lo].x - vx) <= Math.abs(pts[hi].x - vx) ? lo : hi;
    },
    [pts],
  );

  /** Compute container-relative tooltip anchor for point index i */
  const anchorFor = useCallback((i: number): { leftPx: number; topPx: number } | null => {
    const svg = svgRef.current;
    const wrap = wrapRef.current;
    if (!svg || !wrap || i < 0 || i >= pts.length) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = pts[i];
    // Map viewBox coords back to client coords
    let cx: number;
    let cy: number;
    if (typeof DOMPoint === 'function') {
      const sp = new DOMPoint(pt.x, pt.y).matrixTransform(ctm);
      cx = sp.x;
      cy = sp.y;
    } else {
      cx = pt.x * ctm.a + pt.y * ctm.c + ctm.e;
      cy = pt.x * ctm.b + pt.y * ctm.d + ctm.f;
    }
    const rect = wrap.getBoundingClientRect();
    const leftPx = Math.min(Math.max(cx - rect.left, TOOLTIP_CLAMP), Math.max(rect.width - TOOLTIP_CLAMP, TOOLTIP_CLAMP));
    const topPx = cy - rect.top;
    return { leftPx, topPx };
  }, [pts]);

  const scrubToViewBoxX = useCallback(
    (vx: number) => {
      const i = nearestIndex(vx);
      if (i < 0) return;
      const anchor = anchorFor(i);
      if (!anchor) return;
      const sel = { t: pts[i].t, ...anchor };
      setScrubSel((prev) => {
        if (prev && prev.t !== sel.t) haptic(hapticsEnabled, 4);
        return sel;
      });
      if (!hasScrubbed) setHasScrubbed(true);
    },
    [nearestIndex, anchorFor, hapticsEnabled, hasScrubbed, pts],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (pts.length < 2) return;
      clearAutoTimer();
      draggingRef.current = true;
      try { svgRef.current?.setPointerCapture(e.pointerId); } catch { /* no-op */ }
      const p = clientToViewBox(e.clientX, e.clientY);
      if (p) scrubToViewBoxX(p.x);
    },
    [pts.length, clearAutoTimer, clientToViewBox, scrubToViewBoxX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (pts.length < 2) return;
      // Desktop hover-scrub (no button pressed) or active drag
      const hoverScrub = e.pointerType === 'mouse' && e.buttons === 0;
      if (!draggingRef.current && !hoverScrub) return;
      const p = clientToViewBox(e.clientX, e.clientY);
      if (p) scrubToViewBoxX(p.x);
    },
    [pts.length, clientToViewBox, scrubToViewBoxX],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      draggingRef.current = false;
      try { svgRef.current?.releasePointerCapture(e.pointerId); } catch { /* no-op */ }
      // Touch: keep the inspection visible briefly, then fade back to live
      if (e.pointerType !== 'mouse') {
        clearAutoTimer();
        autoClearRef.current = setTimeout(() => setScrubSel(null), SCRUB_AUTO_CLEAR_MS);
      }
    },
    [clearAutoTimer],
  );

  const onPointerLeave = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      // Mouse hover left the chart → clear unless a drag is in progress
      if (e.pointerType === 'mouse' && !draggingRef.current) setScrubSel(null);
    },
    [],
  );

  /* Keyboard scrubbing (a11y): ←/→ step through points */
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (pts.length < 2) return;
      const lastIdx = pts.length - 1;
      if (e.key === 'Escape') {
        clearScrub();
        return;
      }
      let next: number | null = null;
      const cur = scrubIdx >= 0 ? scrubIdx : null;
      if (e.key === 'ArrowLeft') next = Math.max(0, (cur ?? lastIdx) - 1);
      else if (e.key === 'ArrowRight') next = Math.min(lastIdx, (cur ?? lastIdx - 1) + 1);
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = lastIdx;
      if (next === null) return;
      e.preventDefault();
      clearAutoTimer();
      const anchor = anchorFor(next);
      if (!anchor) return;
      const sel = { t: pts[next].t, ...anchor };
      setScrubSel((prev) => {
        if (prev && prev.t !== sel.t) haptic(hapticsEnabled, 4);
        return sel;
      });
      if (!hasScrubbed) setHasScrubbed(true);
    },
    [pts, scrubIdx, clearScrub, clearAutoTimer, anchorFor, hapticsEnabled, hasScrubbed],
  );

  const onBlur = useCallback(() => clearScrub(), [clearScrub]);

  if (!curvePath) return null;

  const scrubX = scrubPt?.x ?? 0;
  const scrubY = scrubPt?.y ?? 0;

  return (
    <div
      ref={wrapRef}
      className="relative w-full h-full grain-spark-wrap"
      tabIndex={0}
      role="application"
      aria-label="Moisture history chart. Use left and right arrow keys to inspect readings."
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full grain-spark-svg"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <defs>
          <linearGradient id="grainSparkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.20" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          {/* Glow filter for the line */}
          <filter id="sparkGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Horizontal grid lines (subtle) */}
        {minPt && maxPt && (
          <>
            <line
              x1={32} y1={maxPt.y}
              x2={width - 32}
              y2={maxPt.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
            <line
              x1={32} y1={minPt.y}
              x2={width - 32}
              y2={minPt.y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
              strokeDasharray="3,3"
            />
          </>
        )}

        {/* Gradient fill under curve */}
        <path d={fillPath} className="grain-sparkline-fill" />

        {/* Main curve with glow */}
        <path d={curvePath} className="grain-sparkline" filter="url(#sparkGlow)" />

        {/* Subtle dot markers */}
        {dotPositions.map(
          (dot, i) =>
            !dot.isLast ? (
              <circle
                key={i}
                cx={dot.x}
                cy={dot.y}
                r={2}
                fill="rgba(255,255,255,0.4)"
              />
            ) : null,
        )}

        {/* Highlighted latest point (dimmed while scrubbing another point) */}
        {lastDot && (
          <>
            <circle
              cx={lastDot.x}
              cy={lastDot.y}
              r={8}
              fill="rgba(255,255,255,0.10)"
              className="grain-sparkline-pulse"
              opacity={scrubPt ? 0.25 : 1}
            />
            <circle
              cx={lastDot.x}
              cy={lastDot.y}
              r={3.5}
              fill="#ffffff"
              className="grain-sparkline-dot"
            />
          </>
        )}

        {/* ── Scrub guide + marker ── */}
        {scrubPt && (
          <g className="grain-scrub-group">
            <line
              x1={scrubX} y1={10}
              x2={scrubX} y2={height - 22}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1"
              strokeDasharray="2,3"
            />
            <circle cx={scrubX} cy={scrubY} r={6.5} fill="rgba(255,255,255,0.15)" />
            <circle cx={scrubX} cy={scrubY} r={3.5} fill="#ffffff" stroke="rgba(0,0,0,0.25)" strokeWidth="0.75" />
          </g>
        )}

        {/* Min value annotation (theme-aware class for legibility) */}
        {minPt && (
          <text
            x={Math.min(Math.max(minPt.x, 50), width - 50)}
            y={Math.min(minPt.y + 14, height - 24)}
            textAnchor="middle"
            className="grain-spark-text"
            fontSize="8"
            fontWeight="600"
            fontFamily="monospace"
            opacity={scrubPt ? 0.35 : 1}
          >
            {minPt.v.toFixed(1)}%
          </text>
        )}

        {/* Max value annotation (theme-aware class for legibility) */}
        {maxPt && (
          <text
            x={Math.min(Math.max(maxPt.x, 50), width - 50)}
            y={Math.max(maxPt.y - 6, 12)}
            textAnchor="middle"
            className="grain-spark-text"
            fontSize="8"
            fontWeight="600"
            fontFamily="monospace"
            opacity={scrubPt ? 0.35 : 1}
          >
            {maxPt.v.toFixed(1)}%
          </text>
        )}

        {/* Time axis labels (theme-aware class for legibility) */}
        {timeLabels.map((tl, i) => (
          <text
            key={i}
            x={tl.x}
            y={height - 4}
            textAnchor={i === 0 ? 'start' : i === timeLabels.length - 1 ? 'end' : 'middle'}
            className="grain-spark-text"
            fontSize="7.5"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
          >
            {tl.label}
          </text>
        ))}

        {/* First-run scrub hint (fades out after first interaction) */}
        {scrubHint && !hasScrubbed && data.length >= 4 && (
          <text
            x={width / 2}
            y={12}
            textAnchor="middle"
            className="grain-spark-text"
            fontSize="7.5"
            fontWeight="600"
            letterSpacing="0.12em"
            fontFamily="system-ui, sans-serif"
            style={{ textTransform: 'uppercase' }}
          >
            {scrubHint}
          </text>
        )}
      </svg>

      {/* ── Scrub tooltip (HTML overlay for glass rendering) ── */}
      {scrubPt && scrubSel && (
        <div
          className="grain-scrub-tooltip"
          style={{ left: scrubSel.leftPx, top: scrubSel.topPx }}
          role="status"
        >
          <span className="v">{scrubPt.v.toFixed(1)}%</span>
          <span className="t">{formatTime(scrubPt.t)}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════ */

/** Format timestamp to HH:MM */
function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════════════════
   Monotone Cubic Interpolation (Fritsch-Carlson method)
   Produces smooth curves through all data points without
   overshooting – ideal for sensor data visualization.
   ═══════════════════════════════════════════════════════════════ */

interface Pt {
  x: number;
  y: number;
}
interface BezierSeg {
  x: number;
  y: number;
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
}

function monotoneCubic(pts: Pt[]): BezierSeg[] {
  const n = pts.length;
  if (n < 2) return [];

  // Compute slopes between adjacent points
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    dy.push(pts[i + 1].y - pts[i].y);
    m.push(dy[i] / (dx[i] || 1));
  }

  // Tangents at each point (Fritsch-Carlson)
  const c: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      c.push(0);
    } else {
      const common = dx[i - 1] + dx[i];
      c.push(
        (3 * common) /
          ((common + dx[i]) / m[i - 1] + (common + dx[i - 1]) / m[i]),
      );
    }
  }
  c.push(m[n - 2]);

  // Clamp tangents to prevent overshoot
  for (let i = 0; i < n - 1; i++) {
    const acc = c[i] / (m[i] || 1);
    const succ = c[i + 1] / (m[i] || 1);
    if (acc < 0 || succ < 0) {
      c[i] = 0;
      c[i + 1] = 0;
    }
  }

  // Build Bézier segments
  const segs: BezierSeg[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const segDx = dx[i];

    segs.push({
      x: p1.x,
      y: p1.y,
      cp1x: p0.x + segDx / 3,
      cp1y: p0.y + (segDx / 3) * c[i],
      cp2x: p1.x - segDx / 3,
      cp2y: p1.y - (segDx / 3) * c[i + 1],
    });
  }

  return segs;
}
