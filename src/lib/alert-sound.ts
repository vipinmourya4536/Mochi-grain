/* ═══════════════════════════════════════════════════════════════
   Alert sounds – soft Web Audio chimes for storage-risk escalations
   ═══════════════════════════════════════════════════════════════
   Fired on Mochi state TRANSITIONS (same discipline as haptics):
   • warn     → two gentle rising notes
   • critical → urgent three-note descend–repeat
   The AudioContext is created lazily on the first user gesture so
   autoplay policies never block the chime when a real alert fires.
   ═══════════════════════════════════════════════════════════════ */

let ctx: AudioContext | null = null;

/** Prime the audio context during a user gesture (called once on first pointerdown/keydown) */
export function primeAlertSound(): void {
  if (typeof window === 'undefined') return;
  if (!ctx) {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    } catch {
      ctx = null;
      return;
    }
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {/* stay silent */});
  }
}

function tone(freq: number, startOffset: number, duration: number, gainPeak: number): void {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;

  const t0 = ctx.currentTime + startOffset;
  // Soft attack + exponential-ish release so the chime never clicks
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainPeak, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function play(enabled: boolean, notes: { f: number; at: number; d: number }[], gainPeak: number): void {
  if (!enabled) return;
  if (typeof window === 'undefined') return;
  try {
    if (!ctx) primeAlertSound();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      // No user gesture yet — browsers block audio; skip silently.
      ctx.resume().catch(() => {});
      if (ctx.state === 'suspended') return;
    }
    for (const n of notes) tone(n.f, n.at, n.d, gainPeak);
  } catch {
    /* audio unavailable – silently ignore */
  }
}

/** Warning escalation: two gentle rising notes */
export function playWarnAlert(enabled: boolean): void {
  play(enabled, [
    { f: 523.25, at: 0, d: 0.14 },      // C5
    { f: 659.25, at: 0.16, d: 0.18 },   // E5
  ], 0.06);
}

/** Critical escalation: urgent triple chime (low-high-low) */
export function playCriticalAlert(enabled: boolean): void {
  play(enabled, [
    { f: 587.33, at: 0, d: 0.12 },      // D5
    { f: 880, at: 0.14, d: 0.14 },      // A5
    { f: 587.33, at: 0.32, d: 0.2 },    // D5
    { f: 440, at: 0.5, d: 0.26 },       // A4 (settle, tension)
  ], 0.07);
}

/** Success/settle cue when returning to safe — single soft note */
export function playSafeAlert(enabled: boolean): void {
  play(enabled, [
    { f: 659.25, at: 0, d: 0.16 },      // E5
  ], 0.045);
}
