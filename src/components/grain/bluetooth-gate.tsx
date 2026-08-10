'use client';

import { useEffect, useCallback, useRef } from 'react';
import { t, type AppLanguage } from '@/lib/i18n';
import { useGrainStore } from '@/lib/grain-store';
import { Bluetooth, WarningCircle, ArrowRight, BluetoothSlash } from '@phosphor-icons/react/dist/ssr';

/**
 * Full-screen gate that blocks the app until Bluetooth is available.
 * Uses store state (btAvailable) instead of onPass prop.
 * Shows clear text instead of blank spinner.
 * Listens for availabilitychanged events to auto-dismiss when BT is turned on.
 */
export function BluetoothGate() {
  const { settings, btAvailable, setBtAvailable } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const checkingRef = useRef(false);

  const checkBT = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
        // Web Bluetooth not supported — still allow pass for desktop testing
        setBtAvailable(true);
        return;
      }

      const bt = navigator.bluetooth as Bluetooth & {
        getAvailability?: () => Promise<boolean>;
      };

      if (typeof bt.getAvailability === 'function') {
        const available = await bt.getAvailability();
        setBtAvailable(available);
      } else {
        // Fallback: API exists but no getAvailability (older Chrome)
        setBtAvailable(true);
      }
    } catch {
      setBtAvailable(false);
    } finally {
      checkingRef.current = false;
    }
  }, [setBtAvailable]);

  useEffect(() => {
    checkBT();

    // Listen for BT adapter state changes
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      const btNav = navigator.bluetooth as Bluetooth & {
        addEventListener?: (event: string, handler: () => void) => void;
        removeEventListener?: (event: string, handler: () => void) => void;
      };

      const handler = () => { checkBT(); };
      if (btNav.addEventListener) {
        btNav.addEventListener('availabilitychanged', handler);
      }
      return () => {
        if (btNav.removeEventListener) {
          btNav.removeEventListener('availabilitychanged', handler);
        }
      };
    }
  }, [checkBT]);

  const handleEnable = async () => {
    try {
      await (navigator.bluetooth as Bluetooth & {
        requestDevice?: (opts: Record<string, unknown>) => Promise<unknown>;
      }).requestDevice?.({
        acceptAllDevices: true,
        optionalServices: [],
      });
      // If requestDevice succeeds, BT is definitely on
      setBtAvailable(true);
    } catch {
      // User cancelled or error — re-check
      checkBT();
    }
  };

  // BT is available or unsupported — render nothing, let app show
  if (btAvailable === true) return null;

  // BT is off — show full-screen gate with text
  if (btAvailable === false) {
    return (
      <div className="grain-bt-gate">
        <div className="grain-bt-gate-content">
          <div className="grain-bt-icon-wrap">
            <BluetoothSlash size={36} weight="thin" style={{ color: 'var(--gm-accent)' }} />
          </div>
          <h2 className="grain-bt-gate-title" style={{ color: 'var(--gm-text-primary)' }}>
            {t('bt.gate.off_title', lang)}
          </h2>
          <p className="grain-bt-gate-desc">
            {t('bt.gate.desc', lang)}
          </p>
          <div className="flex flex-col gap-3 w-full mt-8">
            <button
              onClick={handleEnable}
              className="grain-bt-gate-btn grain-bt-gate-btn-primary"
            >
              {t('bt.gate.enable', lang)}
              <ArrowRight size={18} weight="bold" />
            </button>
            <button
              onClick={checkBT}
              className="grain-bt-gate-btn grain-bt-gate-btn-secondary"
            >
              {t('bt.gate.check', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // btAvailable === null — still checking, show text immediately (no spinner)
  return (
    <div className="grain-bt-gate">
      <div className="grain-bt-gate-content">
        <div className="grain-bt-icon-wrap">
          <Bluetooth size={36} weight="thin" style={{ color: 'var(--gm-text-secondary)' }} />
        </div>
        <h2 className="grain-bt-gate-title" style={{ color: 'var(--gm-text-primary)' }}>
          {t('bt.gate.checking_title', lang)}
        </h2>
        <p className="grain-bt-gate-desc">
          {t('bt.gate.desc', lang)}
        </p>
        <div className="flex flex-col gap-3 w-full mt-8">
          <button
            onClick={checkBT}
            className="grain-bt-gate-btn grain-bt-gate-btn-primary"
          >
            {t('bt.gate.check', lang)}
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );
}
