'use client';

import { useGrainStore } from '@/lib/grain-store';
import { GRAIN_LABELS } from '@/lib/grain-types';
import { t } from '@/lib/i18n';

export function MetricPills() {
  const { currentReading, deviceInfo, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  if (!currentReading || !deviceInfo) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
          {t('metric.temp', lang)}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>
            {Math.round(currentReading.temperature)}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--gm-text-secondary)' }}>°C</span>
        </div>
      </div>
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
          {t('metric.signal', lang)}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>
            {deviceInfo.signal}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--gm-text-secondary)' }}>%</span>
        </div>
      </div>
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
          {t('metric.grain', lang)}
        </div>
        <div className="text-lg font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
          {GRAIN_LABELS[currentReading.grainType] || currentReading.grainType}
        </div>
      </div>
    </div>
  );
}
