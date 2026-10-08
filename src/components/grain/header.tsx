'use client';

import { useGrainStore } from '@/lib/grain-store';
import { t, type AppLanguage } from '@/lib/i18n';
import { LanguageSelector } from '@/components/grain/language-selector';
import { useOnlineStatus } from '@/lib/pwa';
import { BatteryHigh, BatteryLow, WifiSlash } from '@phosphor-icons/react/dist/ssr';

/**
 * Premium instrument header.
 * LEFT:  status indicator + GRAIN MONITOR title
 * RIGHT: battery telemetry capsule → demo state chip → language utility action
 * Each control has a deliberately different visual weight:
 *   - battery  = device telemetry (elongated glass capsule)
 *   - demo     = state label (lightweight chip with pulsing dot)
 *   - language = utility action (compact rounded rectangle)
 */
export function Header() {
  const { deviceState, deviceInfo, statusBadge, settings, activeTab, demoMode } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const online = useOnlineStatus();

  const isConnected = deviceState !== 'disconnected' && deviceState !== 'connecting';
  const isLive = isConnected || demoMode;

  const dotStyle = !isLive
    ? { background: 'var(--gm-dot-offline, #71717a)', boxShadow: '0 0 8px var(--gm-dot-offline, #71717a)' }
    : {};

  const battery = deviceInfo?.battery;
  const batteryLow = battery != null && battery < 20;
  const isSettings = activeTab === 'settings';

  return (
    <header className="grain-glass-header">
      <div className="grain-header-inner">
        {/* Left: status dot + title */}
        <div className="grain-header-brand">
          <span className={`grain-status-dot w-2 h-2 rounded-full ${isLive ? 'grain-status-dot-live' : ''}`} style={dotStyle} />
          <h1 className="grain-header-title">
            {t('app.title', lang)}
          </h1>
        </div>

        {/* Right: compact telemetry + state cluster */}
        <div className="grain-header-actions">
          {battery != null && (
            <div
              className={`grain-battery-capsule ${batteryLow ? 'low' : ''}`}
              role="status"
              aria-label={`${t('metric.battery', lang)} ${battery}%`}
            >
              {batteryLow
                ? <BatteryLow size={12} weight="fill" />
                : <BatteryHigh size={12} weight="fill" />}
              <span>{battery}%</span>
            </div>
          )}
          {demoMode && (
            <div className="grain-demo-chip" role="status" aria-label={t('demo.badge', lang)}>
              <span className="grain-demo-chip-dot" />
              <span>{t('demo.badge', lang)}</span>
            </div>
          )}
          {!online && (
            <div className="grain-offline-chip" role="status" aria-label={t('header.offline', lang)}>
              <WifiSlash size={11} weight="bold" />
              <span>{t('header.offline', lang)}</span>
            </div>
          )}
          {isSettings && <LanguageSelector />}
        </div>
      </div>
    </header>
  );
}
