/* ─── Accent color hex values for inline styles ─── */
import type { AccentColor } from './grain-types';

const ACCENT_HEX: Record<AccentColor, string> = {
  orange: '#F97316',
  green: '#22C55E',
  purple: '#A855F7',
  blue: '#3B82F6',
  teal: '#14B8A6',
};

export function getAccentHex(accent: AccentColor): string {
  return ACCENT_HEX[accent] || '#F97316';
}

/** Returns hex for risk state color. Always a real hex, never a CSS variable. */
export function getRiskColor(state: string, accent: AccentColor): string {
  switch (state) {
    case 'critical': return '#EF4444';
    case 'warn': return '#F59E0B';
    default: return getAccentHex(accent);
  }
}

/** Returns rgba string for risk state color with given opacity. */
export function getRiskBg(state: string, accent: AccentColor, opacity: number): string {
  const hex = getRiskColor(state, accent);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
