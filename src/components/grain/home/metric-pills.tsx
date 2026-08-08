'use client';

import { useGrainStore } from '@/lib/grain-store';
import { GRAIN_LABELS } from '@/lib/grain-types';

export function MetricPills() {
  const { currentReading, deviceInfo } = useGrainStore();

  if (!currentReading || !deviceInfo) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#a1a1aa' }}>
          Temp
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: '#f4f4f5' }}>
            {Math.round(currentReading.temperature)}
          </span>
          <span className="text-xs font-medium" style={{ color: '#a1a1aa' }}>°C</span>
        </div>
      </div>
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#a1a1aa' }}>
          Signal
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: '#f4f4f5' }}>
            {deviceInfo.signal}
          </span>
          <span className="text-xs font-medium" style={{ color: '#a1a1aa' }}>%</span>
        </div>
      </div>
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#a1a1aa' }}>
          Grain
        </div>
        <div className="text-lg font-bold tracking-tight" style={{ color: '#f4f4f5' }}>
          {GRAIN_LABELS[currentReading.grainType] || currentReading.grainType}
        </div>
      </div>
    </div>
  );
}
