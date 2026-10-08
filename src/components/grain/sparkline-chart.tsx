'use client';

import { useMemo } from 'react';
import type { SparklinePoint } from '@/lib/grain-store';

interface SparklineChartProps {
  data: SparklinePoint[];
  height?: number;
  width?: number;
  /** If provided, shows a countdown indicator for the next reading */
  nextReadingCountdown?: number | null;
  /** Interval label e.g. "10 min" */
  intervalLabel?: string;
}

/**
 * Professional sparkline chart with:
 * - Smooth cubic Bézier curves (monotone interpolation)
 * - Time-proportional X-axis spacing
 * - Gradient fill under curve
 * - Time axis labels (first, middle, last)
 * - Min/Max value annotations
 * - Highlighted latest point with pulse
 * - Optional countdown indicator for demo mode
 */

export function SparklineChart({
  data,
  height = 120,
  width = 340,
  nextReadingCountdown,
  intervalLabel,
}: SparklineChartProps) {
  const {
    curvePath,
    fillPath,
    dotPositions,
    lastDot,
    firstPt,
    lastPt,
    minPt,
    maxPt,
    timeLabels,
  } = useMemo(() => {
    if (data.length < 2)
      return {
        curvePath: '',
        fillPath: '',
        dotPositions: [],
        lastDot: null,
        firstPt: null,
        lastPt: null,
        minPt: null,
        maxPt: null,
        timeLabels: [],
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

    // Map data to pixel coordinates
    const pts = data.map((d) => ({
      x: padX + ((d.t - tMin) / tRange) * drawW,
      y: padTop + drawH - ((d.v - vLo) / vSpan) * drawH,
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
      firstPt: pts[0],
      lastPt: last,
      minPt: { x: pts[minIdx].x, y: pts[minIdx].y, v: values[minIdx] },
      maxPt: { x: pts[maxIdx].x, y: pts[maxIdx].y, v: values[maxIdx] },
      timeLabels,
    };
  }, [data, width, height]);

  if (!curvePath) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
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
              fill="rgba(255,255,255,0.25)"
            />
          ) : null,
      )}

      {/* Highlighted latest point */}
      {lastDot && (
        <>
          <circle
            cx={lastDot.x}
            cy={lastDot.y}
            r={8}
            fill="rgba(255,255,255,0.10)"
            className="grain-sparkline-pulse"
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

      {/* Min value annotation */}
      {minPt && (
        <text
          x={Math.min(Math.max(minPt.x, 50), width - 50)}
          y={Math.min(minPt.y + 14, height - 24)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="8"
          fontFamily="monospace"
        >
          {minPt.v.toFixed(1)}%
        </text>
      )}

      {/* Max value annotation */}
      {maxPt && (
        <text
          x={Math.min(Math.max(maxPt.x, 50), width - 50)}
          y={Math.max(maxPt.y - 6, 12)}
          textAnchor="middle"
          fill="rgba(255,255,255,0.3)"
          fontSize="8"
          fontFamily="monospace"
        >
          {maxPt.v.toFixed(1)}%
        </text>
      )}

      {/* Time axis labels */}
      {timeLabels.map((tl, i) => (
        <text
          key={i}
          x={tl.x}
          y={height - 4}
          textAnchor={i === 0 ? 'start' : i === timeLabels.length - 1 ? 'end' : 'middle'}
          fill="rgba(255,255,255,0.25)"
          fontSize="7.5"
          fontFamily="system-ui, sans-serif"
        >
          {tl.label}
        </text>
      ))}

      {/* Countdown indicator for demo mode */}
      {nextReadingCountdown != null && (
        <>
          {/* Pulsing dot at right edge */}
          <circle
            cx={width - 16}
            cy={12}
            r={3}
            fill="#22C55E"
            opacity={0.8}
          >
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
          <text
            x={width - 24}
            y={15}
            textAnchor="end"
            fill="#22C55E"
            fontSize="8"
            fontWeight="600"
            fontFamily="system-ui, sans-serif"
            letterSpacing="0.05em"
          >
            {formatCountdown(nextReadingCountdown)}
          </text>
        </>
      )}

      {/* Interval label (bottom-right) */}
      {intervalLabel && (
        <text
          x={width - 4}
          y={height - 4}
          textAnchor="end"
          fill="rgba(255,255,255,0.18)"
          fontSize="7"
          fontFamily="system-ui, sans-serif"
        >
          Δ {intervalLabel}
        </text>
      )}
    </svg>
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

/** Format countdown seconds to human-readable */
function formatCountdown(sec: number): string {
  if (sec <= 0) return '...';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}:${String(rm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
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
