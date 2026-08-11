'use client';

import { useGrainStore } from '@/lib/grain-store';
import { SparklineChart } from '../sparkline-chart';
import { GRAIN_LABELS } from '@/lib/grain-types';
import { t } from '@/lib/i18n';

export function HeroCard() {
  const { currentReading, statusBadge, sparklineData, deviceInfo, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  if (!currentReading) return null;

  const grainLabel = GRAIN_LABELS[currentReading.grainType] || currentReading.grainType;
  const deviceName = deviceInfo?.name || 'GRAIN-01';

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
          <span className="grain-badge">{statusBadge}</span>
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
          <div className="flex justify-between text-[9px] text-white/50 tracking-wide mt-1">
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00</span>
            <span>16:00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
