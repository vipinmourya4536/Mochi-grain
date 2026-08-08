'use client';

import { useGrainStore } from '@/lib/grain-store';
import {
  CheckCircle,
  Warning,
  WarningCircle,
  Moon,
  ArrowsClockwise,
} from '@phosphor-icons/react/dist/ssr';

export function InsightCard() {
  const { decision, deviceState } = useGrainStore();

  // Handle non-connected states
  if (deviceState === 'sleeping') {
    return (
      <div className="grain-insight-card grain-fade-in">
        <div className="flex items-start gap-4">
          <div className="grain-insight-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Moon size={20} weight="fill" style={{ color: 'var(--gm-accent)' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1 tracking-tight" style={{ color: '#f4f4f5' }}>
              Probe Sleeping
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
              The probe is sleeping to save power. Readings will resume on wake.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (deviceState === 'syncing') {
    return (
      <div className="grain-insight-card grain-fade-in">
        <div className="flex items-start gap-4">
          <div className="grain-insight-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <ArrowsClockwise size={20} weight="fill" style={{ color: 'var(--gm-accent)' }} className="grain-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1 tracking-tight" style={{ color: '#f4f4f5' }}>
              Syncing History
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
              Retrieving stored readings from the probe. This may take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!decision) return null;

  const IconComponent =
    decision.state === 'critical'
      ? WarningCircle
      : decision.state === 'warn'
        ? Warning
        : CheckCircle;

  const title =
    decision.state === 'critical'
      ? 'Action Required'
      : decision.state === 'warn'
        ? 'Attention Needed'
        : 'Storage is Safe';

  return (
    <div className="grain-insight-card grain-fade-in">
      <div className="flex items-start gap-4">
        <div className="grain-insight-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
          <IconComponent size={20} weight="fill" style={{ color: 'var(--gm-accent)' }} />
        </div>
        <div>
          <h3 className="font-bold text-sm mb-1 tracking-tight" style={{ color: '#f4f4f5' }}>
            {title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
            {decision.message}
          </p>
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: '#71717a' }}>
            {decision.action}
          </p>
        </div>
      </div>
    </div>
  );
}
