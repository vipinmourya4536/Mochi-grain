'use client';

import { useGrainStore } from '@/lib/grain-store';
import { Moon, BatteryWarning } from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';

export function SleepingView() {
  const { deviceInfo, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 grain-card">
        <Moon size={28} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
        {t('sleeping.title', lang)}
      </h2>
      <p className="text-sm mb-6 text-center max-w-[220px] leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
        {t('sleeping.desc', lang)}
      </p>
      {deviceInfo && (
        <div className="grain-card p-4 w-full max-w-[240px]">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>{t('sleeping.battery', lang)}</span>
            <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>
              {deviceInfo.battery}%
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full" style={{ background: 'var(--gm-toggle-bg)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${deviceInfo.battery}%`,
                background: deviceInfo.battery < 20 ? '#EF4444' : 'var(--gm-accent)',
              }}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => useGrainStore.getState().sendProbeCommand('wake')}
        className="mt-6 font-bold px-8 py-3.5 rounded-xl text-sm active:scale-95 transition-transform tracking-wide"
        style={{ background: 'var(--gm-btn-primary-bg)', color: 'var(--gm-btn-primary-text)' }}
      >
        {t('sleeping.wake', lang)}
      </button>
    </div>
  );
}

export function LowBatteryView() {
  const { deviceInfo, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
        <BatteryWarning size={28} weight="bold" style={{ color: '#EF4444' }} />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
        {t('lowbattery.title', lang)}
      </h2>
      <p className="text-sm mb-6 text-center max-w-[240px] leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
        {t('lowbattery.desc', lang)}
      </p>
      {deviceInfo && (
        <div className="grain-card p-4 w-full max-w-[240px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>{t('lowbattery.level', lang)}</span>
            <span className="text-sm font-bold" style={{ color: '#EF4444' }}>
              {deviceInfo.battery}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--gm-toggle-bg)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${deviceInfo.battery}%`,
                background: '#EF4444',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SyncingView() {
  const { settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="grain-spinner mb-5" />
      <h2 className="text-base font-bold mb-1 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
        {t('syncing.title', lang)}
      </h2>
      <p className="text-sm grain-pulse" style={{ color: 'var(--gm-text-secondary)' }}>
        {t('syncing.desc', lang)}
      </p>
    </div>
  );
}
