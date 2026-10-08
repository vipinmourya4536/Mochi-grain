'use client';

import { useMemo } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import type { HistoryEntry } from '@/lib/grain-types';
import { X, TrendUp, TrendDown, Minus, ArrowClockwise, Trash, Gauge } from '@phosphor-icons/react/dist/ssr';
import { t, tGrain, tTrend, type AppLanguage } from '@/lib/i18n';
import { getRiskColor, getRiskBg } from '@/lib/accent-hex';
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
      {historyEntries.map((entry) => {
        const dotHex = getRiskColor(entry.decision.state, accent);
        return (
          <div key={entry.reading.id} className="grain-reading-item grain-card p-4 flex items-center gap-4" onClick={() => setSelectedHistoryId(entry.reading.id)}>
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
  const { settings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const accent = settings.accentColor;
  const dotHex = getRiskColor(decision.state, accent);

  // Use i18n keys if available, fallback to stored English
  const messageText = decision.messageKey ? t(decision.messageKey, lang) : decision.message;
  const actionText = decision.actionKey ? t(decision.actionKey, lang) : decision.action;
  const trendLabel = tTrend(decision.trend, lang);

  const stateLabel =
    decision.state === 'safe' ? t('history.safe', lang)
    : decision.state === 'warning' ? t('history.warning', lang)
    : decision.state === 'critical' ? t('history.critical', lang)
    : decision.state === 'monitor' ? t('status.monitor', lang)
    : decision.state === 'recovery' ? t('status.recovery', lang)
    : decision.state === 'insufficient_data' ? t('status.learning', lang)
    : decision.state === 'invalid' ? t('status.invalid', lang)
    : decision.state;

  return (
    <div className="grain-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>{t('history.detail', lang)}</h3>
          <p className="text-xs grain-tabular" style={{ color: 'var(--gm-text-secondary)' }}>{format(reading.timestamp, 'EEEE, MMMM d, yyyy · h:mm a')}</p>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center grain-card" style={{ color: 'var(--gm-text-secondary)' }}><X size={16} weight="bold" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.moisture', lang)}</div>
          <div className="flex items-baseline gap-1 grain-tabular"><span className="text-3xl font-bold" style={{ color: dotHex }}>{reading.moisture.toFixed(1)}</span><span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>%</span></div>
        </div>
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.temperature', lang)}</div>
          <div className="flex items-baseline gap-1 grain-tabular"><span className="text-3xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>{Math.round(reading.temperature)}</span><span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>°C</span></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="grain-card p-3"><div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.battery', lang)}</div><span className="text-sm font-bold grain-tabular" style={{ color: 'var(--gm-text-primary)' }}>{reading.battery}%</span></div>
        <div className="grain-card p-3"><div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.signal', lang)}</div><span className="text-sm font-bold grain-tabular" style={{ color: 'var(--gm-text-primary)' }}>{reading.signal}%</span></div>
        <div className="grain-card p-3"><div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>{t('history.grain', lang)}</div><span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>{tGrain(reading.grainType, lang)}</span></div>
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

export function HistoryTab() {
  const { selectedHistoryEntry, setSelectedHistoryId, historyEntries, clearHistory, settings } = useGrainStore();
  const lang = settings.language as AppLanguage;

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
              <button onClick={clearHistory} className="w-8 h-8 rounded-lg flex items-center justify-center grain-card" style={{ color: 'var(--gm-text-tertiary)' }} aria-label={t('settings.clear_history', lang)}><Trash size={16} weight="bold" /></button>
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
