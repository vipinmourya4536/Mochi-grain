'use client';

import { useGrainStore } from '@/lib/grain-store';
import {
  BatteryCharging,
  BatteryFull,
  BatteryHigh,
  BatteryLow,
  BatteryMedium,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';

function getBatteryIcon(level: number): Icon {
  if (level > 75) return BatteryFull;
  if (level > 50) return BatteryHigh;
  if (level > 25) return BatteryMedium;
  if (level > 10) return BatteryLow;
  return BatteryCharging;
}

export function Header() {
  const { deviceState, deviceInfo, decision, statusBadge, riskTheme } = useGrainStore();

  const statusLabel =
    deviceState === 'disconnected'
      ? 'Offline'
      : deviceState === 'connecting'
        ? 'Pairing...'
        : statusBadge;

  const accentColor =
    riskTheme === 'critical'
      ? '#EF4444'
      : riskTheme === 'warn'
        ? '#F59E0B'
        : '#F97316';

  const BatteryIcon = deviceInfo ? getBatteryIcon(deviceInfo.battery) : BatteryFull;
  const batteryLevel = deviceInfo?.battery;

  return (
    <header className="px-5 pt-14 pb-3 flex justify-between items-center shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full grain-status-dot" />
        <div>
          <h1
            className="text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ color: '#f4f4f5' }}
          >
            Grain Monitor
          </h1>
          <p
            className="text-[10px] mt-0.5 font-medium tracking-wide transition-colors duration-500"
            style={{ color: accentColor }}
          >
            {statusLabel}
          </p>
        </div>
      </div>
      {deviceInfo && (
        <div className="flex items-center gap-2">
          <BatteryIcon
            size={18}
            weight="fill"
            style={{ color: batteryLevel! < 20 ? '#EF4444' : accentColor }}
          />
          <span
            className="text-[11px] font-bold"
            style={{ color: batteryLevel! < 20 ? '#EF4444' : '#a1a1aa' }}
          >
            {batteryLevel}{'%'}
          </span>
        </div>
      )}
    </header>
  );
}
