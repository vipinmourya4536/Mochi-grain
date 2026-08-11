'use client';

import { useGrainStore } from '@/lib/grain-store';
import { t } from '@/lib/i18n';
import { LanguageSelector } from '@/components/grain/language-selector';

export function Header() {
  const { deviceState, deviceInfo, statusBadge, riskTheme, settings, activeTab } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  const statusLabel =
    deviceState === 'disconnected'
      ? t('status.offline', lang)
      : deviceState === 'connecting'
        ? t('status.pairing', lang)
        : statusBadge;

  const isConnected = deviceState !== 'disconnected' && deviceState !== 'connecting';

  const dotStyle = !isConnected
    ? { background: 'var(--gm-dot-offline, #71717a)', boxShadow: '0 0 8px var(--gm-dot-offline, #71717a)' }
    : {};

  const battery = deviceInfo?.battery;
  const isSettings = activeTab === 'settings';

  return (
    <header className="grain-glass-header">
      <div className="grain-header-inner">
        {/* Left: status dot + title */}
        <div className="grain-header-brand">
          <div className="w-2 h-2 rounded-full grain-status-dot" style={dotStyle} />
          <h1 className="grain-header-title">
            {t('app.title', lang)}
          </h1>
        </div>

        {/* Right: device status */}
        <div className="grain-header-actions">
          {battery != null && (
            <div className="grain-battery-badge" style={{
              background: battery < 20
                ? 'rgba(239, 68, 68, 0.12)'
                : 'var(--gm-accent-dim)',
              borderColor: battery < 20 ? 'rgba(239,68,68,0.3)' : 'var(--gm-glass-border)',
            }}>
              <span style={{ color: battery < 20 ? '#EF4444' : 'var(--gm-accent)' }}>
                {battery}%
              </span>
            </div>
          )}
          {isSettings && <LanguageSelector />}
        </div>
      </div>
    </header>
  );
}
