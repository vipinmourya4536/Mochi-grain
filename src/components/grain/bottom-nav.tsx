'use client';

import { useGrainStore, type TabId } from '@/lib/grain-store';
import {
  House,
  Compass,
  ClockCounterClockwise,
  Gear,
} from '@phosphor-icons/react/dist/ssr';

const TABS: { id: TabId; icon: typeof House; label: string }[] = [
  { id: 'home', icon: House, label: 'Home' },
  { id: 'discover', icon: Compass, label: 'Discover' },
  { id: 'history', icon: ClockCounterClockwise, label: 'History' },
  { id: 'settings', icon: Gear, label: 'Settings' },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useGrainStore();

  return (
    <nav className="grain-glass-nav shrink-0 px-6 pb-8 pt-3">
      <div className="flex justify-around items-center">
        {TABS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`grain-nav-btn ${isActive ? 'active' : ''}`}
              aria-label={label}
            >
              <Icon size={24} weight={isActive ? 'fill' : 'bold'} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
