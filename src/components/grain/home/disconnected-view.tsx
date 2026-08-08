'use client';

import { useGrainStore } from '@/lib/grain-store';
import { Bluetooth } from '@phosphor-icons/react/dist/ssr';

export function DisconnectedView() {
  const { connectProbe, simulateConnect } = useGrainStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] grain-fade-in">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 grain-card">
        <Bluetooth size={28} weight="bold" style={{ color: '#a1a1aa' }} />
      </div>
      <h2 className="text-lg font-bold mb-2 tracking-tight" style={{ color: '#f4f4f5' }}>
        No Device
      </h2>
      <p
        className="text-sm mb-8 text-center max-w-[220px] leading-relaxed"
        style={{ color: '#a1a1aa' }}
      >
        Connect your GRAIN-01 probe to begin monitoring moisture levels.
      </p>
      <button
        onClick={connectProbe}
        className="font-bold px-8 py-3.5 rounded-xl text-sm active:scale-95 transition-transform tracking-wide"
        style={{ background: '#e4e4e7', color: '#09090b' }}
      >
        CONNECT
      </button>
      <button
        onClick={() => simulateConnect()}
        className="mt-3 text-xs font-medium tracking-wide px-4 py-2 rounded-lg transition-colors"
        style={{ color: '#71717a' }}
      >
        Use Demo Mode
      </button>
    </div>
  );
}
