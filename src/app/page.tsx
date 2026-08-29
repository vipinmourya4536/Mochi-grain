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

const LANG_MAP: Record<string, string> = {
  en: 'en', hi: 'hi', mr: 'mr', hinglish: 'en',
};

/* Accent hex values – must match CSS accent definitions */
const ACCENT_HEX: Record<string, string> = {
  orange: '#F97316',
  green:  '#22C55E',
  purple: '#A855F7',
  blue:   '#3B82F6',
  teal:   '#14B8A6',
};

/**
 * Derive the PWA/system status-bar theme-color from accent + dark/light.
 * In dark mode: darken the accent so status-bar icons remain readable.
 * In light mode: use the app background so the bar blends seamlessly.
 */
function computeThemeColor(accent: string, isDark: boolean): string {
  if (!isDark) return '#f5f5f7'; // light mode: match app bg
  const hex = ACCENT_HEX[accent] || ACCENT_HEX.orange;
  // Darken the accent to ~25% brightness for readable status-bar icons
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const factor = 0.18;
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

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
    loadSettings, loadHistory, setBtAvailable,
  } = useGrainStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = settings.theme === 'dark';

  const glassStyle = useMemo(
    () => computeGlassVars(isDark),
    [isDark]
  );

  // Sync body background with theme to prevent black/white bar
  useEffect(() => {
    document.body.style.background = isDark ? '#09090b' : '#f5f5f7';
  }, [isDark]);

  // Sync <meta name="theme-color"> with accent + dark/light mode
  useEffect(() => {
    const color = computeThemeColor(settings.accentColor, isDark);
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = color;
  }, [settings.accentColor, isDark]);

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
        {activeTab === 'home' && renderHomeState()}
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
      <BottomNav />
    </div>
  );
}
