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
    activeTab, deviceState, riskTheme,
    loadSettings, loadHistory,
  } = useGrainStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load settings and history on mount
  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  // Scroll to top on tab change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  const renderHomeState = () => {
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
      case 'connected':
      case 'awake':
        return <ConnectedView />;
      default:
        return <DisconnectedView />;
    }
  };

  return (
    <div className="grain-app" data-grain-theme={riskTheme}>
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
