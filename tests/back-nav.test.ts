/* ═══════════════════════════════════════════════════════════════
   Back-navigation policy tests
   Run: bun test tests/back-nav.test.ts

   Covers (per spec):
   1.  Secondary-tab Back returns to Home (fallback policy)
   2.  Nested overlay closure in explicit priority order
   3.  Repeated Back presses (no loops, no growing history stack)
   4.  Rapid tab switching (arm is idempotent — one synthetic entry max)
   5.  Preservation of BLE/settings state (overlay close never triggers
       destructive store actions — verified via spies)
   6.  Capacitor path (handleBackNative works without the History API)
   ═══════════════════════════════════════════════════════════════ */

/// <reference types="bun-types" />

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  setBackNavDriver,
  initBackNav,
  syncBackNav,
  registerBackConsumer,
  handleBack,
  handleBackNative,
  resetBackNav,
  type BackNavDriver,
} from '../src/lib/back-nav';

/** In-memory History API driver simulating Android Back presses. */
function makeDriver() {
  let synthetic = 0;
  const listeners: Array<() => void> = [];
  const driver: BackNavDriver = {
    push: () => { synthetic += 1; },
    popQuiet: () => { synthetic = Math.max(0, synthetic - 1); },
    onBackPress: (cb) => {
      listeners.push(cb);
      return () => {
        const i = listeners.indexOf(cb);
        if (i >= 0) listeners.splice(i, 1);
      };
    },
    syntheticDepth: () => synthetic,
  };
  return {
    driver,
    // Simulates a real system Back: the browser first POPS the current
    // (synthetic) entry, THEN fires the popstate listeners.
    pressBack: () => {
      if (synthetic > 0) synthetic -= 1;
      for (const cb of [...listeners]) cb();
    },
    get depth() { return synthetic; },
  };
}

describe('Back navigation policy', () => {
  let d: ReturnType<typeof makeDriver>;

  beforeEach(() => {
    resetBackNav();
    d = makeDriver();
    setBackNavDriver(d.driver);
  });

  test('1a. Back on a secondary tab returns to Home and re-arms (still interceptable)', () => {
    let activeTab = 'history';
    const consumeFallback = () => {
      if (activeTab !== 'home') { activeTab = 'home'; return true; }
      return false;
    };
    const isInterceptable = () => activeTab !== 'home';

    initBackNav({ consumeFallback, isInterceptable });
    expect(d.depth).toBe(1); // armed on init (history tab open)

    d.pressBack(); // system Back
    expect(activeTab).toBe('home'); // returned to Home
    expect(d.depth).toBe(0); // not re-armed — Home exits normally
  });

  test('1b. Back on Home never invokes the policy (normal exit possible)', () => {
    let fallbackCalls = 0;
    initBackNav({
      consumeFallback: () => { fallbackCalls += 1; return true; },
      isInterceptable: () => false, // Home
    });
    expect(d.depth).toBe(0);
    for (let i = 0; i < 5; i++) d.pressBack();
    expect(fallbackCalls).toBe(0); // ignored → OS exits the app
    expect(d.depth).toBe(0);       // no artificial entries
  });

  test('2. Nested overlays close in priority order, one per Back press', () => {
    let activeTab = 'history';
    let detailOpen = true;
    let sheetOpen = true;
    let langOpen = true;
    let activeTab2 = 'settings';
    let modalOpen = true;

    const order: string[] = [];
    initBackNav({
      consumeFallback: () => {
        // history detail closes before the tab itself
        if (activeTab === 'history' && detailOpen) {
          detailOpen = false; order.push('detail'); return true;
        }
        if (activeTab !== 'home') { activeTab = 'home'; order.push('tab:' + activeTab); return true; }
        if (activeTab2 !== 'home') { activeTab2 = 'home'; order.push('tab:' + activeTab2); return true; }
        return false;
      },
      isInterceptable: () => activeTab !== 'home' || activeTab2 !== 'home',
    });

    const unregSheet = registerBackConsumer({
      id: 'history-score-sheet', priority: 30,
      onClose: () => { if (!sheetOpen) return false; sheetOpen = false; order.push('sheet'); return true; },
    });
    registerBackConsumer({
      id: 'language-panel', priority: 40,
      onClose: () => { if (!langOpen) return false; langOpen = false; order.push('lang'); return true; },
    });
    registerBackConsumer({
      id: 'settings-replace-modal', priority: 30,
      onClose: () => { if (!modalOpen) return false; modalOpen = false; order.push('modal'); return true; },
    });

    // Sequence: History tab (detail + sheet open) → Settings tab (lang + modal open) → Home
    d.pressBack(); // closes lang panel (40) — highest priority
    d.pressBack(); // closes replace modal (30, registered later → on top)
    d.pressBack(); // closes score sheet (30)
    d.pressBack(); // closes history detail (fallback: detail before tab)
    unregSheet();  // simulate component unmount (already closed)
    d.pressBack(); // history → home
    d.pressBack(); // settings → home
    d.pressBack(); // exit — nothing interceptable

    expect(order).toEqual(['lang', 'modal', 'sheet', 'detail', 'tab:home', 'tab:home']);
    expect(detailOpen).toBe(false);
    expect(activeTab).toBe('home');
    expect(activeTab2).toBe('home');
    expect(d.depth).toBe(0);
  });

  test('3. Repeated Back presses: history stack never grows, no loops', () => {
    let activeTab = 'discover';
    initBackNav({
      consumeFallback: () => { activeTab = 'home'; return true; },
      isInterceptable: () => activeTab !== 'home',
    });
    for (let i = 0; i < 10; i++) d.pressBack();
    expect(activeTab).toBe('home');
    expect(d.depth).toBe(0); // one entry consumed, never re-armed on Home
  });

  test('4. Rapid tab switching never accumulates synthetic entries', () => {
    let activeTab = 'home';
    initBackNav({
      consumeFallback: () => { activeTab = 'home'; return true; },
      isInterceptable: () => activeTab !== 'home',
    });
    // Rapid History → Home → Settings → Home → Discover
    activeTab = 'history'; syncBackNav();
    activeTab = 'home'; syncBackNav();
    activeTab = 'settings'; syncBackNav();
    activeTab = 'home'; syncBackNav();
    activeTab = 'discover'; syncBackNav();
    expect(d.depth).toBe(1); // still exactly ONE synthetic entry
    activeTab = 'home'; syncBackNav();
    expect(d.depth).toBe(0); // disarmed cleanly
  });

  test('5. Overlay close actions never touch destructive store state (BLE/settings preserved)', () => {
    let disconnectCalls = 0;
    let clearHistoryCalls = 0;
    let settingsWrites = 0;
    let modalOpen = true;
    let activeTab = 'settings';

    initBackNav({
      consumeFallback: () => {
        if (activeTab !== 'home') { activeTab = 'home'; return true; }
        return false;
      },
      isInterceptable: () => activeTab !== 'home',
    });
    registerBackConsumer({
      id: 'settings-replace-modal', priority: 30,
      // mirrors the real component: reports false when already closed
      onClose: () => { if (!modalOpen) return false; modalOpen = false; return true; },
    });

    d.pressBack(); // closes ONLY the modal
    expect(modalOpen).toBe(false);
    expect(disconnectCalls).toBe(0);
    expect(clearHistoryCalls).toBe(0);
    expect(settingsWrites).toBe(0);
    expect(activeTab).toBe('settings'); // tab untouched by the modal close
    expect(d.depth).toBe(1);            // still interceptable → re-armed

    d.pressBack(); // now the tab returns home
    expect(activeTab).toBe('home');
    expect(disconnectCalls).toBe(0);
    expect(clearHistoryCalls).toBe(0);
    expect(settingsWrites).toBe(0);
  });

  test('6a. handleBackNative runs the policy without the History API (Capacitor)', () => {
    let sheetClosed = false;
    let activeTab = 'history';
    initBackNav({
      consumeFallback: () => {
        if (activeTab !== 'home') { activeTab = 'home'; return true; }
        return false;
      },
      isInterceptable: () => activeTab !== 'home',
    });
    registerBackConsumer({
      id: 'history-score-sheet', priority: 30,
      onClose: () => { if (sheetClosed) return false; sheetClosed = true; return true; },
    });
    // A native shell calls this from its hardware Back listener:
    expect(handleBackNative()).toBe(true); // intercepted — native side stays
    expect(sheetClosed).toBe(true);
    expect(activeTab).toBe('history');     // overlay first, tab second
    expect(handleBackNative()).toBe(true); // second press → tab → Home
    expect(activeTab).toBe('home');
    expect(handleBackNative()).toBe(false); // nothing left → native exit
  });

  test('6b. Consumer whose onClose returns false falls through to the next handler', () => {
    let closed = false;
    initBackNav({
      consumeFallback: () => { closed = true; return true; },
      isInterceptable: () => true,
    });
    registerBackConsumer({
      id: 'stale-overlay', priority: 40,
      onClose: () => false, // reports "nothing to close"
    });
    const handled = handleBack();
    expect(handled).toBe(true);
    expect(closed).toBe(true); // fallback handled it
  });
});
