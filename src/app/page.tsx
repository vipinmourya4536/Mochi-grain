'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { Header } from '@/components/grain/header';
import { BottomNav } from '@/components/grain/bottom-nav';
import { Toast } from '@/components/grain/toast';
import { BluetoothGate } from '@/components/grain/bluetooth-gate';
import { DisconnectedView } from '@/components/grain/home/disconnected-view';
import { ConnectingView } from '@/components/grain/home/connecting-view';
import { ConnectedView } from '@/components/grain/home/connected-view';
import { BtOffHero } from '@/components/grain/home/bt-off-hero';
import { SleepingView, LowBatteryView, SyncingView } from '@/components/grain/home/special-states';
import { DiscoverTab } from '@/components/grain/discover/discover-tab';
import { HistoryTab } from '@/components/grain/history/history-tab';
import { SettingsTab } from '@/components/grain/settings/settings-tab';

/**
 * Compute glass-effect CSS variables at a fixed nice opacity.
 * Nav bar uses solid bg via .grain-nav-solid class.
 */
function computeGlassVars(isDark: boolean) {
  const o = 0.75;
  const bgR = isDark ? 9 : 245;
  const bgG = isDark ? 9 : 245;
  const bgB = isDark ? 11 : 247;

  return {
    '--gm-glass-opacity': o,
    '--gm-glass-bg': `rgba(${bgR}, ${bgG}, ${bgB}, ${o})`,
    '--gm-surface': isDark
      ? `rgba(24, 24, 27, ${(o * 0.85).toFixed(3)})`
      : `rgba(255, 255, 255, ${(o * 0.85).toFixed(3)})`,
    '--gm-toast-bg': isDark
      ? `rgba(39, 39, 42, ${Math.min(o + 0.2, 1).toFixed(3)})`
      : `rgba(255, 255, 255, ${Math.min(o + 0.15, 1).toFixed(3)})`,
    '--gm-blur-header': `${(12 + o * 20).toFixed(1)}px`,
    '--gm-saturate-header': (1.1 + o * 0.4).toFixed(2),
    '--gm-blur-card': `${(8 + o * 16).toFixed(1)}px`,
    '--gm-saturate-card': (1.05 + o * 0.3).toFixed(2),
    '--gm-blur-nav': '27px',
    '--gm-saturate-nav': '1.5',
    '--gm-blur-insight': `${(8 + o * 12).toFixed(1)}px`,
    '--gm-insight-shadow-alpha': (o * 0.12).toFixed(3),
    '--gm-blur-toast': `${(12 + o * 12).toFixed(1)}px`,
    '--gm-blur-badge': `${(6 + o * 8).toFixed(1)}px`,
    '--gm-blur-lang': `${(16 + o * 16).toFixed(1)}px`,
    '--gm-saturate-lang': (1.3 + o * 0.4).toFixed(2),
    '--gm-card-shadow': `0 2px 8px rgba(0,0,0,${(o * 0.15).toFixed(3)}), inset 0 1px 0 var(--gm-glass-highlight)`,
    '--gm-nav-shadow': `0 8px 32px rgba(0,0,0,0.26), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 var(--gm-glass-highlight)`,
  } as React.CSSProperties;
}

export default function GrainMonitorPage() {
  const {
    activeTab, deviceState, riskTheme, currentReading, settings, btAvailable,
    loadSettings, loadHistory, simulateConnect,
  } = useGrainStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = settings.theme === 'dark';

  const glassStyle = useMemo(
    () => computeGlassVars(isDark),
    [isDark]
  );

  useEffect(() => {
    loadSettings().then(() => {
      try {
        const reloadStr = sessionStorage.getItem('grain_reload_state');
        if (reloadStr) {
          sessionStorage.removeItem('grain_reload_state');
          const reloadState = JSON.parse(reloadStr);
          if (reloadState.trigger === 'language_change' && reloadState.deviceInfo) {
            simulateConnect('safe');
          }
        }
      } catch { /* ignore */ }
    });
    loadHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTab]);

  const renderHomeState = () => {
    // When BT is off, show BT prompt in the hero card area
    if (btAvailable === false) return <BtOffHero />;
    if (currentReading) return <ConnectedView />;
    switch (deviceState) {
      case 'disconnected': return <DisconnectedView />;
      case 'connecting': return <ConnectingView />;
      case 'syncing': return <SyncingView />;
      case 'sleeping': return <SleepingView />;
      case 'low-battery': return <LowBatteryView />;
      default: return <DisconnectedView />;
    }
  };

  return (
    <div
      className="grain-app"
      data-grain-theme={riskTheme}
      data-accent={settings.accentColor}
      data-theme={settings.theme}
      style={glassStyle}
    >
      <BluetoothGate />
      <Header />
      <Toast />
      <main className="grain-scroll" ref={scrollRef}>
        {activeTab === 'home' && renderHomeState()}
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
      <BottomNav />
    </div>
  );
}
