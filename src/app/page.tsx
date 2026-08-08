'use client';

import { useEffect, useRef } from 'react';
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

export default function GrainMonitorPage() {
  const {
    activeTab, deviceState, riskTheme, currentReading, settings,
    loadSettings, loadHistory, simulateConnect,
  } = useGrainStore();

  const scrollRef = useRef<HTMLDivElement>(null);

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
