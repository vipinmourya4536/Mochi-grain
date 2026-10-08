'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGrainStore } from '@/lib/grain-store';
import type { HistoryEntry } from '@/lib/grain-types';
import { X, TrendUp, TrendDown, Minus, ArrowClockwise, Trash, Gauge, ShareFat, Check, Question, Stack, Waves, ChartLine, DownloadSimple, Drop, Thermometer } from '@phosphor-icons/react/dist/ssr';
import { t, tGrain, tTrend, tp, type AppLanguage } from '@/lib/i18n';
import { getRiskColor, getRiskBg } from '@/lib/accent-hex';
import { computeStorageScore, scoreBandColor, type ScoreBand } from '@/lib/storage-score';
import { haptic } from '@/lib/haptics';
import { HistoryTrends } from './trends-chart';
import { DetailSparkline } from './detail-sparkline';
import { format } from 'date-fns';

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'rising': case 'spike': case 'rising_rapidly': return <TrendUp size={14} weight="bold" />;
    case 'falling': case 'drop': case 'falling_rapidly': return <TrendDown size={14} weight="bold" />;
    default: return <Minus size={14} weight="bold" />;
  }
}

/** Compact human time span: "45m", "2h 30m", "3d 4h" */
function formatSpan(ms: number): string {
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return '—';
  if (minutes < 90) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

/* ═══ Delta vs previous reading ═══
   Storage semantics: rising moisture is the risk direction
   (amber), falling is recovering (green), ±<0.05 is flat. */

interface Delta {
  dir: 'up' | 'down' | 'flat';
  value: number;
  color: string;
}

function deltaColor(dir: Delta['dir']): string {
  if (dir === 'up') return 'var(--gm-up)';
  if (dir === 'down') return 'var(--gm-down)';
  return 'var(--gm-text-tertiary)';
}

function computeDelta(entry: HistoryEntry, prev: HistoryEntry | undefined): Delta | null {
  if (!prev) return null;
  const d = entry.reading.moisture - prev.reading.moisture;
  if (Math.abs(d) < 0.05) return { dir: 'flat', value: d, color: deltaColor('flat') };
  return { dir: d > 0 ? 'up' : 'down', value: d, color: deltaColor(d > 0 ? 'up' : 'down') };
}

function DeltaChip({ delta, ariaLabel }: { delta: Delta; ariaLabel: string }) {
  return (
    <span className="grain-delta-chip" style={{ color: delta.color }} role="status" aria-label={ariaLabel}>
      {delta.dir === 'up'
        ? <TrendUp size={10} weight="bold" />
        : delta.dir === 'down'
          ? <TrendDown size={10} weight="bold" />
          : <Minus size={10} weight="bold" />}
      {(delta.value > 0 ? '+' : '') + delta.value.toFixed(1)}%
    </span>
  );
}

interface Stats {
  avg: number;
  min: number;
  max: number;
  avgTemp: number;
  count: number;
  spanMs: number;
}

function computeStats(entries: HistoryEntry[]): Stats | null {
  if (entries.length === 0) return null;
  let sum = 0;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let tempSum = 0;
  let newest = 0;
  let oldest = Number.POSITIVE_INFINITY;

  for (const e of entries) {
    const m = e.reading.moisture;
    sum += m;
    if (m < min) min = m;
    if (m > max) max = m;
    tempSum += e.reading.temperature;
    const ts = e.reading.timestamp;
    if (ts > newest) newest = ts;
    if (ts < oldest) oldest = ts;
  }

  return {
    avg: sum / entries.length,
    min,
    max,
    avgTemp: tempSum / entries.length,
    count: entries.length,
    spanMs: newest - oldest,
  };
}

/**
 * Aggregate summary for all stored readings, with a threshold-zone bar
 * showing where the session's moisture sits against the active grain profile.
 */
function HistoryStats({ entries }: { entries: HistoryEntry[] }) {
  const { settings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const { safe, warn, critical } = settings.thresholds;

  const stats = useMemo(() => computeStats(entries), [entries]);
  if (!stats) return null;

  // Zone bar domain: 0 → critical + 4 (stable visual scale)
  const barMax = critical + 4;
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / barMax) * 100))}%`;
  const safeW = pct(safe);
  const warnW = pct(critical - safe);
  const critW = pct(barMax - critical);
  const avgPos = pct(stats.avg);
  const minPos = pct(stats.min);
  const maxPos = pct(stats.max);

  return (
    <div className="grain-stats-card mb-4" role="group" aria-label={t('history.stats_title', lang)}>
      {/* Header row: gauge icon + title */}
      <div className="flex items-center gap-2 mb-3">
        <Gauge size={13} weight="bold" style={{ color: 'var(--gm-accent)' }} />
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('history.stats_title', lang)}
        </span>
        <span className="ml-auto text-[9px] font-semibold tracking-wide" style={{ color: 'var(--gm-text-tertiary)' }}>
          {formatSpan(stats.spanMs)}
        </span>
      </div>

      {/* Big average + mini stats grid */}
      <div className="flex items-stretch gap-4">
        <div className="shrink-0">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.stat_avg', lang)}
          </div>
          <div className="flex items-baseline gap-1 grain-tabular">
            <span className="text-4xl font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
              {stats.avg.toFixed(1)}
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--gm-text-tertiary)' }}>%</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 flex-1 justify-items-end content-center grain-tabular">
          <StatCell label={t('history.stat_min', lang)} value={`${stats.min.toFixed(1)}%`} />
          <StatCell label={t('history.stat_max', lang)} value={`${stats.max.toFixed(1)}%`} />
          <StatCell label={t('history.stat_temp', lang)} value={`${stats.avgTemp.toFixed(1)}°C`} />
          <StatCell label={t('history.readings', lang)} value={String(stats.count)} />
        </div>
      </div>

      {/* Threshold zone bar with min/avg/max markers */}
      <div className="mt-4">
        <div className="flex justify-between mb-1.5">
          <span className="text-[8px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
            {t('history.stat_range', lang)}
          </span>
          <span className="text-[8px] font-semibold grain-tabular" style={{ color: 'var(--gm-text-tertiary)' }}>
            &lt;{safe}% · &lt;{critical}%
          </span>
        </div>
        <div className="grain-stats-bar" aria-hidden="true">
          <div className="grain-stats-zone" style={{ left: 0, width: safeW, background: 'rgba(34, 197, 94, 0.5)' }} />
          <div className="grain-stats-zone" style={{ left: safeW, width: warnW, background: 'rgba(245, 158, 11, 0.45)' }} />
          <div className="grain-stats-zone" style={{ left: pct(critical), right: 0, width: critW, background: 'rgba(239, 68, 68, 0.5)' }} />
          <span className="grain-stats-marker" style={{ left: minPos }} />
          <span className="grain-stats-marker" style={{ left: maxPos }} />
          <span className="grain-stats-avg" style={{ left: avgPos }} />
        </div>
      </div>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <div className="text-[8px] font-bold tracking-[0.12em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{label}</div>
      <div className="text-[13px] font-bold leading-tight" style={{ color: 'var(--gm-text-secondary)' }}>{value}</div>
    </div>
  );
}

/* ═══ Storage Score – 0–100 composite over the stored history ═══ */

const SCORE_BAND_KEY: Record<ScoreBand, string> = {
  excellent: 'history.score_excellent',
  good: 'history.score_good',
  fair: 'history.score_fair',
  risky: 'history.score_risky',
};

const SCORE_BAND_RANGE: Record<ScoreBand, string> = {
  excellent: '85–100',
  good: '70–84',
  fair: '50–69',
  risky: '0–49',
};

/* ═══ Score explainer bottom sheet ═══
   Bottom-anchored glass sheet via portal into .grain-app
   (position:fixed works there — no transformed ancestors, and --gm-* tokens resolve). */
function ScoreExplainerSheet({
  open,
  onClose,
  score,
  opener,
}: {
  open: boolean;
  onClose: () => void;
  score: { band: ScoreBand; parts: { zones: number; stability: number; trend: number } } | null;
  opener: React.RefObject<HTMLButtonElement | null>;
}) {
  const { settings } = useGrainStore();
  const lang = settings.language as AppLanguage;

  const requestClose = useCallback(() => {
    onClose();
    // restore focus to the trigger
    requestAnimationFrame(() => opener.current?.focus());
  }, [onClose, opener]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, requestClose]);

  if (!open || !score) return null;

  const parts = [
    {
      icon: <Stack size={16} weight="bold" style={{ color: 'var(--gm-accent)' }} />,
      label: t('history.score_zones', lang),
      weight: '55%',
      desc: t('history.sheet_zones_desc', lang),
      value: score.parts.zones,
    },
    {
      icon: <Waves size={16} weight="bold" style={{ color: 'var(--gm-accent)' }} />,
      label: t('history.score_stability', lang),
      weight: '25%',
      desc: t('history.sheet_stability_desc', lang),
      value: score.parts.stability,
    },
    {
      icon: <ChartLine size={16} weight="bold" style={{ color: 'var(--gm-accent)' }} />,
      label: t('history.score_trend', lang),
      weight: '20%',
      desc: t('history.sheet_trend_desc', lang),
      value: score.parts.trend,
    },
  ];

  const bands: ScoreBand[] = ['excellent', 'good', 'fair', 'risky'];

  return createPortal(
    <div
      className="grain-sheet-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="grain-sheet-card" role="dialog" aria-modal="true" aria-label={t('history.sheet_title', lang)}>
        <div className="grain-sheet-grabber" aria-hidden="true" />
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-sm font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
            {t('history.sheet_title', lang)}
          </h3>
          <button
            type="button"
            className="ml-auto grain-sheet-close"
            onClick={requestClose}
            aria-label={t('settings.cancel', lang)}
          >
            <X size={13} weight="bold" />
          </button>
        </div>

        {/* Component rows */}
        <div className="flex flex-col gap-3 mt-3">
          {parts.map((p) => (
            <div key={p.label} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gm-accent-dim)' }}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold" style={{ color: 'var(--gm-text-primary)' }}>{p.label}</span>
                  <span className="grain-sheet-weight grain-tabular">{p.weight}</span>
                  <span className="ml-auto text-[10px] font-bold grain-tabular" style={{ color: 'var(--gm-accent)' }}>{p.value}</span>
                </div>
                <p className="text-[10.5px] leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Band legend */}
        <div className="mt-4 pt-3" style={{ borderTop: '1px solid var(--gm-separator)' }}>
          <p className="text-[9px] font-bold tracking-[0.18em] uppercase mb-2" style={{ color: 'var(--gm-text-tertiary)' }}>
            {t('history.sheet_bands', lang)}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {bands.map((b) => (
              <div key={b} className="flex flex-col items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: scoreBandColor(b) }} />
                <span className="text-[8.5px] font-bold text-center leading-tight" style={{ color: 'var(--gm-text-secondary)' }}>
                  {t(SCORE_BAND_KEY[b], lang)}
                </span>
                <span className="text-[8px] grain-tabular" style={{ color: 'var(--gm-text-tertiary)' }}>
                  {SCORE_BAND_RANGE[b]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.querySelector('.grain-app') ?? document.body,
  );
}

function StorageScoreCard({ entries }: { entries: HistoryEntry[] }) {
  const { settings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const [sheetOpen, setSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const score = useMemo(
    () => computeStorageScore(entries, settings.thresholds),
    [entries, settings.thresholds],
  );
  if (!score) return null;

  const bandColor = scoreBandColor(score.band);

  // 270° arc gauge geometry
  const R = 30;
  const CIRC = 2 * Math.PI * R;
  const SWEEP = 0.75; // 270°
  const arcLen = CIRC * SWEEP;

  const subs: { key: string; label: string; v: number }[] = [
    { key: 'zones', label: t('history.score_zones', lang), v: score.parts.zones },
    { key: 'stability', label: t('history.score_stability', lang), v: score.parts.stability },
    { key: 'trend', label: t('history.score_trend', lang), v: score.parts.trend },
  ];

  return (
    <div className="grain-stats-card mb-4" role="group" aria-label={t('history.score_title', lang)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] font-bold tracking-[0.18em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('history.score_title', lang)}
        </span>
        <span
          className="ml-auto text-[9px] font-bold tracking-[0.14em] uppercase grain-delta-chip"
          style={{ color: bandColor, borderColor: 'transparent', background: 'transparent', padding: 0, animation: 'none' }}
        >
          {t(SCORE_BAND_KEY[score.band], lang)}
        </span>
        <button
          ref={triggerRef}
          type="button"
          className="grain-sheet-trigger"
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          aria-label={t('history.sheet_title', lang)}
          onClick={() => setSheetOpen(true)}
        >
          <Question size={12} weight="bold" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Arc gauge */}
        <svg width="76" height="76" viewBox="0 0 76 76" className="shrink-0" role="img"
          aria-label={`${t('history.score_title', lang)} ${score.score}/100`}>
          <circle
            cx="38" cy="38" r={R} fill="none"
            stroke="var(--gm-toggle-bg)" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${arcLen} ${CIRC}`} transform="rotate(135 38 38)"
          />
          <circle
            className="grain-score-arc"
            cx="38" cy="38" r={R} fill="none"
            stroke={bandColor} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${arcLen * (score.score / 100)} ${CIRC}`} transform="rotate(135 38 38)"
          />
          <text x="38" y="41" textAnchor="middle" fill="var(--gm-text-primary)"
            fontSize="19" fontWeight="800" fontFamily="system-ui, sans-serif">
            {score.score}
          </text>
          <text x="38" y="52" textAnchor="middle" fill="var(--gm-text-tertiary)"
            fontSize="7.5" fontWeight="700" fontFamily="system-ui, sans-serif">
            /100
          </text>
        </svg>

        {/* Component breakdown */}
        <div className="flex-1 flex flex-col gap-2.5 min-w-0">
          {subs.map((s) => (
            <div key={s.key} className="flex items-center gap-2.5">
              <span className="text-[8px] font-bold tracking-[0.1em] uppercase w-[62px] shrink-0 truncate" style={{ color: 'var(--gm-text-tertiary)' }}>
                {s.label}
              </span>
              <div className="grain-score-bar-track flex-1">
                <div className="grain-score-bar-fill" style={{ width: `${s.v}%`, background: bandColor, opacity: 0.85 }} />
              </div>
              <span className="text-[10px] font-bold grain-tabular w-[22px] text-right shrink-0" style={{ color: 'var(--gm-text-secondary)' }}>
                {s.v}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ScoreExplainerSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        score={score}
        opener={triggerRef}
      />
    </div>
  );
}

function ReadingList() {
  const { historyEntries, setSelectedHistoryId, settings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const accent = settings.accentColor;

  if (historyEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center grain-fade-in">
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5 grain-card" style={{ transform: 'rotate(-4deg)' }}>
          <ArrowClockwise size={28} weight="bold" style={{ color: 'var(--gm-accent)' }} />
        </div>
        <p className="text-sm font-bold mb-1.5" style={{ color: 'var(--gm-text-primary)' }}>{t('history.no_history', lang)}</p>
        <p className="text-xs max-w-[220px] leading-relaxed" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.no_history_desc', lang)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 grain-fade-in">
      <HistoryStats entries={historyEntries} />
      {historyEntries.length >= 3 && <StorageScoreCard entries={historyEntries} />}
      {historyEntries.length >= 2 && <HistoryTrends entries={historyEntries} />}
      {historyEntries.map((entry, i) => {
        const dotHex = getRiskColor(entry.decision.state, accent);
        // Entries are newest-first → the previous chronological reading sits one slot down
        const delta = computeDelta(entry, historyEntries[i + 1]);
        return (
          <div key={entry.reading.id} className="grain-reading-item grain-card p-4 flex items-center gap-4 transition-transform duration-150 active:scale-[0.98]" onClick={() => setSelectedHistoryId(entry.reading.id)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold grain-tabular" style={{ background: getRiskBg(entry.decision.state, accent, 0.13), color: dotHex }}>
              {new Date(entry.reading.timestamp).getDate()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold" style={{ color: 'var(--gm-text-primary)' }}>{format(entry.reading.timestamp, 'MMM d, yyyy')}</span>
                <span className="w-1 h-1 rounded-full" style={{ background: 'var(--gm-separator)' }} />
                <span className="text-[10px] grain-tabular" style={{ color: 'var(--gm-text-secondary)' }}>{format(entry.reading.timestamp, 'h:mm a')}</span>
              </div>
              <div className="text-sm font-bold grain-tabular" style={{ color: 'var(--gm-text-primary)' }}>{entry.reading.moisture.toFixed(1)}%{' '}<span className="font-normal text-xs" style={{ color: 'var(--gm-text-secondary)' }}>/ {Math.round(entry.reading.temperature)}°C / {tGrain(entry.reading.grainType, lang)}</span></div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {delta && <DeltaChip delta={delta} ariaLabel={`${t('history.delta_prev', lang)} ${(delta.value > 0 ? '+' : '') + delta.value.toFixed(1)}%`} />}
              <div style={{ color: dotHex }}>{getTrendIcon(entry.decision.trend)}</div>
              <div className="w-2 h-2 rounded-full" style={{ background: dotHex }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReadingDetail({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const { reading, decision } = entry;
  const { settings, historyEntries, showToast } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const accent = settings.accentColor;
  const dotHex = getRiskColor(decision.state, accent);
  const [shared, setShared] = useState(false);
  // Context-sparkline metric — moisture is the primary series, temp is one tap away
  const [sparkMetric, setSparkMetric] = useState<'moisture' | 'temp'>('moisture');

  // Use i18n keys if available, fallback to stored English
  const messageText = decision.messageKey ? t(decision.messageKey, lang) : decision.message;
  const actionText = decision.actionKey ? t(decision.actionKey, lang) : decision.action;
  const trendLabel = tTrend(decision.trend, lang);

  // Delta vs the previous chronological reading (list is newest-first)
  const idx = historyEntries.findIndex((e) => e.reading.id === reading.id);
  const prev = idx >= 0 ? historyEntries[idx + 1] : undefined;
  const delta = computeDelta(entry, prev);

  const stateLabel =
    decision.state === 'safe' ? t('history.safe', lang)
    : decision.state === 'warning' ? t('history.warning', lang)
    : decision.state === 'critical' ? t('history.critical', lang)
    : decision.state === 'monitor' ? t('status.monitor', lang)
    : decision.state === 'recovery' ? t('status.recovery', lang)
    : decision.state === 'insufficient_data' ? t('status.learning', lang)
    : decision.state === 'invalid' ? t('status.invalid', lang)
    : decision.state;

  /* Share via the Web Share API when available (PWA-friendly),
     falling back to clipboard copy. User-cancel is silent. */
  const shareReading = async () => {
    haptic(settings.hapticsEnabled, 8);
    const text =
      `Grain Monitor — ${tGrain(reading.grainType, lang)}\n` +
      `${t('history.moisture', lang)}: ${reading.moisture.toFixed(1)}% · ${t('history.temperature', lang)}: ${Math.round(reading.temperature)}°C\n` +
      `${format(reading.timestamp, 'MMM d, yyyy · h:mm a')}\n` +
      `${stateLabel} · ${messageText}`;
    // Cast mirrors bluetooth.ts: web-bluetooth Navigator typing breaks
    // `in`-narrowing for share(), so we model the optional members directly.
    const navExt = (typeof navigator !== 'undefined' ? navigator : undefined) as
      | (Navigator & { share?: (data?: ShareData) => Promise<void> })
      | undefined;
    try {
      if (navExt?.share) {
        await navExt.share({ title: 'Grain Monitor', text });
        return;
      }
      if (navExt?.clipboard?.writeText) {
        await navExt.clipboard.writeText(text);
        showToast(t('toast.copied', lang));
        setShared(true);
        setTimeout(() => setShared(false), 1600);
        return;
      }
      showToast(t('toast.share_fail', lang));
    } catch (err) {
      // AbortError = the user dismissed the share sheet — not a failure
      if (err instanceof DOMException && err.name === 'AbortError') return;
      showToast(t('toast.share_fail', lang));
    }
  };

  return (
    <div className="grain-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>{t('history.detail', lang)}</h3>
          <p className="text-xs grain-tabular" style={{ color: 'var(--gm-text-secondary)' }}>{format(reading.timestamp, 'EEEE, MMMM d, yyyy · h:mm a')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={shareReading} className="grain-share-btn" aria-label={t('history.share', lang)}>
            {shared
              ? <Check size={15} weight="bold" />
              : <ShareFat size={15} weight="bold" />}
          </button>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center grain-card" style={{ color: 'var(--gm-text-secondary)' }} aria-label={t('history.detail', lang)}><X size={16} weight="bold" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.moisture', lang)}</div>
          <div className="flex items-baseline gap-1.5 grain-tabular">
            <span className="text-3xl font-bold" style={{ color: dotHex }}>{reading.moisture.toFixed(1)}</span><span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>%</span>
            {delta && <DeltaChip delta={delta} ariaLabel={`${t('history.delta_prev', lang)} ${(delta.value > 0 ? '+' : '') + delta.value.toFixed(1)}%`} />}
          </div>
        </div>
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.temperature', lang)}</div>
          <div className="flex items-baseline gap-1 grain-tabular"><span className="text-3xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>{Math.round(reading.temperature)}</span><span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>°C</span></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="grain-card p-3"><div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.battery', lang)}</div><span className="text-sm font-bold grain-tabular" style={{ color: 'var(--gm-text-primary)' }}>{reading.battery}%</span></div>
        <div className="grain-card p-3"><div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.signal', lang)}</div><span className="text-sm font-bold grain-tabular" style={{ color: 'var(--gm-text-primary)' }}>{reading.signal}%</span></div>
        <div className="grain-card p-3"><div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.grain', lang)}</div><span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>{tGrain(reading.grainType, lang)}</span></div>
      </div>

      {/* Local trajectory: the ~16 readings surrounding this one */}
      <div className="grain-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.detail_context', lang)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold grain-tabular" style={{ color: 'var(--gm-text-tertiary)' }}>
              {sparkMetric === 'moisture'
                ? `${reading.moisture.toFixed(1)}% · ${format(reading.timestamp, 'HH:mm')}`
                : `${Math.round(reading.temperature)}°C · ${format(reading.timestamp, 'HH:mm')}`}
            </span>
            <div className="grain-spark-seg" role="group" aria-label={t('history.detail_metric', lang)}>
              <button
                type="button"
                className={sparkMetric === 'moisture' ? 'active' : ''}
                aria-pressed={sparkMetric === 'moisture'}
                aria-label={t('history.moisture', lang)}
                title={t('history.moisture', lang)}
                onClick={() => { haptic(settings.hapticsEnabled, 6); setSparkMetric('moisture'); }}
              >
                <Drop size={10} weight="bold" />
              </button>
              <button
                type="button"
                className={sparkMetric === 'temp' ? 'active' : ''}
                aria-pressed={sparkMetric === 'temp'}
                aria-label={t('history.temperature', lang)}
                title={t('history.temperature', lang)}
                onClick={() => { haptic(settings.hapticsEnabled, 6); setSparkMetric('temp'); }}
              >
                <Thermometer size={10} weight="bold" />
              </button>
            </div>
          </div>
        </div>
        <DetailSparkline
          entries={historyEntries}
          selected={entry}
          accentColor={accent}
          metric={sparkMetric}
          safe={settings.thresholds.safe}
          critical={settings.thresholds.critical}
          tempSafe={settings.thresholds.tempSafe}
          tempCritical={settings.thresholds.tempCritical}
          positionLabel={t('history.detail_context', lang)}
          scrubAria={t('history.detail_scrub_aria', lang)}
        />
      </div>

      <div className="grain-insight-card mb-5">
        <h4 className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: dotHex }}>{stateLabel} · {trendLabel}</h4>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>{messageText}</p>
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--gm-text-tertiary)' }}>{actionText}</p>
      </div>
      <div className="grain-card p-4">
        <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.rule', lang)}</span><span className="text-[11px] font-mono" style={{ color: 'var(--gm-text-secondary)' }}>{decision.ruleId}</span></div>
        <div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.confidence', lang)}</span><span className="text-[11px] font-bold" style={{ color: 'var(--gm-text-primary)' }}>{decision.confidence.toUpperCase()}</span></div>
        <div className="flex justify-between items-center"><span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.severity', lang)}</span><span className="text-[11px] font-bold grain-tabular" style={{ color: dotHex }}>{decision.severity}/100</span></div>
      </div>
    </div>
  );
}

/** Trigger a classic blob download (desktop / share-fallback path) */
function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export function HistoryTab() {
  const { selectedHistoryEntry, setSelectedHistoryId, historyEntries, clearHistory, settings, showToast } = useGrainStore();
  const lang = settings.language as AppLanguage;

  /* Build a CSV of every stored reading and hand it to the user.
   * Web Share with a file when the platform supports it (mobile PWA
   * share sheet), otherwise a classic blob download. */
  const exportCsv = () => {
    if (historyEntries.length === 0) return;
    haptic(settings.hapticsEnabled, 8);
    const header = 'timestamp,datetime,grain,moisture_pct,temperature_c,battery_pct,signal_pct,state,trend';
    const rows = [...historyEntries]
      .sort((a, b) => a.reading.timestamp - b.reading.timestamp)
      .map((e) => [
        new Date(e.reading.timestamp).toISOString(),
        format(e.reading.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        e.reading.grainType,
        e.reading.moisture.toFixed(2),
        e.reading.temperature.toFixed(1),
        Math.round(e.reading.battery),
        Math.round(e.reading.signal),
        e.decision.state,
        e.decision.trend,
      ].join(','));
    const csv = `${header}\n${rows.join('\n')}\n`;
    const filename = `mochi-grain-readings-${format(Date.now(), 'yyyy-MM-dd')}.csv`;
    const toastOk = () => showToast(tp('toast.exported', lang, { n: historyEntries.length }));

    // Cast mirrors shareReading(): Web Share file members are absent from the TS DOM lib
    const navExt = (typeof navigator !== 'undefined' ? navigator : undefined) as
      | (Navigator & {
          canShare?: (data: { files?: File[] }) => boolean;
          share?: (data?: { files?: File[]; title?: string; text?: string }) => Promise<void>;
        })
      | undefined;
    let sharePayload: { files: File[]; title: string; text: string } | null = null;
    try {
      if (navExt?.share && navExt?.canShare) {
        const file = new File([csv], filename, { type: 'text/csv' });
        if (navExt.canShare({ files: [file] })) {
          sharePayload = { files: [file], title: 'Grain Monitor', text: filename };
        }
      }
    } catch { /* canShare can throw on odd inputs — fall through to download */ }

    if (sharePayload) {
      navExt!.share(sharePayload)
        .then(toastOk)
        .catch((err) => {
          // AbortError = user dismissed the share sheet — not a failure
          if (err instanceof DOMException && err.name === 'AbortError') return;
          downloadCsv(csv, filename);
          toastOk();
        });
      return;
    }
    downloadCsv(csv, filename);
    toastOk();
  };

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      {!selectedHistoryEntry ? (
        <>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--gm-text-primary)' }}>{t('history.title', lang)}</h2>
              <p className="text-sm" style={{ color: 'var(--gm-text-secondary)' }}>{historyEntries.length > 0 ? `${historyEntries.length} ${historyEntries.length !== 1 ? t('history.readings', lang) : t('history.reading', lang)}` : t('history.past', lang)}</p>
            </div>
            {historyEntries.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={exportCsv} className="grain-export-btn" aria-label={t('history.export', lang)} title={t('history.export', lang)}>
                  <DownloadSimple size={16} weight="bold" />
                </button>
                <button onClick={clearHistory} className="w-8 h-8 rounded-lg flex items-center justify-center grain-card" style={{ color: 'var(--gm-text-tertiary)' }} aria-label={t('settings.clear_history', lang)}><Trash size={16} weight="bold" /></button>
              </div>
            )}
          </div>
          <ReadingList />
        </>
      ) : (
        <ReadingDetail entry={selectedHistoryEntry} onClose={() => setSelectedHistoryId(null)} />
      )}
    </div>
  );
}
