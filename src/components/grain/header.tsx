'use client';

import { useGrainStore, type TabId } from '@/lib/grain-store';
import { t } from '@/lib/i18n';
import { LanguageSelector } from '@/components/grain/language-selector';

const LANG_SHORT: Record<string, string> = {
  en: 'EN', hi: 'हि', mr: 'मरा', hinglish: 'Hi',
};

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

  const statusColor =
    !isConnected
      ? 'var(--gm-text-tertiary)'
      : riskTheme === 'critical'
        ? '#EF4444'
        : riskTheme === 'warn'
          ? '#F59E0B'
          : 'var(--gm-accent)';

  const dotStyle = !isConnected
    ? { background: 'var(--gm-dot-offline, #71717a)', boxShadow: '0 0 8px var(--gm-dot-offline, #71717a)' }
    : {};

  const battery = deviceInfo?.battery;
  const isSettings = activeTab === 'settings';

  return (
    <header className="grain-glass-header shrink-0">
      <div className="relative z-[3] px-5 pt-10 pb-2.5 flex justify-between items-center">
      {/* Left: status dot + title */}
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full grain-status-dot" style={dotStyle} />
        <div>
          <h1
            className="text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ color: 'var(--gm-text-primary)' }}
          >
            {t('app.title', lang)}
          </h1>
          <p
            className="text-[10px] mt-0.5 font-medium tracking-wide transition-colors duration-500"
            style={{ color: statusColor }}
          >
            {statusLabel}
          </p>
        </div>
      </div>

      {/* Right: context-aware buttons */}
      <div className="flex items-center gap-2.5">
        {/* Battery circle – always shown when available */}
        {battery != null && (
          <div
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: battery < 20
                ? 'rgba(239, 68, 68, 0.12)'
                : 'var(--gm-accent-dim)',
              border: `1.5px solid ${battery < 20 ? 'rgba(239,68,68,0.3)' : 'var(--gm-glass-border)'}`,
            }}
          >
            <span
              className="text-[10px] font-bold"
              style={{ color: battery < 20 ? '#EF4444' : 'var(--gm-accent)' }}
            >
              {battery}%
            </span>
          </div>
        )}

        {/* Language toggle – ONLY on Settings page */}
        {isSettings && <LanguageSelector />}
      </div>
      </div>
    </header>
  );
}