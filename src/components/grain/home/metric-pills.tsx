'use client';

import { useGrainStore } from '@/lib/grain-store';
import { t, type AppLanguage } from '@/lib/i18n';

/**
 * Supporting telemetry pills – TEMP | SIGNAL.
 * The selected grain is displayed in the hero card only;
 * Home never allows grain selection (Settings is the single selector).
 */
export function MetricPills() {
  const { currentReading, deviceInfo, settings } = useGrainStore();
  const lang = settings.language as AppLanguage;

  if (!currentReading || !deviceInfo) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
}
