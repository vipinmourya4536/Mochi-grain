'use client';

import { useEffect, useRef, useMemo, useCallback } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { Header } from '@/components/grain/header';
import { BottomNav } from '@/components/grain/bottom-nav';
import { Toast } from '@/components/grain/toast';
import { DisconnectedView } from '@/components/grain/home/disconnected-view';
import { ConnectingView } from '@/components/grain/home/connecting-view';
import { ConnectedView } from '@/components/grain/home/connected-view';
import { BtOffHero } from '@/components/grain/home/bt-off-hero';
import { SleepingView, LowBatteryView, SyncingView } from '@/components/grain/home/special-states';
import { DiscoverTab } from '@/components/grain/discover/discover-tab';
import { HistoryTab } from '@/components/grain/history/history-tab';
import { SettingsTab } from '@/components/grain/settings/settings-tab';
import type { AppLanguage } from '@/lib/i18n';
import { primeAlertSound } from '@/lib/alert-sound';
import { initBackNav, syncBackNav } from '@/lib/back-nav';
import { computeGlassVars } from '@/lib/glass';

const LANG_MAP: Record<string, string> = {
  en: 'en', hi: 'hi', mr: 'mr', hinglish: 'en',
};

/**
 * System chrome color — driven by the DARK/LIGHT THEME only, never by the
 * accent color. The accent palette is confined to interactive controls,
 * the active nav item, slider thumbs and deliberate highlights; it must
 * never recolor the Android status bar or the top shell.
 *
 * Native shell note: when the app is wrapped in Capacitor, this same
 * neutral pair must be fed to the Android system-bar plugin
 * (@capacitor/status-bar setBackgroundColor + setStyle(Style.Dark/Light))
 * on theme change — changing the HTML meta alone does not repaint the
 * native bar inside the wrapper.
 */
const THEME_CHROME = {
  dark: '#09090b',  // near-black neutral — same family as the app background
  light: '#f5f5f7', // subtle off-white neutral
} as const;

function computeThemeColor(isDark: boolean): string {
  return isDark ? THEME_CHROME.dark : THEME_CHROME.light;
}

export default function GrainMonitorPage() {
  const {
    activeTab, deviceState, riskTheme, currentReading, settings, btAvailable,
    loadSettings, loadHistory, setBtAvailable,
  } = useGrainStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = settings.theme === 'dark';

  const glassStyle = useMemo(
    () => computeGlassVars(isDark, settings.glassOpacity),
    [isDark, settings.glassOpacity]
  );

  // Sync body background with theme to prevent black/white bar
  useEffect(() => {
    document.body.style.background = isDark ? '#09090b' : '#f5f5f7';
  }, [isDark]);

  // Prime the alert-sound AudioContext on the first user gesture so browser
  // autoplay policies never block the warning/critical chimes later.
  useEffect(() => {
    const prime = () => primeAlertSound();
    window.addEventListener('pointerdown', prime, { once: true, passive: true });
    window.addEventListener('keydown', prime, { once: true });
    return () => {
      window.removeEventListener('pointerdown', prime);
      window.removeEventListener('keydown', prime);
    };
  }, []);

  // Sync <meta name="theme-color"> with the DARK/LIGHT THEME only.
  // Replaces any SSR media-scoped metas with one plain meta so the
  // PWA/Android system bar always matches the app's neutral shell.
  useEffect(() => {
    const color = computeThemeColor(isDark);
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    meta.content = color;
    document.head.appendChild(meta);
  }, [isDark]);

  // Sync html lang attribute with language
  useEffect(() => {
    const htmlLang = LANG_MAP[settings.language] || 'en';
    document.documentElement.lang = htmlLang;
  }, [settings.language]);

  // Check Bluetooth availability on mount (no gate, just sets store state for BtOffHero)
  const checkBT = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      setBtAvailable(true); // no Web Bluetooth API → allow app
      return;
    }
    const bt = navigator.bluetooth as Bluetooth & { getAvailability?: () => Promise<boolean> };
    if (typeof bt.getAvailability === 'function') {
      try { setBtAvailable(await bt.getAvailability()); } catch { setBtAvailable(true); }
    } else {
      setBtAvailable(true);
    }
  }, [setBtAvailable]);

  useEffect(() => {
    loadSettings();
    loadHistory();
    checkBT();

    // Listen for BT adapter state changes
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      const btNav = navigator.bluetooth as Bluetooth & {
        addEventListener?: (e: string, h: () => void) => void;
        removeEventListener?: (e: string, h: () => void) => void;
      };
      const handler = () => { checkBT(); };
      if (btNav.addEventListener) btNav.addEventListener('availabilitychanged', handler);
      return () => { if (btNav.removeEventListener) btNav.removeEventListener('availabilitychanged', handler); };
    }
  }, [checkBT]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activeTab]);

  /* ── Android Back / PWA popstate policy ──
   * One synthetic history entry is armed while a secondary tab is open.
   * System Back pops it → the policy closes the topmost overlay (registered
   * by the overlay components) or falls back: history detail view → Home.
   * On Home nothing is armed, so Back exits the app normally. The same
   * policy object is reusable by a future Capacitor native Back listener
   * (handleBackNative). */
  useEffect(() => {
    return initBackNav({
      consumeFallback: () => {
        const s = useGrainStore.getState();
        if (s.selectedHistoryEntry) {
          s.setSelectedHistoryId(null); // close the detail view first
          return true;
        }
        if (s.activeTab !== 'home') {
          s.setActiveTab('home');
          return true;
        }
        return false; // Home + no overlays → let the OS exit
      },
      isInterceptable: () => useGrainStore.getState().activeTab !== 'home',
    });
  }, []);

  // Re-arm/disarm whenever the active tab changes (never accumulates entries)
  useEffect(() => {
    syncBackNav();
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
      <Header />
      <Toast />
      <main className="grain-scroll" ref={scrollRef}>
        {/* key={activeTab} retriggers the subtle 220ms enter transition on tab switch */}
        <div key={activeTab} className="grain-tab-enter">
          {activeTab === 'home' && renderHomeState()}
          {activeTab === 'discover' && <DiscoverTab />}
          {activeTab === 'history' && <HistoryTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
