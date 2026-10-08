'use client';

/* ═══════════════════════════════════════════════════════════════
   PWA helpers – install prompt capture + connectivity status
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Captured across hook instances so the prompt survives tab switches */
let deferredPrompt: BeforeInstallPromptEvent | null = null;

export type InstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

/**
 * Install-flow state machine:
 * - `canInstall` true after the browser fires `beforeinstallprompt`
 * - `isStandalone` true when already running as an installed app
 * - `promptInstall()` triggers the native install sheet
 */
export function usePwaInstall() {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches) ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const onBip = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredPrompt = null;
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<InstallOutcome> => {
    if (!deferredPrompt) return 'unavailable';
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      return outcome;
    } catch {
      return 'unavailable';
    } finally {
      deferredPrompt = null;
      setCanInstall(false);
    }
  }, []);

  return { canInstall, isStandalone, promptInstall };
}

/** Live navigator.onLine status (reactive to online/offline events) */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Defer the initial sync out of the effect body (avoids cascading render)
    const initId = setTimeout(() => setOnline(navigator.onLine), 0);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      clearTimeout(initId);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
