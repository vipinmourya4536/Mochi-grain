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

  // The grain label ALWAYS reflects the user-selected profile (settings.grainType),
  // never the raw sensor packet. The number itself comes from the sensor reading.
  const grainLabel = tGrain(settings.grainType, lang);
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
                background: 'rgba(0, 0, 0, 0.32)',
                color: '#4ADE80',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: 5, height: 5, borderRadius: 999,
                    background: '#4ADE80',
                    boxShadow: '0 0 6px rgba(74, 222, 128, 0.9)',
                    animation: 'spark-pulse 2s ease-in-out infinite',
                    display: 'inline-block',
                  }}
                />
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

        <p className="text-xs text-white/55 mb-4">{grainLabel} {t('hero.moisture_content', lang)}</p>

        {/* Professional sparkline chart with time axis, countdown and scrub inspection */}
        <div className="h-[120px] -mx-1">
          <SparklineChart
            data={sparklineData}
            height={120}
            nextReadingCountdown={countdown}
            intervalLabel={intervalLabel}
            hapticsEnabled={settings.hapticsEnabled}
            scrubHint={t('chart.scrub_hint', lang)}
          />
        </div>

        {/* Next reading countdown text for demo */}
        {demoMode && countdown !== null && (
          <p className="text-[10px] text-white/60 mt-2 text-center tracking-wide grain-tabular">
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
