'use client';

import { useGrainStore } from '@/lib/grain-store';
import { getInsightTitle, getTrendLabel } from '@/lib/mochi-engine';
import { STATE } from '@/lib/grain-types';
import type { MochiExpression } from '@/lib/grain-types';
import {
  CheckCircle,
  Warning,
  WarningCircle,
  Moon,
  ArrowsClockwise,
  Brain,
  ArrowLineUp,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { t, type AppLanguage } from '@/lib/i18n';

/* ── Expression → Icon mapping ── */
const EXPRESSION_ICONS: Record<MochiExpression, React.ElementType> = {
  safe: CheckCircle,
  concerned: Warning,
  critical: WarningCircle,
  thinking: Brain,
  success: ShieldCheck,
  connected: CheckCircle,
  sleeping: Moon,
};

/* ── State → primary icon color ── */
function getExpressionColor(expression: MochiExpression): string {
  switch (expression) {
    case 'critical': return '#EF4444';
    case 'concerned': return '#F59E0B';
    case 'success': return '#22C55E';
    case 'thinking': return '#A1A1AA';
    case 'safe': default: return 'var(--gm-accent)';
  }
}

export function InsightCard() {
  const { decision, deviceState, currentReading, settings } = useGrainStore();
  const lang = settings.language as AppLanguage;

  // Handle non-connected device states
  if (deviceState === 'sleeping') {
    return (
      <div className="grain-insight-card grain-fade-in">
        <div className="flex items-start gap-4">
          <div className="grain-insight-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Moon size={20} weight="fill" style={{ color: 'var(--gm-accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
                {t('status.sleeping', lang)}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-1 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
              {t('insight.probe_sleeping', lang)}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
              {t('insight.probe_sleeping_desc', lang)}
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
                {t('status.syncing', lang)}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-1 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
              {t('insight.syncing_history', lang)}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
              {t('insight.syncing_history_desc', lang)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!decision) return null;

  // Engine-driven display
  const titleKey = getInsightTitle(decision);
  const titleText = t(titleKey, lang);
  const messageText = decision.messageKey ? t(decision.messageKey, lang) : decision.message;
  const actionText = decision.actionKey ? t(decision.actionKey, lang) : decision.action;
  const trendKey = getTrendLabel(decision.trend);
  const trendText = t(trendKey, lang);

  // Build the status line: "SAFE · STABLE" pattern
  const stateLabel = getStateLabel(decision.state);
  const statusLine = decision.state === STATE.SAFE || decision.state === STATE.RECOVERY || decision.state === STATE.MONITOR
    ? `${stateLabel} · ${trendText.toUpperCase()}`
    : stateLabel;

  // Confidence badge
  const confidence = decision.confidence;
  const confidenceColor = confidence === 'high' ? '#22C55E' : confidence === 'medium' ? '#F59E0B' : '#71717A';

  // Icon
  const IconComponent = EXPRESSION_ICONS[decision.expression] || Brain;
  const iconColor = getExpressionColor(decision.expression);

  return (
    <div className="grain-insight-card-v2 grain-fade-in">
      {/* Header: Icon + Status Line */}
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}25` }}
        >
          <IconComponent size={22} weight="fill" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          {/* Status line: SAFE · STABLE or WARNING or CRITICAL */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-bold tracking-[0.18em] uppercase"
              style={{ color: iconColor }}
            >
              {statusLine}
            </span>
            {decision.state === STATE.INSUFFICIENT_DATA && (
              <span className="text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(161, 161, 170, 0.12)', color: 'var(--gm-text-tertiary)' }}>
                {confidence.toUpperCase()}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-bold text-[15px] mb-1.5 tracking-tight leading-snug" style={{ color: 'var(--gm-text-primary)' }}>
            {titleText}
          </h3>

          {/* Evidence / Message */}
          <p className="text-xs leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
            {messageText}
          </p>

          {/* Recommendation / Action */}
          <div
            className="mt-2.5 pt-2.5 flex items-start gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <ArrowLineUp size={12} weight="bold" style={{ color: 'var(--gm-text-tertiary)', marginTop: 2, flexShrink: 0 }} />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--gm-text-tertiary)' }}>
              {actionText}
            </p>
          </div>
        </div>
      </div>

      {/* Confidence indicator for non-safe states */}
      {decision.state !== STATE.SAFE && decision.state !== STATE.RECOVERY && (
        <div className="flex items-center gap-1.5 mt-3 pt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: confidenceColor }} />
          <span className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: 'var(--gm-text-tertiary)' }}>
            {t('history.confidence', lang)}: {confidence.toUpperCase()}
          </span>
          {decision.ruleId && (
            <>
              <span style={{ color: 'var(--gm-separator)' }}>·</span>
              <span className="text-[9px] font-mono" style={{ color: 'var(--gm-text-tertiary)' }}>
                {decision.ruleId}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function getStateLabel(state: string): string {
  const map: Record<string, string> = {
    [STATE.SAFE]: 'SAFE',
    [STATE.MONITOR]: 'MONITOR',
    [STATE.WARNING]: 'WARNING',
    [STATE.CRITICAL]: 'CRITICAL',
    [STATE.RECOVERY]: 'RECOVERY',
    [STATE.INSUFFICIENT_DATA]: 'LEARNING',
    [STATE.IDLE]: 'IDLE',
    [STATE.INVALID]: 'INVALID',
  };
  return map[state] || 'SAFE';
}
