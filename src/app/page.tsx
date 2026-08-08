'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { Header } from '@/components/grain/header';
import { BottomNav } from '@/components/grain/bottom-nav';
import { Toast } from '@/components/grain/toast';
import { DisconnectedView } from '@/components/grain/home/disconnected-view';
import { ConnectingView } from '@/components/grain/home/connecting-view';
import { ConnectedView } from '@/components/grain/home/connected-view';
import { SleepingView, LowBatteryView, SyncingView } from '@/components/grain/home/special-states';
import { DiscoverTab } from '@/components/grain/discover/discover-tab';
import { HistoryTab } from '@/components/grain/history/history-tab';
import { SettingsTab } from '@/components/grain/settings/settings-tab';

/**
 * Compute all glass-effect CSS variables from a single opacity value.
 * This avoids unreliable calc() with CSS custom properties.
 */
function computeGlassVars(opacity: number, isDark: boolean) {
  const o = opacity;
  const bgR = isDark ? 9 : 245;
  const bgG = isDark ? 9 : 245;
  const bgB = isDark ? 11 : 247;

  return {
    '--gm-glass-opacity': o,
    // Backgrounds
    '--gm-glass-bg': `rgba(${bgR}, ${bgG}, ${bgB}, ${o})`,
    '--gm-surface': isDark
      ? `rgba(24, 24, 27, ${(o * 0.85).toFixed(3)})`
      : `rgba(255, 255, 255, ${(o * 0.85).toFixed(3)})`,
    '--gm-toast-bg': isDark
      ? `rgba(39, 39, 42, ${Math.min(o + 0.2, 1).toFixed(3)})`
      : `rgba(255, 255, 255, ${Math.min(o + 0.15, 1).toFixed(3)})`,
    // Header blur
    '--gm-blur-header': `${(12 + o * 20).toFixed(1)}px`,
    '--gm-saturate-header': (1.1 + o * 0.4).toFixed(2),
    // Card blur
    '--gm-blur-card': `${(8 + o * 16).toFixed(1)}px`,
    '--gm-saturate-card': (1.05 + o * 0.3).toFixed(2),
    // Nav blur
    '--gm-blur-nav': `${(14 + o * 18).toFixed(1)}px`,
    '--gm-saturate-nav': (1.2 + o * 0.4).toFixed(2),
    // Insight blur
    '--gm-blur-insight': `${(8 + o * 12).toFixed(1)}px`,
    '--gm-insight-shadow-alpha': (o * 0.12).toFixed(3),
    // Toast blur
    '--gm-blur-toast': `${(12 + o * 12).toFixed(1)}px`,
    // Badge blur
    '--gm-blur-badge': `${(6 + o * 8).toFixed(1)}px`,
    // Lang panel blur
    '--gm-blur-lang': `${(16 + o * 16).toFixed(1)}px`,
    '--gm-saturate-lang': (1.3 + o * 0.4).toFixed(2),
    // Shadows (pre-computed box-shadow values)
    '--gm-card-shadow': `0 2px 8px rgba(0,0,0,${(o * 0.15).toFixed(3)}), inset 0 1px 0 var(--gm-glass-highlight)`,
    '--gm-nav-shadow': `0 8px 32px rgba(0,0,0,${(o * 0.35).toFixed(3)}), 0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 var(--gm-glass-highlight)`,
  } as React.CSSProperties;
}

export default function GrainMonitorPage() {
  const {
    activeTab, deviceState, riskTheme, currentReading, settings,
    loadSettings, loadHistory, simulateConnect,
  } = useGrainStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = settings.theme === 'dark';

  // Compute glass CSS variables from opacity
  const glassStyle = useMemo(
    () => computeGlassVars(settings.glassOpacity, isDark),
    [settings.glassOpacity, isDark]
  );

  // Load settings and history on mount
  useEffect(() => {
    loadSettings().then(() => {
      // Check for reload state (language change with active connection)
      try {
        const reloadStr = sessionStorage.getItem('grain_reload_state');
        if (reloadStr) {
          sessionStorage.removeItem('grain_reload_state');
          const reloadState = JSON.parse(reloadStr);
          if (reloadState.trigger === 'language_change' && reloadState.deviceInfo) {
            // Auto-reconnect after language change
            simulateConnect('safe');
          }
        }
      } catch { /* ignore */ }
    });
    loadHistory();
  }, []);

  // Scroll to top on tab change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const renderHomeState = () => {
    // If we have a reading, always show the dashboard (even during syncing)
    if (currentReading) {
      return <ConnectedView />;
    }

    switch (deviceState) {
      case 'disconnected':
        return <DisconnectedView />;
      case 'connecting':
        return <ConnectingView />;
      case 'syncing':
        return <SyncingView />;
      case 'sleeping':
        return <SleepingView />;
      case 'low-battery':
        return <LowBatteryView />;
      default:
        return <DisconnectedView />;
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
