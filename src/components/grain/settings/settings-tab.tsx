'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useGrainStore, DEMO_INTERVAL_PRESETS, type DemoIntervalPreset } from '@/lib/grain-store';
import {
  Cpu, DownloadSimple, ArrowClockwise, Trash, Power, Wrench,
  Sun, Moon, CaretDown, SlidersHorizontal, Palette, Play, StopCircle, Check,
  DeviceMobile, Archive, UploadSimple, ArrowsClockwise, Warning, FileCsv,
} from '@phosphor-icons/react/dist/ssr';
import { type GrainType, type AccentColor, GRAIN_OPTIONS } from '@/lib/grain-types';
import { t, tp, tGrain, type AppLanguage } from '@/lib/i18n';
import { haptic, HAPTIC_SELECT } from '@/lib/haptics';
import { buildReadingsCsv, deliverCsv } from '@/lib/csv-export';
import { playSafeAlert } from '@/lib/alert-sound';
import { usePwaInstall } from '@/lib/pwa';
import { exportBackupJSON, importBackupJSON } from '@/lib/offline-storage';
import { format } from 'date-fns';

const INTERVAL_OPTIONS: { sec: DemoIntervalPreset; key: string }[] = [
  { sec: 60, key: 'demo.1m' },
  { sec: 300, key: 'demo.5m' },
  { sec: 600, key: 'demo.10m' },
  { sec: 1800, key: 'demo.30m' },
  { sec: 3600, key: 'demo.1h' },
];

const ACCENT_COLORS: { value: AccentColor; color: string; labelKey: string }[] = [
  { value: 'orange', color: '#F97316', labelKey: 'accent.orange' },
  { value: 'green', color: '#22C55E', labelKey: 'accent.green' },
  { value: 'purple', color: '#A855F7', labelKey: 'accent.purple' },
  { value: 'blue', color: '#3B82F6', labelKey: 'accent.blue' },
  { value: 'teal', color: '#14B8A6', labelKey: 'accent.teal' },
];

export function SettingsTab() {
  const {
    deviceInfo, settings, updateSettings, selectGrainType,
    disconnectProbe, sendProbeCommand, hasDevice, showToast,
    demoMode,
  } = useGrainStore();
  const { canInstall, isStandalone, promptInstall } = usePwaInstall();

  const lang = settings.language as AppLanguage;
  const isDark = settings.theme === 'dark';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const hasConnection = hasDevice && !demoMode;

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--gm-text-primary)' }}>
        {t('settings.title', lang)}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--gm-text-secondary)' }}>
        {t('settings.desc', lang)}
      </p>

      {/* ═══ BASIC SETTINGS ═══ */}

      {/* ─── Theme Toggle ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('theme.title', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-6">
        <button
          onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gm-accent-dim)' }}
            >
              {isDark
                ? <Moon size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />
                : <Sun size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />}
            </div>
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>
                {isDark ? t('theme.dark', lang) : t('theme.light', lang)}
              </span>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--gm-text-tertiary)' }}>
                {t('theme.tap_switch', lang)}
              </p>
            </div>
          </div>
          <div className="w-11 h-6 rounded-full relative" style={{ background: isDark ? 'var(--gm-toggle-bg)' : 'var(--gm-accent)', border: `1px solid ${isDark ? 'var(--gm-toggle-border)' : 'var(--gm-accent)'}` }}>
            <div
              className="w-5 h-5 rounded-full absolute top-0.5 transition-all"
              style={{
                left: isDark ? '2px' : '22px',
                background: isDark ? 'var(--gm-toggle-thumb)' : '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
            />
          </div>
        </button>
      </div>

      {/* ─── Device ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.device', lang)}
      </p>
      <div className="grain-card p-5 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'var(--gm-toggle-bg)', border: '1px solid var(--gm-toggle-border)' }}>
            <Cpu size={22} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight" style={{ color: 'var(--gm-text-primary)' }}>
              {deviceInfo?.name || '—'}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--gm-text-secondary)' }}>
              {deviceInfo ? `${deviceInfo.firmware} · ${deviceInfo.platform}` : t('settings.no_device', lang)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (!hasConnection) {
                showToast(t('settings.connect_first', lang));
                return;
              }
              await sendProbeCommand('calibrate');
            }}
            disabled={!hasConnection}
            className="flex-1 font-bold text-xs py-3.5 rounded-xl active:scale-95 transition-all tracking-wide"
            style={{
              background: hasConnection ? 'var(--gm-btn-primary-bg)' : 'var(--gm-toggle-bg)',
              color: hasConnection ? 'var(--gm-btn-primary-text)' : 'var(--gm-text-tertiary)',
              border: hasConnection ? 'none' : '1px solid var(--gm-toggle-border)',
              cursor: hasConnection ? 'pointer' : 'not-allowed',
            }}
          >
            {t('settings.calibrate', lang)}
          </button>
          {hasConnection ? (
            <button
              onClick={disconnectProbe}
              className="px-4 py-3.5 rounded-xl active:scale-95 transition-all font-bold text-xs"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <Power size={18} weight="bold" />
            </button>
          ) : null}
        </div>
      </div>

      {/* ─── Grain Type – the ONLY grain selector in the app ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.grain_type', lang)}
      </p>
      <div className="grain-card p-2.5 mb-6">
        <div className="grid grid-cols-3 gap-2">
          {GRAIN_OPTIONS.map((g) => {
            const isActive = settings.grainType === g;
            return (
              <button
                key={g}
                onClick={() => {
                  if (g === settings.grainType) return;
                  haptic(settings.hapticsEnabled, HAPTIC_SELECT);
                  selectGrainType(g);
                }}
                className={`grain-grain-card ${isActive ? 'active' : ''}`}
                aria-pressed={isActive}
              >
                <span className="truncate">{tGrain(g, lang)}</span>
                {isActive && <Check size={12} weight="bold" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ THRESHOLDS ═══ */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.thresholds', lang)}
      </p>
      <p className="text-[10px] mb-2 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.thresholds_desc', lang)}
      </p>
      <div className="grain-card p-4 mb-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-accent)' }}>{t('settings.safe', lang)}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>&lt; {settings.thresholds.safe}%</span>
            </div>
            <input
              type="range" min="8" max="25" step="0.5"
              value={settings.thresholds.safe}
              onChange={(e) => updateSettings({ thresholds: { ...settings.thresholds, safe: parseFloat(e.target.value) } })}
              className="w-full grain-range h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-band-fair)' }}>{t('settings.warn', lang)}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>&gt; {settings.thresholds.warn}%</span>
            </div>
            <input
              type="range" min="8" max="30" step="0.5"
              value={settings.thresholds.warn}
              onChange={(e) => updateSettings({ thresholds: { ...settings.thresholds, warn: parseFloat(e.target.value) } })}
              className="w-full grain-range h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: 'var(--gm-band-risky)' }}>{t('settings.critical', lang)}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>&gt; {settings.thresholds.critical}%</span>
            </div>
            <input
              type="range" min="10" max="35" step="0.5"
              value={settings.thresholds.critical}
              onChange={(e) => updateSettings({ thresholds: { ...settings.thresholds, critical: parseFloat(e.target.value) } })}
              className="w-full grain-range h-1.5"
            />
          </div>
        </div>
      </div>

      {/* ═══ PREFERENCES ═══ */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.preferences', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-6">
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.push_alerts', lang)}</span>
          <input type="checkbox" checked={settings.pushAlerts} onChange={(e) => { updateSettings({ pushAlerts: e.target.checked }); showToast(e.target.checked ? t('toast.alerts_on', lang) : t('toast.alerts_off', lang)); }} className="grain-toggle" />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.auto_sync', lang)}</span>
          <input type="checkbox" checked={settings.autoSync} onChange={(e) => { updateSettings({ autoSync: e.target.checked }); showToast(e.target.checked ? t('toast.autosync_on', lang) : t('toast.autosync_off', lang)); }} className="grain-toggle" />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.auto_reconnect', lang)}</span>
          <input type="checkbox" checked={settings.autoReconnect} onChange={(e) => { updateSettings({ autoReconnect: e.target.checked }); }} className="grain-toggle" />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.haptics', lang)}</span>
          <input type="checkbox" checked={settings.hapticsEnabled} onChange={(e) => { updateSettings({ hapticsEnabled: e.target.checked }); haptic(e.target.checked, 14); }} className="grain-toggle" />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.sound', lang)}</span>
          <input type="checkbox" checked={settings.soundAlerts} onChange={(e) => { updateSettings({ soundAlerts: e.target.checked }); if (e.target.checked) playSafeAlert(true); }} className="grain-toggle" />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.wake_on_connect', lang)}</span>
          <input type="checkbox" checked={settings.wakeOnConnect} onChange={(e) => { updateSettings({ wakeOnConnect: e.target.checked }); }} className="grain-toggle" />
        </label>
      </div>

      {/* ─── Install App (PWA) ─── */}
      {canInstall && !isStandalone && (
        <div className="grain-card overflow-hidden mb-6">
          <button
            onClick={async () => {
              const outcome = await promptInstall();
              if (outcome === 'accepted') showToast(t('toast.install_ok', lang));
              else if (outcome === 'dismissed') showToast(t('toast.install_dismissed', lang));
            }}
            className="w-full flex justify-between items-center px-5 py-4 text-left"
            style={{ color: 'var(--gm-text-primary)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--gm-accent-dim)' }}>
                <DeviceMobile size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />
              </div>
              <span className="text-sm font-medium">{t('settings.install_app', lang)}</span>
            </div>
            <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.install_desc', lang)}</span>
          </button>
        </div>
      )}

      {/* ═══ ABOUT ═══ */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.about', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-6">
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.app_version', lang)}</span>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-secondary)' }}>v1.0.0</span>
        </div>
        <div className="grain-separator" />
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.engine', lang)}</span>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-secondary)' }}>Mochi v1.0</span>
        </div>
        <div className="grain-separator" />
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.probe_firmware', lang)}</span>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-secondary)' }}>{deviceInfo?.firmware || '—'}</span>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-[10px]" style={{ color: 'var(--gm-text-tertiary)' }}>
          {t('settings.built_for', lang)}
        </p>
      </div>

      {/* ═══ ADVANCED SETTINGS (collapsed) ═══ */}
      <button
        className="grain-advanced-toggle mb-4"
        onClick={() => setAdvancedOpen(prev => !prev)}
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--gm-text-primary)' }}>
            {t('settings.advanced', lang)}
          </span>
        </div>
        <CaretDown
          size={18}
          weight="bold"
          className={`grain-chevron ${advancedOpen ? 'rotated' : ''}`}
          style={{ color: 'var(--gm-text-tertiary)' }}
        />
      </button>

      <div className={`grain-advanced-content ${advancedOpen ? 'expanded' : 'collapsed'}`}>
        {advancedOpen && <AdvancedSettingsContent />}
      </div>
    </div>
  );
}

function AdvancedSettingsContent() {
  const {
    settings, updateSettings,
    disconnectProbe, sendProbeCommand,
    syncProbeHistory, clearHistory,
    hasDevice, showToast,
    demoMode, enableDemoMode, disableDemoMode,
    demoIntervalSec, setDemoIntervalSec,
    historyEntries,
    loadHistory, loadSettings,
  } = useGrainStore();

  const lang = settings.language as AppLanguage;
  const hasConnection = hasDevice && !demoMode;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importModeRef = useRef<'merge' | 'replace'>('merge');
  const [confirmReplace, setConfirmReplace] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  /* Focus trap + focus restore for the destructive confirmation modal.
     Tab/Shift+Tab cycle inside the dialog; Escape closes (capture-phase,
     works even when focus sits on body); on close, focus returns to the
     element that opened the dialog (captured in the click handler — by the
     time the open-effect runs, React has already applied autoFocus to the
     Cancel button, so the effect would otherwise capture the dialog itself). */
  const openReplaceModal = () => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setConfirmReplace(true);
  };

  useEffect(() => {
    if (!confirmReplace) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setConfirmReplace(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const overlay = overlayRef.current;
      if (!overlay) return;
      const focusables = Array.from(
        overlay.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !overlay.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !overlay.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      lastFocusRef.current?.focus?.();
    };
  }, [confirmReplace]);

  const openImportPicker = (mode: 'merge' | 'replace') => {
    importModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    const mode = importModeRef.current;
    try {
      const text = await file.text();
      const result = await importBackupJSON(text, mode);
      // Refresh the live store from the restored database
      await loadHistory();
      await loadSettings();
      showToast(`${t(mode === 'replace' ? 'toast.backup_replaced' : 'toast.backup_imported', lang)} · ${result.history}`);
    } catch (err) {
      showToast(err instanceof Error && err.message === 'invalid'
        ? t('toast.import_invalid', lang)
        : t('toast.import_failed', lang));
    }
  };

  return (
    <>
      {/* ─── Demo Mode ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1 mt-4" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('demo.title', lang)}
      </p>
      <div className="grain-card p-5 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: demoMode ? 'rgba(34, 197, 94, 0.12)' : 'var(--gm-toggle-bg)', border: `1px solid ${demoMode ? 'rgba(34, 197, 94, 0.25)' : 'var(--gm-toggle-border)'}` }}
          >
            {demoMode
              ? <StopCircle size={22} weight="fill" style={{ color: '#22C55E' }} />
              : <Play size={22} weight="fill" style={{ color: 'var(--gm-text-secondary)' }} />}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm tracking-tight mb-1" style={{ color: 'var(--gm-text-primary)' }}>
              {t('demo.title', lang)}
            </h3>
            <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--gm-text-secondary)' }}>
              {t('demo.desc', lang)}
            </p>
            <button
              onClick={() => {
                if (demoMode) {
                  disableDemoMode();
                } else {
                  enableDemoMode();
                }
              }}
              className="font-bold text-xs py-3 px-5 rounded-xl active:scale-95 transition-all tracking-wide"
              style={{
                background: demoMode ? 'rgba(239, 68, 68, 0.12)' : 'var(--gm-btn-primary-bg)',
                color: demoMode ? '#EF4444' : 'var(--gm-btn-primary-text)',
                border: demoMode ? '1px solid rgba(239, 68, 68, 0.25)' : 'none',
              }}
            >
              {demoMode ? t('demo.stop', lang) : t('demo.start', lang)}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Data Interval ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('demo.interval_title', lang)}
      </p>
      <p className="text-[10px] mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('demo.sim_speed', lang)}
      </p>
      <div className="grain-card p-2 flex flex-wrap gap-2 mb-6">
        {INTERVAL_OPTIONS.map((opt) => {
          const isActive = demoIntervalSec === opt.sec;
          return (
            <button
              key={opt.sec}
              onClick={() => setDemoIntervalSec(opt.sec)}
              className="px-3.5 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all"
              style={{
                background: isActive ? 'var(--gm-accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--gm-text-secondary)',
              }}
            >
              {t(opt.key, lang)}
            </button>
          );
        })}
      </div>

      {/* ─── Accent Color ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1 mt-4" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('accent.title', lang)}
      </p>
      <div className="grain-card p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gm-accent-dim)' }}
            >
              <Palette size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>
              {t('accent.title', lang)}
            </span>
          </div>
        </div>
        <div className="flex justify-between mt-4 px-1">
          {ACCENT_COLORS.map((a) => (
            <div key={a.value} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => updateSettings({ accentColor: a.value })}
                className={`grain-accent-dot ${settings.accentColor === a.value ? 'selected' : ''}`}
                style={{ background: a.color }}
                aria-label={t(a.labelKey, lang)}
              />
              <span className="text-[9px] font-medium" style={{ color: settings.accentColor === a.value ? 'var(--gm-accent)' : 'var(--gm-text-tertiary)' }}>
                {t(a.labelKey, lang)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Probe Controls ─── */}
      {hasConnection && (
        <>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
            {t('settings.probe_controls', lang)}
          </p>
          <div className="grain-card overflow-hidden mb-6">
            <button
              onClick={syncProbeHistory}
              className="w-full flex justify-between items-center px-5 py-4 transition-colors text-left"
              style={{ color: 'var(--gm-text-primary)' }}
            >
              <div className="flex items-center gap-3">
                <ArrowClockwise size={18} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
                <span className="text-sm font-medium">{t('settings.sync_history', lang)}</span>
              </div>
              <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.sync_history_desc', lang)}</span>
            </button>
            <div className="grain-separator" />
            <button
              onClick={() => sendProbeCommand('wake')}
              className="w-full flex justify-between items-center px-5 py-4 transition-colors text-left"
              style={{ color: 'var(--gm-text-primary)' }}
            >
              <div className="flex items-center gap-3">
                <Wrench size={18} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
                <span className="text-sm font-medium">{t('settings.wake_probe', lang)}</span>
              </div>
              <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.wake_probe_desc', lang)}</span>
            </button>
          </div>
        </>
      )}

      {/* ─── Export / Data ─── */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.data', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-8">
        {/* Decision columns toggle — controls BOTH CSV entry points
            (this row + the History header export) via settings.exportDecisions */}
        <div className="flex justify-between items-center gap-4 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gm-accent-dim)' }}>
              <FileCsv size={18} weight="bold" style={{ color: 'var(--gm-accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.export_decisions', lang)}</p>
              <p className="text-[10px] leading-snug mt-0.5" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.export_decisions_desc', lang)}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.exportDecisions}
            onChange={(e) => { updateSettings({ exportDecisions: e.target.checked }); haptic(e.target.checked, 10); }}
            className="grain-toggle shrink-0"
            aria-label={t('settings.export_decisions', lang)}
          />
        </div>
        <div className="grain-separator" />
        <button
          onClick={async () => {
            if (historyEntries.length === 0) {
              showToast(t('toast.nothing_to_export', lang));
              return;
            }
            haptic(settings.hapticsEnabled, 8);
            try {
              /* Client-side builder — the readings live in this browser's
               * IndexedDB; a server route can never read them (the old
               * /api/export endpoint always failed with 500). */
              const csv = buildReadingsCsv(historyEntries, lang, settings.exportDecisions);
              const filename = `mochi-grain-readings-${format(Date.now(), 'yyyy-MM-dd')}.csv`;
              const outcome = await deliverCsv(csv, filename);
              if (outcome !== 'cancelled') showToast(tp('toast.exported', lang, { n: historyEntries.length }));
            } catch {
              showToast(t('toast.export_failed', lang));
            }
          }}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: 'var(--gm-text-primary)' }}
        >
          <div className="flex items-center gap-3">
            <DownloadSimple size={18} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
            <span className="text-sm font-medium">{t('settings.export_csv', lang)}</span>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.download', lang)}</span>
        </button>
        <div className="grain-separator" />
        <button
          onClick={async () => {
            try {
              const json = await exportBackupJSON();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `grain-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click(); URL.revokeObjectURL(url);
              showToast(t('toast.backup_exported', lang));
            } catch { showToast(t('toast.export_failed', lang)); }
          }}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: 'var(--gm-text-primary)' }}
        >
          <div className="flex items-center gap-3">
            <Archive size={18} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
            <span className="text-sm font-medium">{t('settings.export_backup', lang)}</span>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.full_data', lang)}</span>
        </button>
        <div className="grain-separator" />
        <button
          onClick={() => openImportPicker('merge')}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: 'var(--gm-text-primary)' }}
        >
          <div className="flex items-center gap-3">
            <UploadSimple size={18} weight="bold" style={{ color: 'var(--gm-text-secondary)' }} />
            <span className="text-sm font-medium">{t('settings.import_backup', lang)}</span>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.full_data', lang)}</span>
        </button>
        <div className="grain-separator" />
        <button
          onClick={openReplaceModal}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: '#EF4444' }}
        >
          <div className="flex items-center gap-3">
            <ArrowsClockwise size={18} weight="bold" style={{ color: '#EF4444' }} />
            <span className="text-sm font-medium">{t('settings.replace_data', lang)}</span>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.replace_desc', lang)}</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleImportFile}
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Replace-all confirmation modal (glass, app-token themed)
            Portaled into .grain-app: CSS vars are scoped there, and it has no
            transform/filter, so position:fixed still tracks the viewport. */}
        {confirmReplace && typeof document !== 'undefined' && createPortal(
          <div
            ref={overlayRef}
            className="grain-modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="grain-replace-title"
            onClick={(e) => { if (e.target === e.currentTarget) setConfirmReplace(false); }}
            onKeyDown={(e) => { if (e.key === 'Escape') setConfirmReplace(false); }}
          >
            <div className="grain-modal-card">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <Warning size={20} weight="fill" style={{ color: '#EF4444' }} />
              </div>
              <h3 id="grain-replace-title" className="text-base font-bold tracking-tight mb-1.5" style={{ color: 'var(--gm-text-primary)' }}>
                {t('settings.replace_confirm_title', lang)}
              </h3>
              <p className="text-[12px] leading-relaxed mb-5" style={{ color: 'var(--gm-text-secondary)' }}>
                {t('settings.replace_confirm_desc', lang)}
              </p>
              <div className="flex gap-3">
                <button
                  autoFocus
                  onClick={() => setConfirmReplace(false)}
                  className="flex-1 py-3 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 grain-modal-cancel"
                >
                  {t('settings.cancel', lang)}
                </button>
                <button
                  onClick={() => {
                    setConfirmReplace(false);
                    openImportPicker('replace');
                  }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95"
                  style={{ background: 'rgba(239, 68, 68, 0.14)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.32)' }}
                >
                  {t('settings.replace_confirm_action', lang)}
                </button>
              </div>
            </div>
          </div>,
          document.querySelector('.grain-app') ?? document.body,
        )}
        <div className="grain-separator" />
        <button
          onClick={() => { clearHistory(); showToast(t('toast.history_cleared', lang)); }}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: '#EF4444' }}
        >
          <div className="flex items-center gap-3">
            <Trash size={18} weight="bold" style={{ color: '#EF4444' }} />
            <span className="text-sm font-medium">{t('settings.clear_history', lang)}</span>
          </div>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-tertiary)' }}>{t('settings.local_only', lang)}</span>
        </button>
      </div>
    </>
  );
}
