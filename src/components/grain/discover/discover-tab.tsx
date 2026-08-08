'use client';

import { useGrainStore } from '@/lib/grain-store';
import { getDiscoverContent } from '@/lib/discover-content';
import { YouTubeLogo, ArrowSquareOut } from '@phosphor-icons/react/dist/ssr';

export function DiscoverTab() {
  const { decision, settings, deviceInfo, deviceState } = useGrainStore();

  const grainType = settings.grainType;
  const condition = decision?.state || 'safe';
  const videos = getDiscoverContent(grainType, condition);

  const isConnected = deviceState !== 'disconnected' && deviceState !== 'connecting';

  return (
    <div className="pt-2 pb-6 grain-fade-in">
      <h2 className="text-2xl font-bold tracking-tight mb-1" style={{ color: '#f4f4f5' }}>
        Discover
      </h2>
      <p className="text-sm mb-5" style={{ color: '#a1a1aa' }}>
        {isConnected
          ? `Content for ${grainType} · ${condition === 'safe' ? 'Normal' : condition === 'warn' ? 'Elevated' : 'Critical'} condition`
          : 'Connect a probe for personalised recommendations'}
      </p>

      {isConnected && (
        <div className="grain-insight-card mb-5">
          <p className="text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
            {condition === 'critical'
              ? 'Your current readings are critical. These resources focus on emergency response and damage prevention.'
              : condition === 'warn'
                ? 'Readings are elevated. These resources help you understand and respond to changing conditions.'
                : 'Conditions are stable. Use this time to learn and prepare for seasonal changes.'}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grain-discover-card block"
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold tracking-tight mb-1" style={{ color: '#f4f4f5' }}>
                    {video.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <YouTubeLogo size={14} weight="fill" style={{ color: '#EF4444' }} />
                    <span className="text-[11px]" style={{ color: '#71717a' }}>
                      {video.source}
                    </span>
                  </div>
                </div>
                <ArrowSquareOut size={18} weight="bold" style={{ color: '#71717a', flexShrink: 0 }} />
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: '#a1a1aa' }}>
                {video.why}
              </p>
            </div>
          </a>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 grain-card">
            <YouTubeLogo size={24} weight="bold" style={{ color: '#71717a' }} />
          </div>
          <p className="text-sm" style={{ color: '#a1a1aa' }}>
            No recommendations available for this combination yet.
          </p>
        </div>
      )}
    </div>
  );
}
