'use client';

import { useMemo } from 'react';

interface SparklineChartProps {
  data: number[];
  height?: number;
  width?: number;
}

export function SparklineChart({ data, height = 60, width = 300 }: SparklineChartProps) {
  const { path, fillPath } = useMemo(() => {
    if (data.length < 2) return { path: '', fillPath: '' };

    const padding = 4;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    let p = '';
    let fp = '';

    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      p += (i === 0 ? 'M' : 'L') + x + ',' + y;
      if (i === 0) fp = 'M' + x + ',' + height + ' L' + x + ',' + y;
      else fp += ' L' + x + ',' + y;
    });
    fp += ' L' + width + ',' + height + ' Z';

    return { path: p, fillPath: fp };
  }, [data, width, height]);

  if (!path) return null;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grainSparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} className="grain-sparkline-fill" />
      <path d={path} className="grain-sparkline" />
    </svg>
  );
}
