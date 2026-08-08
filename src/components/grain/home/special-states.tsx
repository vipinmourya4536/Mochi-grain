'use client';

import { useGrainStore } from '@/lib/grain-store';
import { Moon, BatteryWarningLow } from '@phosphor-icons/react/dist/ssr';

export function SleepingView() {
  const { currentReading, deviceInfo } = useGrainStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 grain-card">
        <Moon size={28} weight="bold" style={{ color: '#a1a1aa' }} />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight" style={{ color: '#f4f4f5' }}>
        Probe Sleeping
      </h2>
      <p className="text-sm mb-6 text-center max-w-[220px] leading-relaxed" style={{ color: '#a1a1aa' }}>
        The probe is in low-power mode to conserve battery. Readings will resume when it wakes.
      </p>
      {deviceInfo && (
        <div className="grain-card p-4 w-full max-w-[240px]">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: '#a1a1aa' }}>Battery</span>
            <span className="text-sm font-bold" style={{ color: '#f4f4f5' }}>
              {deviceInfo.battery}%
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full" style={{ background: '#27272a' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${deviceInfo.battery}%`,
                background: deviceInfo.battery < 20 ? '#EF4444' : '#F97316',
              }}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => useGrainStore.getState().sendProbeCommand('wake')}
        className="mt-6 font-bold px-8 py-3.5 rounded-xl text-sm active:scale-95 transition-transform tracking-wide"
        style={{ background: '#e4e4e7', color: '#09090b' }}
      >
        WAKE PROBE
      </button>
    </div>
  );
}

export function LowBatteryView() {
  const { currentReading, deviceInfo } = useGrainStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
        <BatteryWarningLow size={28} weight="bold" style={{ color: '#EF4444' }} />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight" style={{ color: '#f4f4f5' }}>
        Low Battery
      </h2>
      <p className="text-sm mb-6 text-center max-w-[240px] leading-relaxed" style={{ color: '#a1a1aa' }}>
        Probe battery is critically low. Replace or charge the battery soon to avoid data loss.
      </p>
      {deviceInfo && (
        <div className="grain-card p-4 w-full max-w-[240px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: '#a1a1aa' }}>Battery Level</span>
            <span className="text-sm font-bold" style={{ color: '#EF4444' }}>
              {deviceInfo.battery}%
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: '#27272a' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${deviceInfo.battery}%`,
                background: '#EF4444',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SyncingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="grain-spinner mb-5" />
      <h2 className="text-base font-bold mb-1 tracking-tight" style={{ color: '#f4f4f5' }}>
        Syncing
      </h2>
      <p className="text-sm grain-pulse" style={{ color: '#a1a1aa' }}>
        Retrieving history from probe...
      </p>
    </div>
  );
}
