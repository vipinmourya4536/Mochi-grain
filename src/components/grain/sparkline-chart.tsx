'use client';

import { useMemo } from 'react';
import type { SparklinePoint } from '@/lib/grain-store';

interface SparklineChartProps {
  data: SparklinePoint[];
  height?: number;
  width?: number;
}

/**
 * Professional sparkline chart with:
 * - Smooth cubic Bézier curves (monotone interpolation)
 * - Time-proportional X-axis spacing
 * - Gradient fill under curve
 * - Highlighted latest point
 * - Subtle dot markers
 */

export function SparklineChart({ data, height = 72, width = 320 }: SparklineChartProps) {
  const { curvePath, fillPath, dotPositions, lastDot } = useMemo(() => {
    if (data.length < 2) return { curvePath: '', fillPath: '', dotPositions: [], lastDot: null };

    const padX = 6;
    const padY = 6;
    const drawW = width - padX * 2;
    const drawH = height - padY * 2;

    // Time-proportional X positions
    const timestamps = data.map((d) => d.t);
    const tMin = timestamps[0];
    const tMax = timestamps[timestamps.length - 1];
    const tRange = tMax - tMin || 1;

    const values = data.map((d) => d.v);
    const vMin = Math.min(...values);
    const vMax = Math.max(...values);
    const vRange = vMax - vMin || 1;
    // Add 15% padding to value range so curve doesn't touch edges
    const vPad = vRange * 0.15;
    const vLo = vMin - vPad;
    const vHi = vMax + vPad;
    const vSpan = vHi - vLo;

    // Map data to pixel coordinates
    const pts = data.map((d) => ({
      x: padX + ((d.t - tMin) / tRange) * drawW,
      y: padY + drawH - ((d.v - vLo) / vSpan) * drawH,
    }));

    // Monotone cubic Bézier interpolation
    // Produces smooth curves that pass through every data point
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
    const fillD = `${pathD} L${last.x.toFixed(2)},${(height).toFixed(1)} L${first.x.toFixed(2)},${(height).toFixed(1)} Z`;

    // Dot positions (show every other point if > 10, else all)
    const step = data.length > 10 ? 2 : 1;
    const dots: { x: number; y: number; isLast: boolean }[] = [];
    for (let i = 0; i < pts.length; i++) {
      const isLast = i === pts.length - 1;
      if (isLast || i % step === 0) {
        dots.push({ x: pts[i].x, y: pts[i].y, isLast });
      }
    }

    return {
      curvePath: pathD,
      fillPath: fillD,
      dotPositions: dots,
      lastDot: { x: last.x, y: last.y },
    };
  }, [data, width, height]);

  if (!curvePath) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grainSparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Glow filter for the line */}
        <filter id="sparkGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Gradient fill under curve */}
      <path d={fillPath} className="grain-sparkline-fill" />

      {/* Main curve with glow */}
      <path d={curvePath} className="grain-sparkline" filter="url(#sparkGlow)" />

      {/* Subtle dot markers */}
      {dotPositions.map((dot, i) =>
        !dot.isLast ? (
          <circle
            key={i}
            cx={dot.x}
            cy={dot.y}
            r={1.8}
            fill="rgba(255,255,255,0.3)"
          />
        ) : null,
      )}

      {/* Highlighted latest point */}
      {lastDot && (
        <>
          <circle
            cx={lastDot.x}
            cy={lastDot.y}
            r={6}
            fill="rgba(255,255,255,0.15)"
            className="grain-sparkline-pulse"
          />
          <circle
            cx={lastDot.x}
            cy={lastDot.y}
            r={3}
            fill="#ffffff"
            className="grain-sparkline-dot"
          />
        </>
      )}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Monotone Cubic Interpolation (Fritsch-Carlson method)
   Produces smooth curves through all data points without
   overshooting – ideal for sensor data visualization.
   ═══════════════════════════════════════════════════════════════ */

interface Pt { x: number; y: number };
interface BezierSeg { x: number; y: number; cp1x: number; cp1y: number; cp2x: number; cp2y: number };

function monotoneCubic(pts: Pt[]): BezierSeg[] {
  const n = pts.length;
  if (n < 2) return [];

  // Compute slopes between adjacent points
  const dx: number[] = [];
  const dy: number[] = [];
  const m: number[] = []; // secant slopes

  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    dy.push(pts[i + 1].y - pts[i].y);
    m.push(dy[i] / (dx[i] || 1));
  }

  // Tangents at each point (Fritsch-Carlson)
  const c: number[] = [m[0]]; // first tangent = first secant
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      c.push(0);
    } else {
      const common = dx[i - 1] + dx[i];
      c.push(3 * common / ((common + dx[i]) / m[i - 1] + (common + dx[i - 1]) / m[i]));
    }
  }
  c.push(m[n - 2]); // last tangent = last secant

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
      cp1x: p0.x + (segDx / 3),
      cp1y: p0.y + (segDx / 3) * c[i],
      cp2x: p1.x - (segDx / 3),
      cp2y: p1.y - (segDx / 3) * c[i + 1],
    });
  }

  return segs;
}
