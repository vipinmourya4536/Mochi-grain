'use client';

import { useState, useEffect } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { SparklineChart } from '../sparkline-chart';
import { t, tGrain, type AppLanguage } from '@/lib/i18n';
import { format } from 'date-fns';

/** A reading counts as LIVE only while it is fresh: the device is still
 *  connected AND a packet arrived within this window. Older readings are
 *  honestly labeled with their original timestamp — never shown as live. */
const LIVE_WINDOW_MS = 120_000;

/**
 * Hero card — the moisture headline.
 * Telemetry honesty rules:
 *  - The number comes ONLY from a real probe packet (store clears it on
 *    disconnect; demo/synthetic generators no longer exist).
 *  - LIVE badge = connected + fresh packet within LIVE_WINDOW_MS.
 *  - LAST READING badge = reading exists but is stale; the original
 *    timestamp is displayed next to it. No value is ever invented.
 */
export function HeroCard() {
  const { currentReading, statusBadge, sparklineData, deviceInfo, settings, deviceState } = useGrainStore();
  const lang = settings.language as AppLanguage;

  // Ticking clock so the live→stale transition renders without a new packet
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!currentReading) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [currentReading]);

  if (!currentReading) return null;

  // The grain label ALWAYS reflects the user-selected profile (settings.grainType),
  // never the raw sensor packet. The number itself comes from the sensor reading.
  const grainLabel = tGrain(settings.grainType, lang);
  const deviceName = deviceInfo?.name || '';

  const isConnected = deviceState !== 'disconnected' && deviceState !== 'connecting';
  const age = (now ?? currentReading.timestamp) - currentReading.timestamp;
  const isLive = isConnected && age < LIVE_WINDOW_MS;
  const isStale = !isLive;

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
            {isLive && (
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
                {t('hero.live', lang)}
              </span>
            )}
            {isStale && (
              <span className="grain-badge" style={{
                background: 'rgba(0, 0, 0, 0.32)',
                color: '#FBBF24',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(8px)',
                fontSize: '9px',
                fontWeight: 700,
                padding: '2px 8px',
                letterSpacing: '0.08em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              aria-label={`${t('hero.last_reading', lang)} ${format(currentReading.timestamp, 'h:mm a')}`}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 5, height: 5, borderRadius: 999,
                    background: '#FBBF24',
                    display: 'inline-block',
                  }}
                />
                {t('hero.last_reading', lang)}
                <span className="grain-tabular" style={{ opacity: 0.75 }}>
                  {format(currentReading.timestamp, 'h:mm a')}
                </span>
              </span>
            )}
            <span className="grain-badge">{t(`status.${statusBadge.toLowerCase()}`, lang)}</span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-7xl font-bold tracking-tight text-white">
            {currentReading.moisture.toFixed(1)}
          </span>
          <span className="text-2xl font-semibold grain-hero-sub">%</span>
        </div>

        <p className="text-xs grain-hero-sub mb-4">{grainLabel} {t('hero.moisture_content', lang)}</p>

        {/* Sparkline of real packet history with scrub inspection */}
        <div className="h-[120px] -mx-1">
          <SparklineChart
            data={sparklineData}
            height={120}
            hapticsEnabled={settings.hapticsEnabled}
            scrubHint={t('chart.scrub_hint', lang)}
          />
        </div>
      </div>
    </div>
  );
}
