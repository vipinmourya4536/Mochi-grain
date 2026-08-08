'use client';

import { useGrainStore } from '@/lib/grain-store';
import {
  BatteryCharging,
  BatteryFull,
  BatteryHigh,
  BatteryLow,
  BatteryMedium,
} from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';
import { LanguageSelector } from './language-selector';

function BatteryIndicator({ level, accentColor }: { level: number; accentColor: string }) {
  const Icon =
    level > 75 ? BatteryFull :
    level > 50 ? BatteryHigh :
    level > 25 ? BatteryMedium :
    level > 10 ? BatteryLow :
    BatteryCharging;

  return (
    <div className="flex items-center gap-2">
      <Icon
        size={18}
        weight="fill"
        style={{ color: level < 20 ? '#EF4444' : accentColor }}
      />
      <span
        className="text-[11px] font-bold"
        style={{ color: level < 20 ? '#EF4444' : 'var(--gm-text-tertiary)' }}
      >
        {level}%
      </span>
    </div>
  );
}

export function Header() {
  const { deviceState, deviceInfo, statusBadge, riskTheme, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  const statusLabel =
    deviceState === 'disconnected'
      ? t('status.offline', lang)
      : deviceState === 'connecting'
        ? t('status.pairing', lang)
        : statusBadge;

  const accentColor =
    riskTheme === 'critical'
      ? '#EF4444'
      : riskTheme === 'warn'
        ? '#F59E0B'
        : 'var(--gm-accent)';

  return (
    <>
      <header className="grain-glass-header px-5 pt-14 pb-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full grain-status-dot" />
          <div>
            <h1
              className="text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color: 'var(--gm-text-primary)' }}
            >
              {t('app.title', lang)}
            </h1>
            <p
              className="text-[10px] mt-0.5 font-medium tracking-wide transition-colors duration-500"
              style={{ color: accentColor }}
            >
              {statusLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {deviceInfo && <BatteryIndicator level={deviceInfo.battery} accentColor={accentColor} />}
          <LanguageSelector />
        </div>
      </header>
    </>
  );
}
