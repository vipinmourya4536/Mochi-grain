'use client';

import { useState, useRef, useEffect } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { GRAIN_LABELS, type GrainType } from '@/lib/grain-types';
import { t } from '@/lib/i18n';

const GRAIN_OPTIONS = Object.keys(GRAIN_LABELS) as GrainType[];

export function MetricPills() {
  const { currentReading, deviceInfo, settings, selectGrainType } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  if (!currentReading || !deviceInfo) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
          {t('metric.temp', lang)}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>
            {Math.round(currentReading.temperature)}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--gm-text-secondary)' }}>°C</span>
        </div>
      </div>
      <div className="grain-card p-4">
        <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
          {t('metric.signal', lang)}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold" style={{ color: 'var(--gm-text-primary)' }}>
            {deviceInfo.signal}
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--gm-text-secondary)' }}>%</span>
        </div>
      </div>
      <GrainTypeDropdown currentGrain={currentReading.grainType} onSelect={selectGrainType} lang={lang} />
    </div>
  );
}

function GrainTypeDropdown({
  currentGrain,
  onSelect,
  lang,
}: {
  currentGrain: GrainType;
  onSelect: (g: GrainType) => void;
  lang: 'en' | 'hi' | 'mr' | 'hinglish';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const label = GRAIN_LABELS[currentGrain] || currentGrain;

  return (
    <div className="grain-card p-4 relative" ref={ref}>
      <div className="text-[9px] font-bold tracking-[0.15em] uppercase mb-2" style={{ color: 'var(--gm-text-secondary)' }}>
        {t('metric.grain', lang)}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
          {label}
        </span>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--gm-text-tertiary)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="grain-grain-dropdown">
          {GRAIN_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              className={`grain-grain-option ${g === currentGrain ? 'active' : ''}`}
              onClick={() => {
                onSelect(g);
                setOpen(false);
              }}
            >
              {GRAIN_LABELS[g]}
              {g === currentGrain && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gm-accent)' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
