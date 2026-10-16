'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { registerBackConsumer } from '@/lib/back-nav';
import { LANGUAGE_OPTIONS, t, type AppLanguage } from '@/lib/i18n';
import { Check, CaretDown } from '@phosphor-icons/react/dist/ssr';

/**
 * Compact rounded-rectangle glass language control: [ EN ˅ ]
 * Utility action weight – deliberately lighter than the battery capsule.
 */
export function LanguageSelector() {
  const { settings, updateSettings } = useGrainStore();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
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

  /* Android Back closes this panel first (top priority overlay).
   * onClose touches ONLY this panel — never the parent tab. */
  useEffect(() => {
    if (!open) return;
    return registerBackConsumer({
      id: 'language-panel',
      priority: 40,
      onClose: () => {
        setOpen(false);
        return true;
      },
    });
  }, [open]);

  // Close on outside pointer press
  useEffect(() => {
    if (!open) return;
    const handlePointer = (e: PointerEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    return () => document.removeEventListener('pointerdown', handlePointer);
  }, [open]);

  const handleSelectLanguage = useCallback((code: AppLanguage) => {
    updateSettings({ language: code });
    setOpen(false);
  }, [updateSettings]);

  const shortCode = lang === 'hinglish' ? 'HI' : lang === 'hi' ? 'हि' : lang === 'mr' ? 'मरा' : 'EN';

  if (!open) {
    return (
      <button
        ref={btnRef}
        onClick={() => setOpen(true)}
        className="grain-lang-button"
        aria-label={t('language.change', lang)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="grain-lang-button-code">{shortCode}</span>
        <CaretDown size={9} weight="bold" className="grain-lang-button-caret" />
      </button>
    );
  }

  return (
    <div className="grain-lang-overlay" onClick={() => setOpen(false)}>
      <div
        className="grain-lang-panel"
        role="dialog"
        aria-label={t('language.title', lang)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--gm-accent-dim)' }}
          >
            <span className="text-xs font-bold" style={{ color: 'var(--gm-accent)' }}>{shortCode}</span>
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
                className={`grain-lang-option ${isSelected ? 'active' : ''}`}
                aria-pressed={isSelected}
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
