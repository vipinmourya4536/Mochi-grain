'use client';

import { useGrainStore } from '@/lib/grain-store';
import type { HistoryEntry } from '@/lib/grain-types';
import { t } from '@/lib/i18n';
import { getRiskColor, getRiskBg } from '@/lib/accent-hex';

function getDay(timestamp: number, lang: string): string {
  const d = new Date(timestamp);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return t('recent.today', lang as any);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return t('recent.yesterday', lang as any);
  return d.getDate().toString();
}

function ReadingRow({ entry }: { entry: HistoryEntry }) {
  const { setActiveTab, setSelectedHistoryId, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';
  const dotHex = getRiskColor(entry.decision.state, settings.accentColor);

  return (
    <div
      className="grain-reading-item grain-card p-4 flex items-center gap-4"
      onClick={() => {
        setSelectedHistoryId(entry.reading.id);
        setActiveTab('history');
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold"
        style={{
          background: getRiskBg(entry.decision.state, settings.accentColor, 0.13),
          color: dotHex,
        }}
      >
        {new Date(entry.reading.timestamp).getDate()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: 'var(--gm-text-primary)' }}>
            {getDay(entry.reading.timestamp, lang)}
          </span>
          <span className="w-1 h-1 rounded-full" style={{ background: 'var(--gm-separator)' }} />
          <span className="text-[10px]" style={{ color: 'var(--gm-text-secondary)' }}>
            {new Date(entry.reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>
          {entry.reading.moisture.toFixed(1)}%{' '}
          <span className="font-normal text-xs" style={{ color: 'var(--gm-text-secondary)' }}>
            / {Math.round(entry.reading.temperature)}°C
          </span>
        </div>
      </div>
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: dotHex,
          boxShadow: `0 0 6px ${dotHex}`,
        }}
      />
    </div>
  );
}

export function RecentReadings() {
  const { historyEntries, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';
  const recent = historyEntries.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('recent.title', lang)}
        </h3>
        <button
          onClick={() => useGrainStore.getState().setActiveTab('history')}
          className="text-[10px] font-bold tracking-wider uppercase transition-colors"
          style={{ color: 'var(--gm-text-secondary)' }}
        >
          {t('recent.show_more', lang)}
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {recent.map((entry) => (
          <ReadingRow key={entry.reading.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
