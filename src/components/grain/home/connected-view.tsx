'use client';

import { HeroCard } from './hero-card';
import { MetricPills } from './metric-pills';
import { InsightCard } from './insight-card';
import { RecentReadings } from './recent-readings';
import { useGrainStore } from '@/lib/grain-store';

export function ConnectedView() {
  const { currentReading, deviceState } = useGrainStore();

  if (!currentReading) return null;

  return (
    <div className="flex flex-col gap-4 grain-fade-in">
      <HeroCard />
      <MetricPills />
      <InsightCard />
      <RecentReadings />
    </div>
  );
}
