'use client';

import { useGrainStore } from '@/lib/grain-store';
import { GRAIN_LABELS } from '@/lib/grain-types';
import type { HistoryEntry } from '@/lib/grain-types';
import { X, TrendUp, TrendDown, Minus, ArrowClockwise, Trash } from '@phosphor-icons/react/dist/ssr';
import { SparklineChart } from '../sparkline-chart';
import { format, formatDistanceToNow } from 'date-fns';

function getDotColor(state: string): string {
  switch (state) {
    case 'critical': return '#EF4444';
    case 'warn': return '#F59E0B';
    default: return '#F97316';
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
  const { historyEntries, setSelectedHistoryId, clearHistory } = useGrainStore();

  if (historyEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center grain-fade-in">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 grain-card">
          <ArrowClockwise size={24} weight="bold" style={{ color: '#71717a' }} />
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: '#a1a1aa' }}>
          No History Yet
        </p>
        <p className="text-xs max-w-[200px]" style={{ color: '#71717a' }}>
          Readings will appear here once you connect your probe.
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
              <span className="text-xs font-semibold" style={{ color: '#f4f4f5' }}>
                {format(entry.reading.timestamp, 'MMM d, yyyy')}
              </span>
              <span className="w-1 h-1 rounded-full" style={{ background: '#3f3f46' }} />
              <span className="text-[10px]" style={{ color: '#a1a1aa' }}>
                {format(entry.reading.timestamp, 'h:mm a')}
              </span>
            </div>
            <div className="text-sm font-bold" style={{ color: '#f4f4f5' }}>
              {entry.reading.moisture.toFixed(1)}%{' '}
              <span className="font-normal text-xs" style={{ color: '#a1a1aa' }}>
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

  return (
    <div className="grain-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: '#f4f4f5' }}>
            Reading Detail
          </h3>
          <p className="text-xs" style={{ color: '#a1a1aa' }}>
            {format(reading.timestamp, 'EEEE, MMMM d, yyyy · h:mm a')}
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center grain-card"
          style={{ color: '#a1a1aa' }}
        >
          <X size={16} weight="bold" />
        </button>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#a1a1aa' }}>
            Moisture
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: getDotColor(decision.state) }}>
              {reading.moisture.toFixed(1)}
            </span>
            <span className="text-xs" style={{ color: '#a1a1aa' }}>%</span>
          </div>
        </div>
        <div className="grain-card p-4">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: '#a1a1aa' }}>
            Temperature
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold" style={{ color: '#f4f4f5' }}>
              {Math.round(reading.temperature)}
            </span>
            <span className="text-xs" style={{ color: '#a1a1aa' }}>°C</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="grain-card p-3">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: '#a1a1aa' }}>
            Battery
          </div>
          <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>{reading.battery}%</span>
        </div>
        <div className="grain-card p-3">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: '#a1a1aa' }}>
            Signal
          </div>
          <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>{reading.signal}%</span>
        </div>
        <div className="grain-card p-3">
          <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1" style={{ color: '#a1a1aa' }}>
            Grain
          </div>
          <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>{GRAIN_LABELS[reading.grainType]}</span>
        </div>
      </div>

      {/* Insight at that time */}
      <div className="grain-insight-card mb-5">
        <h4 className="text-xs font-bold tracking-wide uppercase mb-2" style={{ color: getDotColor(decision.state) }}>
          {decision.state === 'safe' ? 'Safe' : decision.state === 'warn' ? 'Warning' : 'Critical'} · {decision.trend}
        </h4>
        <p className="text-sm leading-relaxed" style={{ color: '#d4d4d8' }}>
          {decision.message}
        </p>
        <p className="text-[11px] mt-2 leading-relaxed" style={{ color: '#71717a' }}>
          {decision.action}
        </p>
      </div>

      {/* Confidence & rule */}
      <div className="grain-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#71717a' }}>Rule</span>
          <span className="text-[11px] font-mono" style={{ color: '#a1a1aa' }}>{decision.ruleId}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#71717a' }}>Confidence</span>
          <span className="text-[11px] font-bold" style={{ color: '#f4f4f5' }}>{Math.round(decision.confidence * 100)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#71717a' }}>Severity</span>
          <span className="text-[11px] font-bold" style={{ color: getDotColor(decision.state) }}>{decision.severity}/100</span>
        </div>
      </div>
    </div>
  );
}

export function HistoryTab() {
  const { selectedHistoryEntry, setSelectedHistoryId, historyEntries, clearHistory } = useGrainStore();

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      {!selectedHistoryEntry ? (
        <>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#f4f4f5' }}>
                History
              </h2>
              <p className="text-sm" style={{ color: '#a1a1aa' }}>
                {historyEntries.length > 0
                  ? `${historyEntries.length} reading${historyEntries.length !== 1 ? 's' : ''} stored`
                  : 'Past readings'}
              </p>
            </div>
            {historyEntries.length > 0 && (
              <button
                onClick={clearHistory}
                className="w-8 h-8 rounded-lg flex items-center justify-center grain-card"
                style={{ color: '#71717a' }}
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
