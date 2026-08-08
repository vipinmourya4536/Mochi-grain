'use client';

import { useGrainStore } from '@/lib/grain-store';
import {
  Cpu, DownloadSimple, ArrowClockwise, Trash, Power, Wrench,
} from '@phosphor-icons/react/dist/ssr';
import { GRAIN_LABELS, type GrainType } from '@/lib/grain-types';

const GRAIN_OPTIONS: GrainType[] = ['wheat', 'rice', 'corn', 'barley', 'soybean', 'sorghum', 'oats', 'millet', 'other'];

export function SettingsTab() {
  const {
    deviceInfo, deviceState, settings, updateSettings,
    disconnectProbe, sendProbeCommand, connectProbe, showToast,
    simulateConnect, syncProbeHistory, clearHistory,
  } = useGrainStore();

  const isConnected = deviceState === 'connected' || deviceState === 'sleeping' || deviceState === 'low-battery';

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#f4f4f5' }}>
        Settings
      </h2>
      <p className="text-sm mb-6" style={{ color: '#a1a1aa' }}>
        Device & preferences
      </p>

      {/* Device Card */}
      <div className="grain-card p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: '#27272a', border: '1px solid #3f3f46' }}>
            <Cpu size={22} weight="bold" style={{ color: '#a1a1aa' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight" style={{ color: '#f4f4f5' }}>
              {deviceInfo?.name || 'GRAIN-01'}
            </h3>
            <p className="text-[11px] mt-0.5" style={{ color: '#a1a1aa' }}>
              {deviceInfo?.firmware || 'FW v1.2.4'} · {deviceInfo?.platform || 'ESP32'}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              if (!isConnected) { connectProbe(); return; }
              await sendProbeCommand('calibrate');
            }}
            className="flex-1 font-bold text-xs py-3.5 rounded-xl active:scale-95 transition-all tracking-wide"
            style={{ background: '#e4e4e7', color: '#09090b' }}
          >
            CALIBRATE
          </button>
          {isConnected ? (
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
                background: '#27272a',
                color: '#a1a1aa',
                border: '1px solid #3f3f46',
              }}
            >
              <ArrowClockwise size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Probe Commands */}
      {isConnected && (
        <>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
            Probe Controls
          </p>
          <div className="grain-card overflow-hidden mb-6">
            <button
              onClick={syncProbeHistory}
              className="w-full flex justify-between items-center px-5 py-4 transition-colors text-left"
              style={{ color: '#f4f4f5' }}
            >
              <div className="flex items-center gap-3">
                <ArrowClockwise size={18} weight="bold" style={{ color: '#a1a1aa' }} />
                <span className="text-sm font-medium">Sync History</span>
              </div>
              <span className="text-[11px]" style={{ color: '#71717a' }}>Pull old readings</span>
            </button>
            <div style={{ height: 1, background: '#27272a' }} />
            <button
              onClick={() => sendProbeCommand('wake')}
              className="w-full flex justify-between items-center px-5 py-4 transition-colors text-left"
              style={{ color: '#f4f4f5' }}
            >
              <div className="flex items-center gap-3">
                <Wrench size={18} weight="bold" style={{ color: '#a1a1aa' }} />
                <span className="text-sm font-medium">Wake Probe</span>
              </div>
              <span className="text-[11px]" style={{ color: '#71717a' }}>Exit sleep mode</span>
            </button>
          </div>
        </>
      )}

      {/* Simulation Controls */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
        Demo States
      </p>
      <div className="grain-card p-2 flex gap-2 mb-6">
        <button
          onClick={() => simulateConnect('safe')}
          className="flex-1 py-3 rounded-xl text-[11px] font-bold tracking-wide uppercase active:scale-95 transition-all"
          style={{ color: '#F97316' }}
        >
          Safe
        </button>
        <button
          onClick={() => simulateConnect('warn')}
          className="flex-1 py-3 rounded-xl text-[11px] font-bold tracking-wide uppercase active:scale-95 transition-all"
          style={{ color: '#F59E0B' }}
        >
          Warn
        </button>
        <button
          onClick={() => simulateConnect('critical')}
          className="flex-1 py-3 rounded-xl text-[11px] font-bold tracking-wide uppercase active:scale-95 transition-all"
          style={{ color: '#EF4444' }}
        >
          Critical
        </button>
      </div>

      {/* Grain Type */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
        Grain Type
      </p>
      <div className="grain-card p-2 flex flex-wrap gap-2 mb-6">
        {GRAIN_OPTIONS.map((g) => (
          <button
            key={g}
            onClick={() => updateSettings({ grainType: g })}
            className="px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide transition-all"
            style={{
              background: settings.grainType === g ? 'var(--gm-accent)' : 'transparent',
              color: settings.grainType === g ? '#fff' : '#a1a1aa',
            }}
          >
            {GRAIN_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Thresholds */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
        Moisture Thresholds (%)
      </p>
      <div className="grain-card p-4 mb-6">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#F97316' }}>Safe</span>
              <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>&lt; {settings.thresholds.safe}%</span>
            </div>
            <input
              type="range" min="8" max="25" step="0.5"
              value={settings.thresholds.safe}
              onChange={(e) => updateSettings({
                thresholds: { ...settings.thresholds, safe: parseFloat(e.target.value) }
              })}
              className="w-full accent-orange-500 h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#F59E0B' }}>Warning</span>
              <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>&gt; {settings.thresholds.warn}%</span>
            </div>
            <input
              type="range" min="8" max="30" step="0.5"
              value={settings.thresholds.warn}
              onChange={(e) => updateSettings({
                thresholds: { ...settings.thresholds, warn: parseFloat(e.target.value) }
              })}
              className="w-full accent-amber-500 h-1.5"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold tracking-wider uppercase" style={{ color: '#EF4444' }}>Critical</span>
              <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>&gt; {settings.thresholds.critical}%</span>
            </div>
            <input
              type="range" min="10" max="35" step="0.5"
              value={settings.thresholds.critical}
              onChange={(e) => updateSettings({
                thresholds: { ...settings.thresholds, critical: parseFloat(e.target.value) }
              })}
              className="w-full accent-red-500 h-1.5"
            />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
        Preferences
      </p>
      <div className="grain-card overflow-hidden mb-6">
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Push Alerts</span>
          <input
            type="checkbox"
            checked={settings.pushAlerts}
            onChange={(e) => {
              updateSettings({ pushAlerts: e.target.checked });
              showToast(e.target.checked ? 'Alerts enabled' : 'Alerts disabled');
            }}
            className="grain-toggle"
          />
        </label>
        <div style={{ height: 1, background: '#27272a' }} />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Auto-sync</span>
          <input
            type="checkbox"
            checked={settings.autoSync}
            onChange={(e) => {
              updateSettings({ autoSync: e.target.checked });
              showToast(e.target.checked ? 'Auto-sync on' : 'Auto-sync off');
            }}
            className="grain-toggle"
          />
        </label>
        <div style={{ height: 1, background: '#27272a' }} />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Auto-reconnect</span>
          <input
            type="checkbox"
            checked={settings.autoReconnect}
            onChange={(e) => {
              updateSettings({ autoReconnect: e.target.checked });
            }}
            className="grain-toggle"
          />
        </label>
        <div style={{ height: 1, background: '#27272a' }} />
        <label className="flex justify-between items-center px-5 py-4 cursor-pointer">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Wake on Connect</span>
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

      {/* Export */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
        Data
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
              showToast('CSV exported');
            } catch {
              showToast('Export failed');
            }
          }}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: '#f4f4f5' }}
        >
          <div className="flex items-center gap-3">
            <DownloadSimple size={18} weight="bold" style={{ color: '#a1a1aa' }} />
            <span className="text-sm font-medium">Export CSV</span>
          </div>
          <span className="text-[11px]" style={{ color: '#71717a' }}>Download</span>
        </button>
        <div style={{ height: 1, background: '#27272a' }} />
        <button
          onClick={() => {
            clearHistory();
            showToast('History cleared');
          }}
          className="w-full flex justify-between items-center px-5 py-4 text-left"
          style={{ color: '#EF4444' }}
        >
          <div className="flex items-center gap-3">
            <Trash size={18} weight="bold" style={{ color: '#EF4444' }} />
            <span className="text-sm font-medium">Clear History</span>
          </div>
          <span className="text-[11px]" style={{ color: '#71717a' }}>Local only</span>
        </button>
      </div>

      {/* About */}
      <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-3 px-1" style={{ color: '#71717a' }}>
        About
      </p>
      <div className="grain-card overflow-hidden mb-8">
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>App Version</span>
          <span className="text-[11px]" style={{ color: '#a1a1aa' }}>v1.0.0</span>
        </div>
        <div style={{ height: 1, background: '#27272a' }} />
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Engine</span>
          <span className="text-[11px]" style={{ color: '#a1a1aa' }}>Mochi Decision v1.0</span>
        </div>
        <div style={{ height: 1, background: '#27272a' }} />
        <div className="flex justify-between items-center px-5 py-4">
          <span className="text-sm font-medium" style={{ color: '#f4f4f5' }}>Probe Firmware</span>
          <span className="text-[11px]" style={{ color: '#a1a1aa' }}>{deviceInfo?.firmware || '--'}</span>
        </div>
      </div>

      <div className="text-center pb-4">
        <p className="text-[10px]" style={{ color: '#71717a' }}>
          Grain Monitor v1.0 · Built for ESP32
        </p>
      </div>
    </div>
  );
}
