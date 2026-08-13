'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { LANGUAGE_OPTIONS, t, type AppLanguage } from '@/lib/i18n';
import { Translate, Check } from '@phosphor-icons/react/dist/ssr';
export function LanguageSelector() {
  const { settings, updateSettings, deviceState, showToast } = useGrainStore();
  const [open, setOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState<AppLanguage | null>(null);
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

  const applyAndReload = useCallback((code: AppLanguage) => {
    // Save current connection state for auto-reconnect after reload
    // Note: BLE connection is lost on page reload.
    // User will need to reconnect after language change.

    updateSettings({ language: code });

    // Small delay so the setting is persisted before reload
    setTimeout(() => {
      window.location.reload();
    }, 200);
  }, [deviceState, updateSettings]);

  const handleSelectLanguage = useCallback((code: AppLanguage) => {
    const option = LANGUAGE_OPTIONS.find(o => o.code === code);
    if (!option) return;

    if (option.needsSave) {
      // For Hindi and Hinglish: show pending state, wait for save
      setPendingLang(code);
    } else {
      // For English and Marathi: apply immediately, reload
      applyAndReload(code);
    }
  }, [applyAndReload]);

  const handleSavePending = useCallback(() => {
    if (pendingLang) {
      showToast(t('language.saved', lang));
      applyAndReload(pendingLang);
    }
  }, [pendingLang, lang, showToast, applyAndReload]);

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
        aria-label="Change language"
      >
        <span className="text-[10px] font-bold" style={{ color: 'var(--gm-text-primary)' }}>
          {shortCode}
        </span>
      </button>
    );
  }

  return (
    <div className="grain-lang-overlay" onClick={() => { setOpen(false); setPendingLang(null); }}>
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
              Choose your preferred language
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {LANGUAGE_OPTIONS.map((option) => {
            const isSelected = lang === option.code || pendingLang === option.code;
            return (
              <div key={option.code} className="flex items-center gap-3">
                <button
                  onClick={() => handleSelectLanguage(option.code)}
                  className="flex-1 flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98] text-left"
                  style={{
                    background: isSelected ? 'var(--gm-accent-dim)' : 'var(--gm-surface)',
                    border: `1px solid ${isSelected ? 'var(--gm-accent)' : 'var(--gm-border)'}`,
                  }}
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
                </button>

                {/* Save button for Hindi and Hinglish */}
                {option.needsSave && pendingLang === option.code && (
                  <button
                    onClick={handleSavePending}
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all"
                    style={{
                      background: 'var(--gm-accent)',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px var(--gm-accent-glow)',
                    }}
                    aria-label={t('language.save', lang)}
                  >
                    <Check size={18} weight="bold" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {pendingLang && (
          <p className="text-[11px] mt-4 text-center" style={{ color: 'var(--gm-text-tertiary)' }}>
            Tap <span style={{ color: 'var(--gm-accent)', fontWeight: 700 }}>✓</span> to save & reload
          </p>
        )}
      </div>
    </div>
  );
}
