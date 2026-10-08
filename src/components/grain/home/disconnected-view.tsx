'use client';

import { useGrainStore } from '@/lib/grain-store';
import { Bluetooth, WaveSine } from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';

export function DisconnectedView() {
  const { connectProbe, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in px-6">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8"
        style={{ background: 'var(--gm-accent-dim)' }}
      >
        <Bluetooth size={36} weight="duotone" style={{ color: 'var(--gm-accent)' }} />
      </div>
      <h2
        className="text-xl font-bold mb-2 tracking-tight text-center"
        style={{ color: 'var(--gm-text-primary)' }}
      >
        {t('disconnected.title', lang)}
      </h2>
      <p
        className="text-sm mb-10 text-center max-w-[260px] leading-relaxed"
        style={{ color: 'var(--gm-text-secondary)' }}
      >
        {t('disconnected.desc', lang)}
      </p>
      <button
        onClick={connectProbe}
        className="flex items-center gap-2.5 font-bold px-8 py-4 rounded-2xl text-sm active:scale-95 transition-all"
        style={{
          background: 'var(--gm-btn-primary-bg)',
          color: 'var(--gm-btn-primary-text)',
          boxShadow: '0 4px 20px var(--gm-accent-glow)',
        }}
      >
        <Bluetooth size={18} weight="bold" />
        {t('disconnected.connect', lang)}
      </button>
      <div className="flex items-center gap-1.5 mt-6">
        <WaveSine size={14} weight="fill" style={{ color: 'var(--gm-text-tertiary)' }} />
        <p className="text-[11px] text-center" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('disconnected.hint', lang)}
        </p>
      </div>
    </div>
  );
}
