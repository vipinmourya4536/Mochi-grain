/* ═══════════════════════════════════════════════════════════════
   Haptic feedback – subtle tactile taps for a precision instrument
   ═══════════════════════════════════════════════════════════════ */

/**
 * Fire a short vibration pattern if the platform supports it and the
 * user has haptics enabled in Settings → Preferences.
 * Patterns are intentionally tiny (6–20ms) – felt, not noticed.
 */
export function haptic(enabled: boolean, pattern: number | number[] = 8): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* vibration unsupported or blocked – silently ignore */
  }
}

/** Standard interaction taps */
export const HAPTIC_TAP = 8;              // nav switch, small selections
export const HAPTIC_SELECT = 6;           // grain / option selection
export const HAPTIC_TOGGLE = 10;          // toggles, destructive confirms
export const HAPTIC_ALERT: number[] = [12, 70, 12]; // warning escalation
export const HAPTIC_CRITICAL: number[] = [16, 60, 16, 60, 24]; // critical escalation
