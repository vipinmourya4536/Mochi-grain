/* ═══════════════════════════════════════════════════════════════
   Back-navigation policy (Android Back / PWA popstate)

   Design
   ──────
   One synthetic History entry is kept "armed" whenever the app is in an
   interceptable state (a secondary tab is open, or any overlay sits above
   the tab). Pressing system Back pops that entry → popstate fires → the
   TOPMOST back consumer runs (highest priority first). If the app is still
   interceptable afterwards, ONE fresh synthetic entry is pushed — the
   history stack never grows (each press consumes one and pushes at most
   one). On Home with no overlays nothing is armed, so Back exits the app
   normally, exactly like a native app.

   Overlay priority (higher closes first):
     40  language selector panel          (Settings tab)
     30  replace-data confirm modal       (Settings tab, portal)
     30  storage-score explainer sheet    (History tab, portal)
     20  history detail view              (store-level, in-tab)
     10  secondary tab → Home             (store-level fallback)
      0  nothing interceptable → let the browser/OS exit

   Capacitor reuse
   ───────────────
   The policy is driver-based. A native shell registers its hardware Back
   listener and calls `handleBack()` directly (bypassing the synthetic
   entry machinery via `handleBackNative()`), so the same priority rules
   apply without the History API. `registerBackConsumer` / `handleBack`
   are the only APIs a Capacitor listener needs.
   ═══════════════════════════════════════════════════════════════ */

/** A closeable surface that participates in Back handling.
 *  `onClose` returns true when it actually closed something; it must close
 *  ONLY its own surface — never the parent tab's state. */
export type BackConsumer = {
  id: string;
  priority: number;
  onClose: () => boolean;
};

export interface BackNavDriver {
  /** Push one synthetic entry so the next Back press pops instead of exiting. */
  push: () => void;
  /** Pop the synthetic entry without triggering the back policy (disarm path). */
  popQuiet: () => void;
  /** Subscribe to Back presses (popstate on web). Returns unsubscribe. */
  onBackPress: (cb: () => void) => () => void;
  /** Current number of synthetic entries beyond the base entry (tests/diagnostics). */
  syntheticDepth: () => number;
}

/* ── Default web driver: History API + popstate ── */

const webDriver: BackNavDriver = {
  push: () => {
    try {
      window.history.pushState({ grainBack: true }, '');
    } catch {
      /* history unavailable (rare embeds) — Back simply exits */
    }
  },
  popQuiet: () => {
    try {
      window.history.back();
    } catch {
      /* ignore */
    }
  },
  onBackPress: (cb) => {
    window.addEventListener('popstate', cb);
    return () => window.removeEventListener('popstate', cb);
  },
  syntheticDepth: () => {
    // Not precisely measurable on the web platform; maintained by the
    // module for tests/diagnostics via the armed flag.
    return isArmed() ? 1 : 0;
  },
};

/* ── Module state ── */

let driver: BackNavDriver = webDriver;
let armed = false;
let inited = false;
let unsubscribePop: (() => void) | null = null;

/** Highest priority first; ties keep registration order (latest wins). */
const consumers = new Map<string, BackConsumer>();

/* Fallback policy supplied by the app (store-aware): closes the history
 * detail view, then returns from a secondary tab to Home. */
let fallback: (() => boolean) | null = null;
let interceptable: (() => boolean) | null = null;

function isArmed(): boolean {
  return armed;
}

function arm(): void {
  if (armed) return;
  armed = true;
  driver.push();
}

/** Pop the synthetic entry without triggering the back policy.
 *  `armed` is cleared FIRST so the resulting popstate is ignored. */
function disarm(): void {
  if (!armed) return;
  armed = false;
  driver.popQuiet();
}

/* ── Public API ── */

/** Replace the driver (tests, Capacitor). Must be called before init. */
export function setBackNavDriver(d: BackNavDriver): void {
  if (inited) throw new Error('setBackNavDriver must be called before initBackNav');
  driver = d;
}

/** Register an overlay close handler. Returns an unregister function. */
export function registerBackConsumer(consumer: BackConsumer): () => void {
  consumers.set(consumer.id, consumer);
  return () => {
    if (consumers.get(consumer.id) === consumer) consumers.delete(consumer.id);
  };
}

/** Test/diagnostic view of the active consumers (highest priority first). */
export function backConsumersForTest(): BackConsumer[] {
  return [...consumers.values()].sort((a, b) => b.priority - a.priority);
}

/**
 * Run the back policy once: topmost consumer → fallback → not handled.
 * Returns true when a surface/tab consumed the press.
 * Does NOT manage the synthetic entry (that is popstate/arm logic).
 *
 * Priority: highest `priority` first; on ties the LATER-registered consumer
 * wins (it renders visually on top). A consumer whose onClose reports
 * false (already closed / nothing to do) is skipped, never retried.
 */
export function handleBack(): boolean {
  const called = new Set<string>();
  for (;;) {
    let top: BackConsumer | null = null;
    for (const c of consumers.values()) {
      if (called.has(c.id)) continue;
      // ">=" keeps the later-registered consumer on equal priority
      if (!top || c.priority >= top.priority) top = c;
    }
    if (!top) break;
    called.add(top.id);
    let handled = false;
    try {
      handled = top.onClose();
    } catch {
      handled = false;
    }
    if (handled) return true;
  }
  // 2. Store-level fallback: history detail view, then secondary tab → Home
  if (fallback && fallback()) return true;
  return false;
}

/**
 * Native-shell entry point (Capacitor): runs the policy and reports whether
 * the app intercepted the press. When false, the native side should perform
 * its default action (minimize/close).
 */
export function handleBackNative(): boolean {
  return handleBack();
}

/** Wire the popstate loop + initial arming. Safe to call once per app root. */
export function initBackNav(opts: {
  /** Store-level fallback (detail view → secondary tab → Home). */
  consumeFallback: () => boolean;
  /** Whether the app currently wants Back interception (depth > 0). */
  isInterceptable: () => boolean;
}): () => void {
  fallback = opts.consumeFallback;
  interceptable = opts.isInterceptable;

  if (!inited) {
    inited = true;
    unsubscribePop = driver.onBackPress(() => {
      if (!armed) return; // not our synthetic entry (real navigation / exit)
      armed = false;
      const handled = handleBack();
      // Re-arm only while still interceptable. Stack length stays constant:
      // one entry was consumed; at most one is pushed back.
      if (handled && interceptable && interceptable()) {
        arm();
      }
    });
  }

  // Initial arm/disarm for the state at mount time.
  syncBackNav();

  return () => {
    if (unsubscribePop) {
      unsubscribePop();
      unsubscribePop = null;
    }
    inited = false;
    armed = false;
  };
}

/** Re-evaluate arming after app state changes (tab switches, store resets).
 *  Cheap: pushes only when transitioning unarmed→interceptable, so rapid
 *  tab switching never accumulates entries. */
export function syncBackNav(): void {
  if (!inited) return;
  const want = interceptable ? interceptable() : false;
  if (want) {
    arm();
  } else {
    disarm();
  }
}

/** Clear everything (tests). */
export function resetBackNav(): void {
  consumers.clear();
  fallback = null;
  interceptable = null;
  armed = false;
  inited = false;
  if (unsubscribePop) {
    unsubscribePop();
    unsubscribePop = null;
  }
}
