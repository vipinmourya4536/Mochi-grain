'use client';

import { useGrainStore } from '@/lib/grain-store';
import { t } from '@/lib/i18n';

export function ConnectingView() {
  const { settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="grain-spinner mb-5" />
      <h2 className="text-base font-bold mb-1 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
        {t('connecting.title', lang)}
      </h2>
      <p className="text-sm" style={{ color: 'var(--gm-text-secondary)' }}>{t('connecting.subtitle', lang)}</p>
    </div>
  );
}
