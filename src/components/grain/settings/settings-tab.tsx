'use client';

import { useGrainStore } from '@/lib/grain-store';
import { isSimulating } from '@/lib/bluetooth';
import {
  Cpu, DownloadSimple, ArrowClockwise, Trash, Power, Wrench,
  Sun, Moon, Palette,
} from '@phosphor-icons/react/dist/ssr';
import { GRAIN_LABELS, type GrainType, type AccentColor } from '@/lib/grain-types';
import { t } from '@/lib/i18n';

const GRAIN_OPTIONS: GrainType[] = ['wheat', 'rice', 'corn', 'barley', 'soybean', 'sorghum', 'oats', 'millet', 'other'];

const ACCENT_COLORS: { value: AccentColor; color: string; labelKey: string }[] = [
  { value: 'orange', color: '#F97316', labelKey: 'accent.orange' },
  { value: 'green', color: '#22C55E', labelKey: 'accent.green' },
  { value: 'purple', color: '#A855F7', labelKey: 'accent.purple' },
  { value: 'blue', color: '#3B82F6', labelKey: 'accent.blue' },
  { value: 'teal', color: '#14B8A6', labelKey: 'accent.teal' },
];

export function SettingsTab() {
  const {
    deviceInfo, deviceState, settings, updateSettings, selectGrainType,
    disconnectProbe, sendProbeCommand, connectProbe, showToast,
    simulateConnect, switchDemoMode, syncProbeHistory, clearHistory,
    hasDevice,
  } = useGrainStore();

  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';
  const hasConnection = hasDevice;
  const simRunning = isSimulating();
  const isDark = settings.theme === 'dark';

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: 'var(--gm-text-primary)' }}>
        {t('settings.title', lang)}
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--gm-text-secondary)' }}>
        {t('settings.desc', lang)}
      </p>

      {/* ─── Theme Toggle (Dark/Light) ─── */}
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
                Tap to switch
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

      {/* ─── Accent Color Picker ───*/}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
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

      {/* ─── Device Card ─── */}
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
              {deviceInfo?.name || 'GRAIN-01'}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--gm-text-secondary)' }}>
              {deviceInfo?.firmware || 'FW v1.2.4'} · {deviceInfo?.platform || 'ESP32'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (!hasConnection) { simulateConnect(); return; }
              await sendProbeCommand('calibrate');
            }}
            className="flex-1 font-bold text-xs py-3.5 rounded-xl active:scale-95 transition-all tracking-wide"
            style={{ background: 'var(--gm-btn-primary-bg)', color: 'var(--gm-btn-primary-text)' }}
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
          ) : (
            <button
              onClick={() => simulateConnect()}
              className="px-4 py-3.5 rounded-xl active:scale-95 transition-all font-bold text-xs"
              style={{
                background: 'var(--gm-toggle-bg)',
                color: 'var(--gm-text-secondary)',
                border: '1px solid var(--gm-toggle-border)',
              }}
            >
              <ArrowClockwise size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Probe Controls ───*/}
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

      {/* ─── Simulation / Demo States ───*/}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.demo_states', lang)}
      </p>
      <div className="grain-card p-2 flex gap-2 mb-6">
        {(['safe', 'warn', 'critical'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              if (simRunning) {
                switchDemoMode(mode);
              } else {
                simulateConnect(mode);
              }
            }}
            className="flex-1 py-3 rounded-xl text-[11px] font-bold tracking-wide uppercase active:scale-95 transition-all"
            style={{
              color: mode === 'safe' ? 'var(--gm-accent)' : mode === 'warn' ? '#F59E0B' : '#EF4444',
              background: mode === 'safe' ? 'var(--gm-accent-dim)' : mode === 'warn' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            }}
          >
            {mode === 'critical' ? t('settings.critical', lang) : mode === 'warn' ? t('settings.warn', lang) : t('settings.safe', lang)}
          </button>
        ))}
      </div>

      {/* ─── Grain Type ───*/}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.grain_type', lang)}
      </p>
      <div className="grain-card p-2 flex flex-wrap gap-2 mb-6">
        {GRAIN_OPTIONS.map((g) => {
          const isActive = settings.grainType === g;
          return (
            <button
              key={g}
              onClick={() => selectGrainType(g)}
              className="px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all"
              style={{
                background: isActive ? 'var(--gm-accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--gm-text-secondary)',
              }}
            >
              {GRAIN_LABELS[g]}
            </button>
          );
        })}
      </div>

      {/* ─── Thresholds ───*/}
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
              onChange={(e) => updateSettings({
                thresholds: { ...settings.thresholds, safe: parseFloat(e.target.value) }
              })}
              className="w-full grain-range h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#F59E0B' }}>{t('settings.warn', lang)}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>&gt; {settings.thresholds.warn}%</span>
            </div>
            <input
              type="range" min="8" max="30" step="0.5"
              value={settings.thresholds.warn}
              onChange={(e) => updateSettings({
                thresholds: { ...settings.thresholds, warn: parseFloat(e.target.value) }
              })}
              className="w-full grain-range h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#EF4444' }}>{t('settings.critical', lang)}</span>
              <span className="text-sm font-bold" style={{ color: 'var(--gm-text-primary)' }}>&gt; {settings.thresholds.critical}%</span>
            </div>
            <input
              type="range" min="10" max="35" step="0.5"
              value={settings.thresholds.critical}
              onChange={(e) => updateSettings({
                thresholds: { ...settings.thresholds, critical: parseFloat(e.target.value) }
              })}
              className="w-full grain-range h-1.5"
            />
          </div>
        </div>
      </div>

      {/* ─── Preferences ───*/}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.preferences', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-6">
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.push_alerts', lang)}</span>
          <input
            type="checkbox"
            checked={settings.pushAlerts}
            onChange={(e) => {
              updateSettings({ pushAlerts: e.target.checked });
              showToast(e.target.checked ? t('toast.alerts_on', lang) : t('toast.alerts_off', lang));
            }}
            className="grain-toggle"
          />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.auto_sync', lang)}</span>
          <input
            type="checkbox"
            checked={settings.autoSync}
            onChange={(e) => {
              updateSettings({ autoSync: e.target.checked });
              showToast(e.target.checked ? t('toast.autosync_on', lang) : t('toast.autosync_off', lang));
            }}
            className="grain-toggle"
          />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.auto_reconnect', lang)}</span>
          <input
            type="checkbox"
            checked={settings.autoReconnect}
            onChange={(e) => {
              updateSettings({ autoReconnect: e.target.checked });
            }}
            className="grain-toggle"
          />
        </label>
        <div className="grain-separator" />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.wake_on_connect', lang)}</span>
          <input
            type="checkbox"
            checked={settings.wakeOnConnect}
            onChange={(e) => {
              updateSettings({ wakeOnConnect: e.target.checked });
            }}
            className="grain-toggle"
          />
        </label>
      </div>

      {/* ─── Export / Data ───*/}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.data', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-6">
        <button
          onClick={async () => {
            try {
              const res = await fetch('/api/export?format=csv');
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `grain-readings-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              showToast(t('toast.csv_exported', lang));
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
          onClick={() => {
            clearHistory();
            showToast(t('toast.history_cleared', lang));
          }}
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

      {/* ─── About ───*/}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: 'var(--gm-text-tertiary)' }}>
        {t('settings.about', lang)}
      </p>
      <div className="grain-card overflow-hidden mb-8">
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.app_version', lang)}</span>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-secondary)' }}>v1.0.0</span>
        </div>
        <div className="grain-separator" />
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.engine', lang)}</span>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-secondary)' }}>Mochi Decision v1.0</span>
        </div>
        <div className="grain-separator" />
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: 'var(--gm-text-primary)' }}>{t('settings.probe_firmware', lang)}</span>
          <span className="text-[11px]" style={{ color: 'var(--gm-text-secondary)' }}>{deviceInfo?.firmware || '--'}</span>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-[10px]" style={{ color: 'var(--gm-text-tertiary)' }}>
          Grain Monitor v1.0 · Built for ESP32
        </p>
      </div>
    </div>
  );
}
