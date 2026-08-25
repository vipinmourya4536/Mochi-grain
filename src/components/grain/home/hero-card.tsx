'use client';

import { useState, useEffect, useRef } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { SparklineChart } from '../sparkline-chart';
import { t, tGrain, type AppLanguage } from '@/lib/i18n';

/** Format interval seconds to a short label */
function formatIntervalLabel(sec: number): string {
  if (sec < 60) return `1m`;
  if (sec < 3600) return `${sec / 60}m`;
  return `${sec / 3600}h`;
}

export function HeroCard() {
  const { currentReading, statusBadge, sparklineData, deviceInfo, settings, demoMode, demoIntervalSec } = useGrainStore();
  const lang = settings.language as AppLanguage;

  // Countdown: derived from store state, ticked via external timer
  const [countdown, setCountdown] = useState<number | null>(null);
  const mountedRef = useRef(true);

  // Keep mountedRef in sync (ref write in effect is allowed)
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Countdown timer: only setState inside interval callback, never in effect body
  useEffect(() => {
    if (!demoMode || !currentReading) return;

    const baseTime = currentReading.timestamp;
    const interval = demoIntervalSec;

    // Defer initial setState into a microtask (not synchronous in effect body)
    const initId = setTimeout(() => {
      if (!mountedRef.current) return;
      const elapsed = Math.floor((Date.now() - baseTime) / 1000);
      setCountdown(Math.max(0, interval - elapsed));
    }, 0);

    const timer = setInterval(() => {
      if (!mountedRef.current) return;
      const elapsed = Math.floor((Date.now() - baseTime) / 1000);
      setCountdown(Math.max(0, interval - elapsed));
    }, 1000);

    return () => {
      clearTimeout(initId);
      clearInterval(timer);
    };
  }, [demoMode, currentReading?.id, currentReading?.timestamp, demoIntervalSec]);

  // Clear countdown when demo stops or reading disappears
  useEffect(() => {
    if (!demoMode || !currentReading) {
      const id = setTimeout(() => {
        if (mountedRef.current) setCountdown(null);
      }, 0);
      return () => clearTimeout(id);
    }
  }, [demoMode, currentReading]);

  if (!currentReading) return null;

  const grainLabel = tGrain(currentReading.grainType, lang);
  const deviceName = deviceInfo?.name || '';
  const intervalLabel = demoMode ? formatIntervalLabel(demoIntervalSec) : undefined;

  return (
    <div className="grain-hero-card">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/80">
              {t('hero.moisture', lang)}
            </span>
            <span className="text-[10px] text-white/50 tracking-wide">{deviceName}</span>
          </div>
          <div className="flex items-center gap-2">
            {demoMode && countdown !== null && (
              <span className="grain-badge" style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                border: '1px solid rgba(34, 197, 94, 0.25)',
                fontSize: '9px',
                padding: '2px 8px',
                letterSpacing: '0.08em',
              }}>
                {t('demo.live', lang)}
              </span>
            )}
            <span className="grain-badge">{t(`status.${statusBadge.toLowerCase()}`, lang)}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-7xl font-bold tracking-tight text-white">
            {currentReading.moisture.toFixed(1)}
          </span>
          <span className="text-2xl font-semibold text-white/60">%</span>
        </div>

        <p className="text-xs text-white/40 mb-4">{grainLabel} {t('hero.moisture_content', lang)}</p>

        {/* Professional sparkline chart with time axis and countdown */}
        <div className="h-[120px] relative -mx-1">
          <SparklineChart
            data={sparklineData}
            height={120}
            nextReadingCountdown={countdown}
            intervalLabel={intervalLabel}
          />
        </div>

        {/* Next reading countdown text for demo */}
        {demoMode && countdown !== null && (
          <p className="text-[10px] text-white/30 mt-2 text-center tracking-wide">
            {t('demo.next_reading', lang)} {formatCountdownText(countdown)}
          </p>
        )}
      </div>
    </div>
  );
}

function formatCountdownText(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rm = m % 60;
    return `${h}h ${rm}m ${s}s`;
  }
  return `${m}m ${s}s`;
}
