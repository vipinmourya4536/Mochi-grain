'use client';

import { useGrainStore } from '@/lib/grain-store';
import {
  CheckCircle,
  Warning,
  WarningCircle,
  Moon,
  ArrowsClockwise,
} from '@phosphor-icons/react/dist/ssr';
import { t, type AppLanguage } from '@/lib/i18n';

export function InsightCard() {
  const { decision, deviceState, settings } = useGrainStore();
  const lang = settings.language as AppLanguage;

  // Handle non-connected states
  if (deviceState === 'sleeping') {
    return (
      <div className="grain-insight-card grain-fade-in">
        <div className="flex items-start gap-4">
          <div className="grain-insight-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <Moon size={20} weight="fill" style={{ color: 'var(--gm-accent)' }} />
          </div>
          <div>
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
          <div>
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

  const IconComponent =
    decision.state === 'critical'
      ? WarningCircle
      : decision.state === 'warn'
        ? Warning
        : CheckCircle;

  const title =
    decision.state === 'critical'
      ? t('insight.action_required', lang)
      : decision.state === 'warn'
        ? t('insight.attention', lang)
        : t('insight.storage_safe', lang);

  // Use i18n key if available, fallback to stored English
  const messageText = decision.messageKey ? t(decision.messageKey, lang) : decision.message;
  const actionText = decision.actionKey ? t(decision.actionKey, lang) : decision.action;

  return (
    <div className="grain-insight-card grain-fade-in">
      <div className="flex items-start gap-4">
        <div className="grain-insight-icon w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
          <IconComponent size={20} weight="fill" style={{ color: 'var(--gm-accent)' }} />
        </div>
        <div>
          <h3 className="font-bold text-sm mb-1 tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--gm-text-secondary)' }}>
            {messageText}
          </p>
          <p className="text-[10px] mt-2 leading-relaxed" style={{ color: 'var(--gm-text-tertiary)' }}>
            {actionText}
          </p>
        </div>
      </div>
    </div>
  );
}
