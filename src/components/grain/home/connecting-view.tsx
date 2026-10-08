'use client';

import { Bluetooth } from '@phosphor-icons/react/dist/ssr';
import { useGrainStore } from '@/lib/grain-store';
import { t } from '@/lib/i18n';

export function ConnectingView() {
  const { settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 relative"
        style={{ background: 'var(--gm-accent-dim)' }}
      >
        <Bluetooth size={36} weight="duotone" style={{ color: 'var(--gm-accent)' }} className="grain-bt-pulse-icon" />
      </div>
      <h2 className="text-lg font-bold mb-1.5 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
        {t('connecting.title', lang)}
      </h2>
      <p className="text-sm" style={{ color: 'var(--gm-text-secondary)' }}>{t('connecting.subtitle', lang)}</p>
    </div>
  );
}
