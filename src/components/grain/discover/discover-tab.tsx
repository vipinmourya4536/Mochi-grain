'use client';

import { useGrainStore } from '@/lib/grain-store';
import { getDiscoverContent } from '@/lib/discover-content';
import { YoutubeLogo, ArrowSquareOut, PlayCircle } from '@phosphor-icons/react/dist/ssr';
import { t, tGrain, type AppLanguage } from '@/lib/i18n';

export function DiscoverTab() {
  const { decision, settings, deviceState } = useGrainStore();
  const lang = settings.language as AppLanguage;

  const grainType = settings.grainType;
  const condition = decision?.state || 'safe';
  const videos = getDiscoverContent(grainType, condition);

  const isConnected = deviceState !== 'disconnected' && deviceState !== 'connecting';

  const conditionLabel =
    condition === 'safe'
      ? t('discover.condition_normal', lang)
      : condition === 'warn'
        ? t('discover.condition_elevated', lang)
        : t('discover.condition_critical', lang);

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--gm-text-primary)' }}>
        {t('discover.title', lang)}
      </h2>
      <p className="text-sm mb-5" style={{ color: 'var(--gm-text-secondary)' }}>
        {isConnected
          ? `${tGrain(grainType, lang)} · ${conditionLabel}`
          : t('discover.disconnected_desc', lang)}
      </p>

      {isConnected && (
        <div className="grain-insight-card mb-5">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
            {condition === 'critical'
              ? t('discover.connected_desc_critical', lang)
              : condition === 'warn'
                ? t('discover.connected_desc_warn', lang)
                : t('discover.connected_desc_safe', lang)}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grain-discover-card block"
          >
            {/* Thumbnail row */}
            {video.thumbnail && (
              <div className="relative w-full h-36 overflow-hidden">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <PlayCircle size={40} weight="fill" style={{ color: 'rgba(255,255,255,0.9)' }} />
                </div>
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold tracking-tight leading-snug" style={{ color: 'var(--gm-text-primary)' }}>
                  {video.title}
                </h3>
                <ArrowSquareOut size={16} weight="bold" style={{ color: 'var(--gm-text-tertiary)', flexShrink: 0, marginTop: 2 }} />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <YoutubeLogo size={14} weight="fill" style={{ color: '#EF4444' }} />
                <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>
                  {video.source}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
                {video.why}
              </p>
            </div>
          </a>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 grain-card">
            <YoutubeLogo size={24} weight="bold" style={{ color: 'var(--gm-text-tertiary)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('discover.no_results', lang)}
          </p>
        </div>
      )}
    </div>
  );
}
