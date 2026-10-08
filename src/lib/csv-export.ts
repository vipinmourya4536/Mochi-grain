/* ═══════════════════════════════════════════════════════════════
   CSV export — shared client-side builder + delivery
   ─────────────────────────────────────────────────────────────
   Both export entry points (History header button, Settings →
   Data row) build their CSV HERE, on the client, because the
   readings live in the browser's IndexedDB — a server route can
   never read them (the old /api/export always failed with 500).
   • RFC-4180 cell escaping (quotes / commas / newlines) — the
     decision message + action columns are localized prose and
     DO contain commas.
   • Optional decision columns behind settings.exportDecisions.
   • Delivery: Web Share with a File when the platform supports
     it (mobile PWA share sheet), otherwise a blob download.
   ═══════════════════════════════════════════════════════════════ */

import type { HistoryEntry } from './grain-types';
import { t, type AppLanguage } from './i18n';
import { format } from 'date-fns';

/** RFC-4180: quote a cell when it contains a quote, comma or newline */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build the chronological readings CSV.
 *  @param entries          newest-first store list (sorted internally)
 *  @param lang             active language — decision columns localize
 *  @param includeDecisions add `decision_message` + `decision_action` columns */
export function buildReadingsCsv(
  entries: HistoryEntry[],
  lang: AppLanguage,
  includeDecisions: boolean,
): string {
  const baseCols = [
    'timestamp', 'datetime', 'grain', 'moisture_pct', 'temperature_c',
    'battery_pct', 'signal_pct', 'state', 'trend',
  ];
  const header = (includeDecisions ? [...baseCols, 'decision_message', 'decision_action'] : baseCols).join(',');

  const rows = [...entries]
    .sort((a, b) => a.reading.timestamp - b.reading.timestamp)
    .map((e) => {
      const cells: (string | number)[] = [
        new Date(e.reading.timestamp).toISOString(),
        format(e.reading.timestamp, 'yyyy-MM-dd HH:mm:ss'),
        e.reading.grainType,
        e.reading.moisture.toFixed(2),
        e.reading.temperature.toFixed(1),
        Math.round(e.reading.battery),
        Math.round(e.reading.signal),
        e.decision.state,
        e.decision.trend,
      ];
      if (includeDecisions) {
        // Same message resolution as the detail view: engine i18n key
        // first, stored English fallback second.
        cells.push(
          e.decision.messageKey ? t(e.decision.messageKey, lang) : e.decision.message,
          e.decision.actionKey ? t(e.decision.actionKey, lang) : e.decision.action,
        );
      }
      return cells.map(csvCell).join(',');
    });

  return `${header}\n${rows.join('\n')}\n`;
}

/** Classic blob download (desktop / share-fallback path) */
export function downloadCsvFile(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

export type CsvDelivery = 'shared' | 'downloaded' | 'cancelled';

/** Hand the CSV to the user. Web Share with a File when the platform
 *  supports it, otherwise a download. User-dismissed share sheets are
 *  reported as 'cancelled' (no success toast). */
export async function deliverCsv(csv: string, filename: string): Promise<CsvDelivery> {
  // Cast mirrors shareReading() in history-tab: Web Share file members
  // are absent from the TS DOM lib, so we model the optional members.
  const navExt = (typeof navigator !== 'undefined' ? navigator : undefined) as
    | (Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data?: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      })
    | undefined;

  let sharePayload: { files: File[]; title: string; text: string } | null = null;
  try {
    if (navExt?.share && navExt?.canShare) {
      const file = new File([csv], filename, { type: 'text/csv' });
      if (navExt.canShare({ files: [file] })) {
        sharePayload = { files: [file], title: 'Grain Monitor', text: filename };
      }
    }
  } catch { /* canShare can throw on odd inputs — fall through to download */ }

  if (sharePayload && navExt?.share) {
    try {
      await navExt.share(sharePayload);
      return 'shared';
    } catch (err) {
      // AbortError = the user dismissed the share sheet — not a failure
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      downloadCsvFile(csv, filename);
      return 'downloaded';
    }
  }

  downloadCsvFile(csv, filename);
  return 'downloaded';
}
