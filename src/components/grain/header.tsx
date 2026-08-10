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
    <header className="grain-glass-header shrink-0">
      <div className="relative z-[3] flex justify-between items-center h-12 px-5">
        {/* Left: status dot + title */}
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full grain-status-dot" style={dotStyle} />
          <h1
            className="text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--gm-text-primary)' }}
          >
            {t('app.title', lang)}
          </h1>
        </div>

        {/* Right: context-aware buttons */}
        <div className="flex items-center gap-2">
          {battery != null && (
            <div
              className="flex items-center justify-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: battery < 20
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'var(--gm-accent-dim)',
                border: `1px solid ${battery < 20 ? 'rgba(239,68,68,0.3)' : 'var(--gm-glass-border)'}`,
              }}
            >
              <span
                className="text-[9px] font-bold"
                style={{ color: battery < 20 ? '#EF4444' : 'var(--gm-accent)' }}
              >
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
