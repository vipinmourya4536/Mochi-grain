'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { getDiscoverContent } from '@/lib/discover-content';
import { stateToRiskTheme } from '@/lib/grain-types';
import { getBookmarkedEntries, toggleVideoBookmark, type BookmarkRecord } from '@/lib/offline-storage';
import { haptic } from '@/lib/haptics';
import { YoutubeLogo, ArrowSquareOut, PlayCircle, BookmarkSimple } from '@phosphor-icons/react/dist/ssr';
import { t, tp, tGrain, type AppLanguage } from '@/lib/i18n';
import type { DiscoverVideo } from '@/lib/grain-types';

/**
 * Single video card.
 * The thumbnail loads from img.youtube.com; if the network blocks it or the
 * video goes private, we swap to a branded gradient tile so the card never
 * shows a broken image or a gray YouTube placeholder.
 */
function DiscoverCard({
  video,
  saved,
  onToggleSave,
  lang,
}: {
  video: DiscoverVideo;
  saved: boolean;
  onToggleSave: (video: DiscoverVideo) => void;
  lang: AppLanguage;
}) {
  const [thumbFailed, setThumbFailed] = useState(false);

  return (
    <div className="grain-discover-card-wrap relative">
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="grain-discover-card block"
      >
        {/* Thumbnail row */}
        <div className="relative w-full h-36 overflow-hidden">
          {thumbFailed ? (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(120% 140% at 20% 0%, var(--gm-accent-soft, rgba(249,115,22,0.4)) 0%, transparent 55%),' +
                  'linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35))',
              }}
              aria-hidden="true"
            >
              <PlayCircle size={44} weight="fill" style={{ color: 'rgba(255,255,255,0.85)' }} />
            </div>
          ) : (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setThumbFailed(true)}
            />
          )}
          {/* Bottom scrim for depth under the play affordance */}
          <div
            className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(0,0,0,0.42)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.22)',
              }}
            >
              <PlayCircle size={26} weight="fill" style={{ color: 'rgba(255,255,255,0.94)' }} />
            </span>
          </div>
        </div>
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
      {/* Save button — floats over the card corner, outside the link so taps don't navigate */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleSave(video);
        }}
        className={`grain-bookmark-btn ${saved ? 'saved' : ''}`}
        aria-pressed={saved}
        aria-label={t(saved ? 'discover.bookmark_remove' : 'discover.bookmark_add', lang)}
      >
        <BookmarkSimple size={15} weight={saved ? 'fill' : 'bold'} />
      </button>
    </div>
  );
}

export function DiscoverTab() {
  const { decision, settings, deviceState, showToast } = useGrainStore();
  const lang = settings.language as AppLanguage;

  const grainType = settings.grainType;
  const riskTheme = decision ? stateToRiskTheme(decision.state) : 'safe';
  const videos = getDiscoverContent(grainType, riskTheme);

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedMeta, setSavedMeta] = useState<Record<string, number>>({}); // id → savedAt
  const [filter, setFilter] = useState<'all' | 'saved'>('all');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBookmarkedEntries().then((rows: BookmarkRecord[]) => {
      if (!cancelled) {
        setSavedIds(new Set(rows.map((r) => r.id)));
        setSavedMeta(Object.fromEntries(rows.map((r) => [r.id, r.savedAt])));
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSave = (video: DiscoverVideo) => {
    const willSave = !savedIds.has(video.id);
    // Optimistic flip; IndexedDB is source of truth on next load
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (willSave) next.add(video.id);
      else next.delete(video.id);
      return next;
    });
    if (willSave) {
      setSavedMeta((prev) => ({ ...prev, [video.id]: Date.now() }));
    } else {
      setSavedMeta((prev) => {
        const next = { ...prev };
        delete next[video.id];
        return next;
      });
    }
    haptic(settings.hapticsEnabled, willSave ? 12 : 8);
    showToast(t(willSave ? 'toast.saved' : 'toast.unsaved', lang));
    toggleVideoBookmark(video.id).catch(() => {
      // Roll back on storage failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (willSave) next.delete(video.id);
        else next.add(video.id);
        return next;
      });
    });
  };

  const visibleVideos = useMemo(() => {
    if (filter === 'all') return videos;
    const saved = videos.filter((v) => savedIds.has(v.id));
    // Most recently saved first (recency tracked in the bookmarks store)
    return saved.sort((a, b) => (savedMeta[b.id] ?? 0) - (savedMeta[a.id] ?? 0));
  }, [videos, filter, savedIds, savedMeta]);

  const isConnected = deviceState !== 'disconnected' && deviceState !== 'connecting';

  const conditionLabel =
    riskTheme === 'safe'
      ? t('discover.condition_normal', lang)
      : riskTheme === 'warn'
        ? t('discover.condition_elevated', lang)
        : t('discover.condition_critical', lang);

  const savedCount = videos.filter((v) => savedIds.has(v.id)).length;

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
            {riskTheme === 'critical'
              ? t('discover.connected_desc_critical', lang)
              : riskTheme === 'warn'
                ? t('discover.connected_desc_warn', lang)
                : t('discover.connected_desc_safe', lang)}
          </p>
        </div>
      )}

      {/* Filter chips: All | Saved */}
      <div className="flex items-center gap-2 mb-4">
        <div className="grain-seg" role="tablist" aria-label={t('discover.filter_all', lang)}>
          <button
            role="tab"
            aria-selected={filter === 'all'}
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            {t('discover.filter_all', lang)}
          </button>
          <button
            role="tab"
            aria-selected={filter === 'saved'}
            className={filter === 'saved' ? 'active' : ''}
            onClick={() => setFilter('saved')}
          >
            {t('discover.filter_saved', lang)}
            {loaded && savedCount > 0 && (
              <span className="grain-bookmark-count" aria-hidden="true">{savedCount}</span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filter === 'saved' && savedCount > 0 && (
          <p className="text-[10px] font-semibold tracking-wide uppercase px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
            {tp('discover.saved_meta', lang, { n: savedCount })}
          </p>
        )}
        {visibleVideos.map((video) => (
          <DiscoverCard
            key={video.id}
            video={video}
            saved={savedIds.has(video.id)}
            onToggleSave={toggleSave}
            lang={lang}
          />
        ))}
      </div>

      {visibleVideos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 grain-card">
            <BookmarkSimple size={24} weight="bold" style={{ color: 'var(--gm-text-tertiary)' }} />
          </div>
          <p className="text-sm max-w-[240px]" style={{ color: 'var(--gm-text-secondary)' }}>
            {filter === 'saved'
              ? t('discover.saved_empty', lang)
              : t('discover.no_results', lang)}
          </p>
        </div>
      )}
    </div>
  );
}
