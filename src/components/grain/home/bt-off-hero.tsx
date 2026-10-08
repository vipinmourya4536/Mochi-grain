'use client';

import { useCallback } from 'react';
import { useGrainStore } from '@/lib/grain-store';
import { BluetoothSlash, ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';

/**
 * Shown in the hero-card area when Bluetooth is off.
 * Replaces the moisture chart/sparkline with a BT enable prompt.
 */
export function BtOffHero() {
  const { settings, setBtAvailable } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  const checkBT = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
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
      setBtAvailable(true);
    }
  }, [setBtAvailable]);

  const handleEnable = async () => {
    try {
      await (navigator.bluetooth as Bluetooth & {
        requestDevice?: (opts: Record<string, unknown>) => Promise<unknown>;
      }).requestDevice?.({
        acceptAllDevices: true,
        optionalServices: [],
      });
      setBtAvailable(true);
    } catch {
      checkBT();
    }
  };

  return (
    <div className="grain-fade-in flex flex-col gap-4">
      {/* Hero card placeholder */}
      <div
        className="grain-hero-card relative z-10 flex flex-col items-center justify-center text-center py-8 px-6"
        style={{ minHeight: 200 }}
      >
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <BluetoothSlash size={28} weight="thin" className="text-white/70" />
          </div>
          <h2 className="text-lg font-bold mb-1.5 tracking-tight text-white">
            {t('bt.home_prompt', lang)}
          </h2>
          <p className="text-xs text-white/50 mb-6 max-w-[220px] leading-relaxed">
            {t('bt.home_prompt_desc', lang)}
          </p>
          <button
            onClick={handleEnable}
            className="font-bold px-8 py-3 rounded-xl text-sm active:scale-95 transition-transform tracking-wide flex items-center gap-2"
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(8px)' }}
          >
            {t('bt.gate.enable', lang)}
            <ArrowRight size={16} weight="bold" />
          </button>
          <button
            onClick={checkBT}
            className="mt-3 text-xs font-medium tracking-wide px-4 py-2 rounded-lg transition-colors text-white/40 hover:text-white/60"
          >
            {t('bt.gate.check', lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
