'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { LANGUAGE_OPTIONS, t, type AppLanguage } from '@/lib/i18n';
import { Translate, Check } from '@phosphor-icons/react/dist/ssr';

export function LanguageSelector() {
  const { settings, updateSettings } = useGrainStore();
  const [open, setOpen] = useState(false);
  const lang = settings.language as AppLanguage;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleSelectLanguage = useCallback((code: AppLanguage) => {
    updateSettings({ language: code });
    setOpen(false);
  }, [updateSettings]);

  const shortCode = lang === 'hinglish' ? 'Hi' : lang === 'hi' ? 'हि' : lang === 'mr' ? 'मरा' : 'EN';

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center transition-all active:scale-90"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'var(--gm-surface)',
          border: '1.5px solid var(--gm-glass-border)',
          color: 'var(--gm-text-secondary)',
        }}
        aria-label={t('language.change', lang)}
      >
        <span className="text-[10px] font-bold" style={{ color: 'var(--gm-text-primary)' }}>
          {shortCode}
        </span>
      </button>
    );
  }

  return (
    <div className="grain-lang-overlay" onClick={() => setOpen(false)}>
      <div
        className="grain-lang-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--gm-accent-dim)' }}
          >
            <Translate size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
              {t('language.title', lang)}
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>
              {t('language.choose', lang)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = lang === option.code;
            return (
              <button
                key={option.code}
                onClick={() => handleSelectLanguage(option.code)}
                className="grain-lang-option"
                style={isSelected ? { background: 'var(--gm-accent-dim)', borderColor: 'var(--gm-accent)' } : {}}
              >
                <span
                  className="text-sm font-bold flex-1"
                  style={{ color: isSelected ? 'var(--gm-accent)' : 'var(--gm-text-primary)' }}
                >
                  {option.native}
                </span>
                <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>
                  {option.label}
                </span>
                {isSelected && (
                  <Check size={16} weight="bold" style={{ color: 'var(--gm-accent)' }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
