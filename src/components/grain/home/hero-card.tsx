'use client';

import { useGrainStore } from '@/lib/grain-store';
import { SparklineChart } from '../sparkline-chart';
import { t, tGrain, type AppLanguage } from '@/lib/i18n';

export function HeroCard() {
  const { currentReading, statusBadge, sparklineData, deviceInfo, settings } = useGrainStore();
  const lang = settings.language as AppLanguage;

  if (!currentReading) return null;

  const grainLabel = tGrain(currentReading.grainType, lang);
  const deviceName = deviceInfo?.name || '';

  return (
    <div className="grain-hero-card">
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/80">
              {t('hero.moisture', lang)}
            </span>
            <span className="text-[10px] text-white/50 tracking-wide">{deviceName}</span>
          </div>
          <span className="grain-badge">{t(`status.${statusBadge.toLowerCase()}`, lang)}</span>
        </div>

        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-7xl font-bold tracking-tight text-white">
            {currentReading.moisture.toFixed(1)}
          </span>
          <span className="text-2xl font-semibold text-white/60">%</span>
        </div>

        <p className="text-xs text-white/40 mb-4">{grainLabel} {t('hero.moisture_content', lang)}</p>

        {/* Sparkline */}
        <div className="h-16 relative">
          <SparklineChart data={sparklineData} />
        </div>
      </div>
    </div>
  );
}
