'use client';

import { useState, useEffect, useCallback } from 'react';
import { t, type AppLanguage } from '@/lib/i18n';
import { useGrainStore } from '@/lib/grain-store';
import { Bluetooth, WarningCircle, ArrowRight } from '@phosphor-icons/react/dist/ssr';

type BtStatus = 'checking' | 'unavailable' | 'off';

/**
 * Full-screen gate that blocks the app until Bluetooth is available.
 * Checks navigator.bluetooth.getAvailability() and listens for
 * availabilitychanged events to auto-dismiss when BT is turned on.
 */
export function BluetoothGate({ onPass }: { onPass: () => void }) {
  const { settings } = useGrainStore();
  const lang = settings.language as AppLanguage;
  const [status, setStatus] = useState<BtStatus>('checking');

  const checkBT = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      setStatus('unavailable');
      return;
    }

    const bt = navigator.bluetooth as Bluetooth & {
      getAvailability?: () => Promise<boolean>;
    };

    if (typeof bt.getAvailability === 'function') {
      try {
        const available = await bt.getAvailability();
        if (available) {
          onPass();
          return;
        }
        setStatus('off');
        return;
      } catch {
        setStatus('off');
        return;
      }
    }

    // Fallback: API exists but no getAvailability (older Chrome)
    onPass();
  }, [onPass]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
        if (!cancelled) setStatus('unavailable');
        return;
      }

      const bt = navigator.bluetooth as Bluetooth & {
        getAvailability?: () => Promise<boolean>;
      };

      if (typeof bt.getAvailability === 'function') {
        try {
          const available = await bt.getAvailability();
          if (!cancelled) {
            if (available) {
              onPass();
            } else {
              setStatus('off');
            }
          }
          return;
        } catch {
          if (!cancelled) setStatus('off');
          return;
        }
      }

      // Fallback
      if (!cancelled) onPass();
    };

    run();

    // Listen for BT adapter state changes
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      const btNav = navigator.bluetooth as Bluetooth & {
        addEventListener?: (event: string, handler: () => void) => void;
        removeEventListener?: (event: string, handler: () => void) => void;
      };

      const handler = () => { run(); };
      if (btNav.addEventListener) {
        btNav.addEventListener('availabilitychanged', handler);
      }
      return () => {
        cancelled = true;
        if (btNav.removeEventListener) {
          btNav.removeEventListener('availabilitychanged', handler);
        }
      };
    }

    return () => { cancelled = true; };
  }, [onPass]);

  const handleEnable = async () => {
    try {
      await (navigator.bluetooth as Bluetooth & {
        requestDevice?: (opts: Record<string, unknown>) => Promise<unknown>;
      }).requestDevice?.({
        acceptAllDevices: true,
        optionalServices: [],
      });
      onPass();
    } catch {
      checkBT();
    }
  };

  if (status === 'checking') {
    return (
      <div className="grain-bt-gate">
        <div className="grain-bt-gate-content">
          <div className="grain-spinner" />
          <p style={{ color: 'var(--gm-text-secondary)', marginTop: 16 }}>
            {t('bt.gate.title', lang)}...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'unavailable') {
    return (
      <div className="grain-bt-gate">
        <div className="grain-bt-gate-content">
          <div
            className="grain-bt-icon-wrap"
            style={{ background: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            <WarningCircle size={36} weight="thin" style={{ color: '#EF4444' }} />
          </div>
          <h2 className="grain-bt-gate-title" style={{ color: '#EF4444' }}>
            {t('bt.gate.unsupported', lang)}
          </h2>
          <p className="grain-bt-gate-desc">{t('bt.gate.unsupported_desc', lang)}</p>
          <div className="flex flex-col gap-3 w-full mt-8">
            <button
              onClick={onPass}
              className="grain-bt-gate-btn grain-bt-gate-btn-secondary"
            >
              {t('bt.gate.continue', lang)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // status === 'off'
  return (
    <div className="grain-bt-gate">
      <div className="grain-bt-gate-content">
        <div className="grain-bt-icon-wrap">
          <Bluetooth size={40} weight="thin" style={{ color: 'var(--gm-accent)' }} />
        </div>
        <h2 className="grain-bt-gate-title" style={{ color: 'var(--gm-text-primary)' }}>
          {t('bt.gate.title', lang)}
        </h2>
        <p className="grain-bt-gate-desc">{t('bt.gate.desc', lang)}</p>
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
