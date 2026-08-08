'use client';

import { useGrainStore } from '@/lib/grain-store';
import { Bluetooth } from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';

export function DisconnectedView() {
  const { connectProbe, simulateConnect, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 grain-card">
        <Bluetooth size={28} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
        {t('disconnected.title', lang)}
      </h2>
      <p
        className="text-sm mb-8 text-center max-w-[220px] leading-relaxed"
        style={{ color: 'var(--gm-text-secondary)' }}
      >
        {t('disconnected.desc', lang)}
      </p>
      <button
        onClick={connectProbe}
        className="font-bold px-8 py-3.5 rounded-xl text-sm active:scale-95 transition-transform tracking-wide"
        style={{ background: 'var(--gm-btn-primary-bg)', color: 'var(--gm-btn-primary-text)' }}
      >
        {t('disconnected.connect', lang)}
      </button>
      <button
        onClick={() => simulateConnect()}
        className="mt-3 text-xs font-medium tracking-wide px-4 py-2 rounded-lg transition-colors"
        style={{ color: 'var(--gm-text-tertiary)' }}
      >
        {t('disconnected.demo', lang)}
      </button>
    </div>
  );
}
