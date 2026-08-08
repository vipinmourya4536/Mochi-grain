'use client';

import { useGrainStore } from '@/lib/grain-store';
import { GRAIN_LABELS } from '@/lib/grain-types';
import type { HistoryEntry } from '@/lib/grain-types';
import { X, TrendUp, TrendDown, Minus, ArrowClockwise, Trash } from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';

import { format } from 'date-fns';

function getDotColor(state: string): string {
  switch (state) {
    case 'critical': return '#EF4444';
    case 'warn': return '#F59E0B';
    default: return 'var(--gm-accent)';
  }
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'rising': case 'spike': return <TrendUp size={14} weight="bold" />;
    case 'falling': case 'drop': return <TrendDown size={14} weight="bold" />;
    default: return <Minus size={14} weight="bold" />;
  }
}

function ReadingList() {
  const { historyEntries, setSelectedHistoryId, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  if (historyEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center grain-fade-in">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 grain-card">
          <ArrowClockwise size={24} weight="bold" style={{ color: 'var(--gm-text-tertiary)' }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--gm-text-secondary)' }}>
          {t('history.no_history', lang)}
        </p>
        <p className="text-xs max-w-[200px]" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('history.no_history_desc', lang)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 grain-fade-in">
      {historyEntries.map((entry) => (
        <div
          key={entry.reading.id}
          className="grain-reading-item grain-card p-4 flex items-center gap-4"
          onClick={() => setSelectedHistoryId(entry.reading.id)}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
            style={{
              background: `${getDotColor(entry.decision.state)}22`,
              color: getDotColor(entry.decision.state),
            }}
          >
            {new Date(entry.reading.timestamp).getDate()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--gm-text-primary)' }}>
                {format(entry.reading.timestamp, 'MMM d, yyyy')}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: 'var(--gm-separator)' }} />
              <span className="text-[10px]" style={{ color: 'var(--gm-text-secondary)' }}>
                {format(entry.reading.timestamp, 'h:mm a')}
              </span>
            </div>
            <div className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>
              {entry.reading.moisture.toFixed(1)}%{' '}
              <span className="font-normal text-xs" style={{ color: 'var(--gm-text-secondary)' }}>
                / {Math.round(entry.reading.temperature)}°C / {GRAIN_LABELS[entry.reading.grainType]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div style={{ color: getDotColor(entry.decision.state) }}>
              {getTrendIcon(entry.decision.trend)}
            </div>
            <div
              className="w-2 h-2 rounded-full"
              style={{
                background: getDotColor(entry.decision.state),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ReadingDetail({ entry, onClose }: { entry: HistoryEntry; onClose: () => void }) {
  const { reading, decision } = entry;
  const { settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="grain-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
            {t('history.detail', lang)}
          </h3>
          <p className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>
            {format(reading.timestamp, 'EEEE, MMMM d, yyyy · h:mm a')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center grain-card"
          style={{ color: 'var(--gm-text-secondary)' }}
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.moisture', lang)}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: getDotColor(decision.state) }}>
              {reading.moisture.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>%</span>
          </div>
        </div>
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.temperature', lang)}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>
              {Math.round(reading.temperature)}
            </span>
            <span className="text-xs" style={{ color: 'var(--gm-text-secondary)' }}>°C</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="grain-card p-3">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.battery', lang)}
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>{reading.battery}%</span>
        </div>
        <div className="grain-card p-3">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.signal', lang)}
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>{reading.signal}%</span>
        </div>
        <div className="grain-card p-3">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: 'var(--gm-text-secondary)' }}>
            {t('history.grain', lang)}
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>{GRAIN_LABELS[reading.grainType]}</span>
        </div>
      </div>

      {/* Insight at that time */}
      <div className="grain-insight-card mb-5">
        <h4 className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: getDotColor(decision.state) }}>
          {decision.state === 'safe' ? t('history.safe', lang) : decision.state === 'warn' ? t('history.warning', lang) : t('settings.critical', lang)} · {decision.trend}
        </h4>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
          {decision.message}
        </p>
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: 'var(--gm-text-tertiary)' }}>
          {decision.action}
        </p>
      </div>

      {/* Confidence & rule */}
      <div className="grain-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.rule', lang)}</span>
          <span className="text-[11px] font-mono" style={{ color: 'var(--gm-text-secondary)' }}>{decision.ruleId}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.confidence', lang)}</span>
          <span className="text-[11px] font-bold" style={{ color: 'var(--gm-text-primary)' }}>{Math.round(decision.confidence * 100)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>{t('history.severity', lang)}</span>
          <span className="text-[11px] font-bold" style={{ color: getDotColor(decision.state) }}>{decision.severity}/100</span>
        </div>
      </div>
    </div>
  );
}

export function HistoryTab() {
  const { selectedHistoryEntry, setSelectedHistoryId, historyEntries, clearHistory, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      {!selectedHistoryEntry ? (
        <>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--gm-text-primary)' }}>
                {t('history.title', lang)}
              </h2>
              <p className="text-sm" style={{ color: 'var(--gm-text-secondary)' }}>
                {historyEntries.length > 0
                  ? `${historyEntries.length} ${historyEntries.length !== 1 ? t('history.readings', lang) : t('history.reading', lang)}`
                  : t('history.past', lang)}
              </p>
            </div>
            {historyEntries.length > 0 && (
              <button
                onClick={clearHistory}
                className="w-8 h-8 rounded-lg flex items-center justify-center grain-card"
                style={{ color: 'var(--gm-text-tertiary)' }}
              >
                <Trash size={16} weight="bold" />
              </button>
            )}
          </div>
          <ReadingList />
        </>
      ) : (
        <ReadingDetail
          entry={selectedHistoryEntry}
          onClose={() => setSelectedHistoryId(null)}
        />
      )}
    </div>
  );
}
