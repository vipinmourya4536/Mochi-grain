'use client';

import { useGrainStore } from '@/lib/grain-store';
import type { HistoryEntry } from '@/lib/grain-types';

function getDotColor(state: string): string {
  switch (state) {
    case 'critical': return '#EF4444';
    case 'warn': return '#F59E0B';
    default: return '#F97316';
  }
}

function getDay(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.getDate().toString();
}

function ReadingRow({ entry }: { entry: HistoryEntry }) {
  const { reading, decision } = entry;
  const { setActiveTab, setSelectedHistoryId } = useGrainStore();

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
          background: `${getDotColor(decision.state)}22`,
          color: getDotColor(decision.state),
        }}
      >
        {new Date(reading.timestamp).getDate()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold" style={{ color: '#f4f4f5' }}>
            {getDay(reading.timestamp)}
          </span>
          <span className="w-1 h-1 rounded-full" style={{ background: '#3f3f46' }} />
          <span className="text-[10px]" style={{ color: '#a1a1aa' }}>
            {new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="text-sm font-bold" style={{ color: '#f4f4f5' }}>
          {reading.moisture.toFixed(1)}%{' '}
          <span className="font-normal text-xs" style={{ color: '#a1a1aa' }}>
            / {Math.round(reading.temperature)}°C
          </span>
        </div>
      </div>
      <div
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: getDotColor(decision.state),
          boxShadow: `0 0 6px ${getDotColor(decision.state)}`,
        }}
      />
    </div>
  );
}

export function RecentReadings() {
  const { historyEntries } = useGrainStore();
  const recent = historyEntries.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-3 px-1">
        <h3
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ color: '#71717a' }}
        >
          Recent Readings
        </h3>
        <button
          onClick={() => useGrainStore.getState().setActiveTab('history')}
          className="text-[10px] font-bold tracking-wider uppercase transition-colors"
          style={{ color: '#a1a1aa' }}
        >
          Show More
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
