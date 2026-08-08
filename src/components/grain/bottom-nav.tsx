'use client';

import { useGrainStore, type TabId } from '@/lib/grain-store';
import {
  House,
  Compass,
  ClockCounterClockwise,
  Gear,
} from '@phosphor-icons/react/dist/ssr';
import { t } from '@/lib/i18n';

const TABS: { id: TabId; icon: typeof House; labelKey: string }[] = [
  { id: 'home', icon: House, labelKey: 'nav.home' },
  { id: 'discover', icon: Compass, labelKey: 'nav.discover' },
  { id: 'history', icon: ClockCounterClockwise, labelKey: 'nav.history' },
  { id: 'settings', icon: Gear, labelKey: 'nav.settings' },
];

export function BottomNav() {
  const { activeTab, setActiveTab, settings } = useGrainStore();
  const lang = settings.language as 'en' | 'hi' | 'mr' | 'hinglish';

  return (
    <nav className="grain-floating-nav shrink-0">
      <div className="grain-floating-nav-inner">
        {TABS.map(({ id, icon: Icon, labelKey }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`grain-nav-btn ${isActive ? 'active' : ''}`}
              aria-label={t(labelKey, lang)}
            >
              <Icon size={22} weight={isActive ? 'fill' : 'bold'} />
              <span className="mt-0.5">{t(labelKey, lang)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
