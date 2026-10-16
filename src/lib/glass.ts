/* ═══════════════════════════════════════════════════════════════
   LIQUID GLASS SYSTEM — single source of truth
   ─────────────────────────────────────────────────────────────
   Derives every glass CSS variable from (theme, glassOpacity).
   page.tsx applies the returned object as inline style on
   .grain-app; globals.css consumes the --gm-* tokens.

   Design contract:
   • glassOpacity 0.30 → subtle frosting, low reflection
   • glassOpacity 1.00 → pronounced frosting, visible specular
     highlights and depth — still legible (text is never blurred;
     only translucent surfaces are).
   • Blur radius, translucency, saturation, highlight/border alpha,
     specular gradients and shadows all move COHESIVELY with the
     single preference.
   • System chrome (theme-color / status bar) is deliberately NOT
     part of this module — it is theme-driven, never accent-driven
     (see page.tsx computeThemeColor).
   ═══════════════════════════════════════════════════════════════ */

export const GLASS_MIN = 0.3;
export const GLASS_MAX = 1.0;
export const GLASS_DEFAULT = 0.75;

export function clampGlass(value: number): number {
  if (!Number.isFinite(value)) return GLASS_DEFAULT;
  return Math.min(GLASS_MAX, Math.max(GLASS_MIN, value));
}

/** Linear interpolation helper */
const lerp = (a: number, b: number, g: number) => a + (b - a) * g;
/** Map g∈[0..1] to a 2-decimal string */
const f2 = (n: number) => n.toFixed(2);
const f3 = (n: number) => n.toFixed(3);

/**
 * Compute the full glass token set for the current theme + intensity.
 * Returns a style object consumed by <div className="grain-app" style={…}>.
 */
export function computeGlassVars(isDark: boolean, glassOpacity: number): React.CSSProperties {
  const g = (clampGlass(glassOpacity) - GLASS_MIN) / (GLASS_MAX - GLASS_MIN); // normalized 0..1

  /* ── Background RGB (theme neutrals — never accent-tinted) ── */
  const bgR = isDark ? 9 : 245;
  const bgG = isDark ? 9 : 245;
  const bgB = isDark ? 11 : 247;

  /* ── Translucency ──
     Dark glass reads deeper; light glass needs more opacity for contrast. */
  const surfaceAlpha = isDark ? lerp(0.34, 0.86, g) : lerp(0.46, 0.88, g);
  const shellAlpha = isDark ? lerp(0.55, 0.94, g) : lerp(0.6, 0.95, g);
  const toastAlpha = isDark ? lerp(0.72, 0.98, g) : lerp(0.78, 0.98, g);

  /* ── Blur + saturation (diffusion strength) ── */
  const blurHeader = lerp(12, 40, g);
  const satHeader = lerp(1.1, 1.7, g);
  const blurCard = lerp(8, 30, g);
  const satCard = lerp(1.05, 1.55, g);
  const blurNav = lerp(16, 38, g);
  const satNav = lerp(1.2, 1.8, g);
  const blurInsight = lerp(6, 20, g);
  const blurToast = lerp(10, 24, g);
  const blurBadge = lerp(4, 15, g);
  const blurLang = lerp(14, 34, g);
  const satLang = lerp(1.2, 1.8, g);

  /* ── Inner highlights + reflective edge lines (glass thickness) ── */
  const hlAlpha = isDark ? lerp(0.03, 0.1, g) : lerp(0.42, 0.75, g);
  const hlStrongAlpha = isDark ? lerp(0.18, 0.42, g) : lerp(0.62, 0.92, g);
  const hlSoftAlpha = isDark ? lerp(0.06, 0.16, g) : lerp(0.3, 0.55, g);
  const borderAlpha = isDark ? lerp(0.05, 0.13, g) : lerp(0.06, 0.13, g);

  /* ── Specular reflection gradient (suggests glass thickness) ── */
  const specTop = isDark ? lerp(0.05, 0.13, g) : lerp(0.4, 0.72, g);
  const specBottom = isDark ? lerp(0.015, 0.055, g) : lerp(0.12, 0.3, g);
  const cardHighlight = `linear-gradient(135deg, rgba(255,255,255,${f3(specTop)}) 0%, rgba(255,255,255,${f3(specTop * 0.25)}) 22%, transparent 45%, transparent 72%, rgba(255,255,255,${f3(specBottom)}) 100%)`;

  /* ── Depth shadows (restrained; scale with intensity) ── */
  const cardSh = isDark ? lerp(0.06, 0.16, g) : lerp(0.04, 0.1, g);
  const navSh = isDark ? lerp(0.18, 0.32, g) : lerp(0.08, 0.16, g);
  const insightShadowAlpha = f3(lerp(0.04, 0.14, g));

  /* ── Frost tuning for the fixed shell (header fade + nav) ── */
  const headerFrostStrength = f2(shellAlpha);
  const headerFrostFade = f2(lerp(0.5, 0.66, g));
  const navFrostTop = f2(lerp(0.62, 0.92, g));
  /* Accent light-bleed under the nav — deliberately small and confined to
     the bottom nav only; the header stays strictly monochrome. */
  const navGlow = f2(lerp(0.07, 0.16, g));

  return {
    '--gm-glass-opacity': f2(clampGlass(glassOpacity)),
    '--gm-glass-bg': `rgba(${bgR}, ${bgG}, ${bgB}, ${f2(shellAlpha)})`,
    '--gm-surface': isDark
      ? `rgba(24, 24, 27, ${f3(surfaceAlpha)})`
      : `rgba(255, 255, 255, ${f3(surfaceAlpha)})`,
    '--gm-toast-bg': isDark
      ? `rgba(39, 39, 42, ${f2(toastAlpha)})`
      : `rgba(255, 255, 255, ${f2(toastAlpha)})`,

    '--gm-glass-border': isDark
      ? `rgba(255, 255, 255, ${f3(borderAlpha)})`
      : `rgba(0, 0, 0, ${f3(borderAlpha)})`,
    '--gm-glass-highlight': isDark
      ? `rgba(255, 255, 255, ${f3(hlAlpha)})`
      : `rgba(255, 255, 255, ${f3(hlAlpha)})`,
    '--gm-glass-highlight-strong': `rgba(255, 255, 255, ${f2(hlStrongAlpha)})`,
    '--gm-glass-highlight-soft': `rgba(255, 255, 255, ${f2(hlSoftAlpha)})`,
    '--gm-card-highlight': cardHighlight,

    '--gm-blur-header': `${f2(blurHeader)}px`,
    '--gm-saturate-header': f2(satHeader),
    '--gm-blur-card': `${f2(blurCard)}px`,
    '--gm-saturate-card': f2(satCard),
    '--gm-blur-nav': `${f2(blurNav)}px`,
    '--gm-saturate-nav': f2(satNav),
    '--gm-blur-insight': `${f2(blurInsight)}px`,
    '--gm-insight-shadow-alpha': insightShadowAlpha,
    '--gm-blur-toast': `${f2(blurToast)}px`,
    '--gm-blur-badge': `${f2(blurBadge)}px`,
    '--gm-blur-lang': `${f2(blurLang)}px`,
    '--gm-saturate-lang': f2(satLang),

    '--gm-header-frost-strength': headerFrostStrength,
    '--gm-header-frost-fade': headerFrostFade,
    '--gm-nav-frost-top': navFrostTop,
    '--gm-nav-glow': navGlow,

    '--gm-card-shadow': `0 1px 2px rgba(0,0,0,${f3(cardSh * 0.5)}), 0 4px 14px rgba(0,0,0,${f3(cardSh)}), inset 0 1px 0 var(--gm-glass-highlight), inset 0 0 0 0.5px rgba(255,255,255,${isDark ? f3(lerp(0.01, 0.035, g)) : f3(lerp(0.3, 0.5, g))})`,
    '--gm-nav-shadow': `0 8px 32px rgba(0,0,0,${f2(navSh)}), 0 2px 8px rgba(0,0,0,${f2(navSh * 0.55)}), inset 0 1px 0 var(--gm-glass-highlight), inset 0 -0.5px 0 rgba(255,255,255,${isDark ? f3(lerp(0.02, 0.05, g)) : f3(0.35)})`,
  } as React.CSSProperties;
}
