# Mochi Grain — Worklog

---
Task ID: 1
Agent: Main Agent (Z.ai Code)
Task: Clone https://github.com/vipinmourya4536/Mochi-grain.git into the workspace and apply the full refinement spec (grain source-of-truth fix, header/nav frosted-glass redesign, "other" grain removal, motion polish).

Work Log:
- Cloned Mochi-grain repo to /home/z/mochi-grain-repo and copied src/ + public/ into /home/z/my-project (Next.js 16 + React 19 + TS PWA).
- Installed missing deps: `idb@8`, `@phosphor-icons/react@2`, plus dev-dep `@types/web-bluetooth` (fixes pre-existing Web Bluetooth TS errors properly instead of suppressing them).
- GRAIN SOURCE OF TRUTH (grain-store.ts):
  - `selectGrainType()` now: validates grain, updates settings.grainType + thresholds from GRAIN_PROFILES, persists to IndexedDB, immediately normalizes currentReading.grainType, immediately re-evaluates Mochi (evaluate + statusBadge + riskTheme) with new thresholds, updates deviceInfo.grainType. Does NOT wait for BLE, reset connection, clear reading, or create history entries.
  - `handleReading()` normalizes every incoming BLE reading to `settings.grainType` before it enters IndexedDB / Mochi / Home / history. Firmware grain code kept only as optional `deviceGrain` diagnostic metadata (Reading type extended).
  - `handleReading` added to store interface (was implemented but undeclared).
- bluetooth.ts: removed 'other' from firmware grain table; BLE UUIDs, notification flow, wake/calibrate/sync/sleep commands untouched.
- grain-types.ts: removed 'other' from GrainType union, GRAIN_PROFILES, GRAIN_LABELS; added authoritative `GRAIN_OPTIONS` export (8 grains: wheat, rice, corn, barley, soybean, sorghum, oats, millet).
- i18n.ts: removed `grain.other` from all 4 languages (en/hi/mr/hinglish); replaced unused `metric.grain` with `metric.battery` (4 languages).
- Removed ALL Home grain selection: metric-pills.tsx rewritten to balanced 2-column TEMP | SIGNAL layout; GrainTypeDropdown component + GRAIN_OPTIONS array + dead CSS (.grain-grain-dropdown/.grain-grain-option) fully deleted.
- hero-card.tsx now displays `settings.grainType` (hero label always in sync with Settings choice; number still from sensor).
- Discover tab verified to use settings.grainType + Mochi risk state (was already correct; confirmed via browser test "Soybean · Normal").
- HEADER REDESIGN (header.tsx + globals.css):
  - Left: status dot (live breathing glow) + GRAIN MONITOR.
  - Right hierarchy: battery telemetry capsule [icon+94%] (accent color, red when <20%), demo state chip [● DEMO with pulsing dot], compact language rectangle [EN ˅] (settings tab only). Different shapes/weights — no more 3 identical circles.
  - Header is now a real frosted-glass overlay: position absolute, pointer-events passthrough, TWO layered pseudo-elements — ::before vertical translucent bg gradient (0.92→0.62→0.26→0 opacity stops) and ::after backdrop blur+saturate masked with a downward-fading mask-image so frost visibly fades strong→clear. Height 56px, respects safe-area-inset-top. `.grain-scroll` got matching top padding so content scrolls beneath the glass.
- BOTTOM NAV REDESIGN (bottom-nav.tsx + globals.css):
  - Removed `grain-nav-solid` class from JSX and its `!important` solid override CSS.
  - Premium frosted glass: translucent vertical gradient surface (top brighter → bottom darker), blur 28px saturate 1.6, subtle border, ambient shadow + inset highlight, top reflection line (::before gradient line), diagonal sheen (::after).
  - Active tab: accent icon+label, glass highlight behind item, soft ambient glow `0 0 18px rgba(accent, 0.14)` + radial accent light bleed, spring scale 1.04 (cubic-bezier(0.34,1.4,0.64,1)), press scale 0.94. Inactive labels dimmed to 0.75 opacity.
- LANGUAGE SELECTOR (language-selector.tsx): 36px circle → compact rounded-rect glass button [CODE ˅] with rotating caret, aria-expanded, Escape + outside-pointerdown close, panel polished with role=dialog.
- SETTINGS (settings-tab.tsx): grain selector is now a 3-column grid of compact cards (accent highlight + glass fill + Check icon, aria-pressed); only the 8 supported grains.
- MOTION: new `.grain-tab-enter` animation (opacity 0→1, translateY 6px→0, scale 0.995→1, 220ms cubic-bezier(0.16,1,0.3,1)) applied via keyed wrapper in page.tsx; nav glow-in animation; prefers-reduced-motion block disables tab transitions, nav scaling, dot pulses, smooth scrolling.
- New design tokens added to .grain-app (dark + light overrides): --gm-header-height 56px, --gm-header-frost-height, --gm-header-frost-strength, --gm-header-frost-fade, --gm-nav-frost-top, --gm-nav-glow, --gm-glass-highlight-strong/soft. Light mode tuned (frost 0.82/0.8 — visible, never opaque white). All glass effects use --gm-accent/--gm-accent-rgb so they follow the accent picker (orange/green/purple/blue/teal).
- BUG FIX: offline-storage.ts `exportReadingsAsCSV` had broken syntax `return eader, ...rows]` (shipped broken in the upstream repo) → fixed to `return [header, ...rows].join('\n')`.
- BUG FIX (type safety): mochi-engine.ts evaluateRisk had literal-type severity (`let severity = PRIORITY.SAFE` inferred as `10`) and a redundant always-true state comparison → annotated `severity: number`, removed dead branch; recovery rule array typed `EngineState[]`. `bunx tsc --noEmit` now passes 100% clean for app code.
- BLE safety: UUIDs/service/characteristics/notification flow/command set untouched; no reconnect logic changed; demo mode timer logic untouched (verified continuing after grain switch).
- Validation: `bun run lint` clean; `tsc --noEmit` clean (app code); page renders 200; zero browser console errors/warnings (agent-browser).

Stage Summary (browser-verified with agent-browser at 390px, 360px, dark + light):
- Settings Wheat→Soybean while demo runs: Home hero instantly shows "Soybean moisture content", same 12.5%/29°C/78% reading preserved, demo countdown NOT restarted, no duplicate history.
- New demo reading after switch stays Soybean (BLE/demo notifications no longer override selection).
- History keeps captured-at-time grain (old entries Wheat, new entries Soybean — internally consistent); detail view shows GRAIN/Soybean.
- Thresholds auto-update with grain (SAFE <12% for Soybean vs <13% Wheat).
- Discover header shows "Soybean · Normal".
- Teal + orange accents both flow through battery capsule, hero, nav glow, insight card.
- No "Other" anywhere; no grain dropdown on Home; dead code all removed.
- Known dev-only artifact: Next.js dev-tools "N" bubble overlaps the left edge of the bottom nav in dev mode only (not part of the app; absent in production builds).

Files changed:
- src/lib/grain-types.ts, src/lib/grain-store.ts, src/lib/bluetooth.ts, src/lib/mochi-engine.ts, src/lib/i18n.ts, src/lib/offline-storage.ts
- src/components/grain/header.tsx, language-selector.tsx, bottom-nav.tsx
- src/components/grain/home/metric-pills.tsx, hero-card.tsx
- src/components/grain/settings/settings-tab.tsx
- src/app/globals.css, src/app/page.tsx
- package.json (+idb, +@phosphor-icons/react, +@types/web-bluetooth)

---
Task ID: 1-followup
Agent: Main Agent (Z.ai Code)
Task: Post-verification QA — discovered and fixed a critical latent CSS bug: frosted-glass blur was never rendering in Chrome/Firefox.

Work Log:
- While verifying computed styles via agent-browser, found `backdrop-filter` computed as `none` on nav/header/cards despite being in the source CSS.
- Root cause: Tailwind v4's LightningCSS strips the STANDARD `backdrop-filter` declaration whenever a `-webkit-backdrop-filter` twin is present in the same rule (treats it as legacy-target redundancy), emitting only the prefixed form. Chrome does not alias the prefixed form, so ALL 13 glass surfaces (nav, header frost layer, cards, insight card, toast, badges, language panel) silently had NO blur in Chrome/Edge/Firefox — only iOS Safari (native -webkit- support) rendered the frost. Bug shipped in the upstream repo.
- Fix: removed all 13 `-webkit-backdrop-filter:` duplicate lines from src/app/globals.css, keeping only the standard property. LightningCSS now preserves the standard declaration and auto-emits the `-webkit-` twin itself (verified in served CSS: STD: 13, WK: 13).
- Verified in-browser: `getComputedStyle(nav).backdropFilter === 'blur(28px) saturate(1.6)'`; scrolled screenshots show content visibly blurred behind header + bottom nav in both dark and light modes.
- Restarted dev server with clean .next cache during diagnosis (server now running detached via setsid).
- Final sweep: zero browser console errors, lint clean, tsc clean.

Stage Summary:
- Frosted glass now actually renders everywhere (major visual fidelity fix on top of the spec work).
- All spec items from Task 1 remain verified after the fix (re-tested demo + frost scroll).

---
Task ID: 2 (cron review round 1)
Agent: Main Agent (Z.ai Code)
Task: Scheduled webDevReview — QA regression pass, then feature expansion (history statistics, haptics, BLE auto-reconnect) + styling details.

Work Log:
- QA BASELINE: fresh browser session (390px). Page 200, zero console errors/warnings, demo + tabs + history all functional. No regressions from Task 1.
- NEW FEATURE — History Statistics Summary Card (history-tab.tsx + globals.css):
  - Glass card above the reading list: AVG MOISTURE (large number), MIN, MAX, AVG TEMP, reading count, time span (compact "2h 30m" / "3d 4h" formatter).
  - "Storage range" threshold zone bar: green/amber/red zones computed from the ACTIVE grain profile thresholds (safe/warn/critical over domain 0 → critical+4), with min/max markers and a prominent accent avg marker (animated left position).
  - Verified: Wheat zones 61.9/19/19% → Soybean zones 60/20/20% with labels <13%·<17% → <12%·<16%; bar recomputes live with the selected grain; avg marker sits inside the correct zone.
  - i18n: 7 new keys × 4 languages (stats_title/stat_avg/stat_min/stat_max/stat_temp/stat_range + span is unit-agnostic). Hindi/Marathi verified in browser.
- NEW FEATURE — Haptic feedback (src/lib/haptics.ts + settings):
  - New `haptic(enabled, pattern)` util guarded by navigator.vibrate support; restrained patterns (6-16ms; escalation patterns for warning/critical).
  - Wired: bottom-nav tab switch (HAPTIC_TAP, no-op if same tab), settings grain selection (HAPTIC_SELECT), warning/critical Mochi escalation in insight-card (HAPTIC_ALERT/HAPTIC_CRITICAL, only on state transitions, first render skipped), haptics toggle self-feedback.
  - New user preference `hapticsEnabled` (default true) in AppSettings + Preferences toggle in Settings; loadSettings now merges stored settings with DEFAULT_SETTINGS so the new key is defined for previously-persisted settings (forward migration).
- NEW FEATURE — BLE unexpected-disconnect handling + auto-reconnect (bluetooth.ts + grain-store.ts):
  - bluetooth.ts: `onDisconnected(cb)` (single bound 'gattserverdisconnected' listener, de-duplicated per registration), `reconnect()` (re-connects the already-selected device WITHOUT the browser chooser), disconnect() now removes the listener so intentional disconnects never trigger reconnection.
  - grain-store.ts: `handleUnexpectedDisconnect` — guards (demo isolated, ignores intentional/connecting), cleans BLE state, toasts, then if settings.autoReconnect: 3 silent reconnect attempts 4s apart with re-subscribed reading notifications + wake-on-connect. Bail-outs protect against demo start / manual connect mid-loop.
  - i18n: toast.probe_disconnected / toast.reconnecting / toast.reconnected × 4 languages.
  - Not hardware-testable in sandbox — logic reviewed; BLE UUIDs/notification flow untouched; demo mode fully isolated from the new listener.
- STYLING DETAILS:
  - `.grain-tabular` (font-variant-numeric: tabular-nums) applied to hero-adjacent telemetry, metric values, history timestamps/values/stats — digits no longer jitter width while ticking.
  - Toast upgraded: accent left edge (var(--gm-accent)), repositioned below the frosted header (header height + safe-area + 6px), max-width + ellipsis for long messages.
  - History empty state polished (larger rotated icon tile, accent color, relaxed copy width); trash button got aria-label.
  - Stats card: accent radial sheen, inset highlight, zone bar with glass border + glow on avg marker.
- PROCESS FIX: python heredoc i18n editing initially produced duplicate keys in en (en/hinglish share identical strings) and missed Marathi stats + Hinglish haptics (Devanagari anchor typo). All 10 new keys now verified exactly 4× via count check.
- VALIDATION: `bun run lint` clean; `bunx tsc --noEmit` clean (app code); zero browser console errors; verified screenshots at 390px dark + light (r2-stats-card.png, r2-stats-hindi.png, r2-light-stats.png).

Stage Summary:
- History tab upgraded from flat list to analytics surface (summary + zone bar) that follows the grain source-of-truth.
- App now has tactile feedback with user control, and survives probe range-loss gracefully with auto-reconnect.
- No regressions: grain source-of-truth, demo, BLE flow, themes, accents, i18n all re-verified.

Unresolved / Next-round recommendations:
1. BLE auto-reconnect untestable without hardware — first real-device QA should watch the reconnect loop (3 attempts, 4s interval).
2. Chart scrub interaction on the hero sparkline (tap to inspect historical points) — high-value next feature.
3. PWA install prompt (beforeinstallprompt) + share/export JSON in Settings → Data.
4. Next.js dev-tools "N" bubble overlaps nav bottom-left in dev only (cosmetic, dev-only).

---
Task ID: 3 (cron review round 2)
Agent: Main Agent (Z.ai Code)
Task: QA baseline via agent-browser, then Round-3 feature expansion — sparkline scrub inspection, PWA install + offline chip, JSON backup export/import, styling detail polish.

Work Log:
- QA BASELINE (agent-browser, 390px): page 200, zero console errors, demo/history+stats/discover/settings/themes all functional. No regressions from Tasks 1–2. One cosmetic issue found: disabled CALIBRATE button rendered washed-out accent at 40% opacity in light mode → fixed (see styling).
- NEW FEATURE — Sparkline scrub inspection (sparkline-chart.tsx + hero-card.tsx + globals.css):
  - Pointer/touch drag anywhere on the hero chart snaps to the nearest data point (binary search on time-proportional x), shows a dashed vertical guide line + enlarged marker dot + HTML glass tooltip (value % big, HH:MM small) with accent left edge, clamped to card bounds.
  - Desktop mouse hover scrubs without pressing; touch requires press (page scroll preserved via `touch-action: pan-y`), auto-clears 2.8s after release; Escape/blur clears; ArrowLeft/ArrowRight/Home/End keyboard scrubbing on a focusable wrapper (focus ring in accent color).
  - Selection stored as TIMESTAMP not index → new incoming readings never invalidate an active scrub; if the point ages out of the 16-sample window the tooltip self-dismisses (no reset effect, React lint-clean).
  - Haptic 4ms tick on point change (respects settings.hapticsEnabled); latest-point pulse ring and min/max annotations dim while scrubbing; first-run "SWIPE TO INSPECT HISTORY" microcopy inside the chart fades after first use (hidden when demo countdown occupies the top-right slot).
  - ViewBox↔client mapping via getScreenCTM (DOMPoint) → pixel-accurate tooltip anchor regardless of letterboxing.
- NEW FEATURE — PWA install + offline indicator (src/lib/pwa.ts + header.tsx + settings-tab.tsx):
  - `usePwaInstall()` hook: captures `beforeinstallprompt` (module-level, survives tab switches), tracks standalone display-mode, `promptInstall()` returns accepted/dismissed/unavailable; Settings shows an "Install App" card (DeviceMobile icon, accent tile) only when canInstall && !standalone.
  - `useOnlineStatus()` hook + amber OFFLINE chip (WifiSlash icon) in the header next to the DEMO chip; verified live by patching navigator.onLine + dispatching events (chip appears and clears).
- NEW FEATURE — JSON backup export/import (offline-storage.ts + settings-tab.tsx):
  - `exportBackupJSON()` serializes {app, version, exportedAt, settings, readings, history} → downloads `grain-backup-YYYY-MM-DD.json`.
  - `importBackupJSON(json, 'merge'|'replace')`: strict shape validation (app tag, per-item field/type checks), bulk-puts via single transactions, guarantees history keyPath id, merges settings over defaults+current. Invalid file → Error('invalid').
  - Settings → Data now: Export CSV / Export Backup / Import Backup (hidden file input, re-selectable same file) / Clear History. Import refreshes live store via loadHistory()+loadSettings().
  - Browser-verified round-trip: export OK ("Backup exported"), malformed flat entry rejected (0 imported — validator working as designed), properly nested {reading, decision} entry imported ("Backup restored · 1") and confirmed present in IndexedDB, then cleaned up. Invalid JSON object → "Invalid backup file" toast.
- i18n: 13 new keys × 4 languages (export_backup, import_backup, full_data, install_app, install_desc, header.offline, backup_exported, backup_imported, import_failed, import_invalid, install_ok, install_dismissed, chart.scrub_hint). Positional python insert (bottom-up, per-language anchors) — each key verified exactly 4×. Hindi verified in browser.
- STYLING DETAILS:
  - Scrub tooltip: dark glass, blur(14px) saturate(1.4), accent edge via --gm-accent-rgb, tabular-nums, 140ms pop-in. NOTE: deliberately NO `-webkit-backdrop-filter` twin (LightningCSS strips standard property when prefixed twin present — Task 1-followup bug avoided).
  - Disabled CALIBRATE: neutral toggle-bg + tertiary text + hairline border instead of washed accent (verified in light mode).
  - History rows: 150ms active:scale-[0.98] press feedback.
  - prefers-reduced-motion: scrub tooltip animation + sparkline `d` transitions disabled; focus ring preserved.
- VALIDATION: `bun run lint` 100% clean (fixed 2 react-hooks/set-state-in-effect errors: sparkline data-reset effect eliminated via timestamp-selection design; pwa.ts initial sync deferred via setTimeout — the codebase's established pattern); `tsc --noEmit` clean for src/ (remaining errors are pre-existing in examples/ + skills/, untouched); zero browser console errors after full feature pass; screenshots: r3-scrub-tooltip.png, r3-offline-chip.png, r3-light-scrub.png, r3-light-settings-final.png, r3-light-data2.png, r3-hindi-data.png.

Stage Summary (browser-verified):
- Hero chart is now an inspectable instrument: drag/hover/keys reveal any historical reading with glass tooltip + haptics.
- App installs as a PWA when the browser allows, and connectivity loss is surfaced in the header.
- Full local data is portable: one-tap JSON backup out, validated merge restore in.
- All prior spec behavior intact: grain source-of-truth (Wheat→Soybean mid-demo re-verified in light mode), demo isolation, BLE flow untouched, 4 languages, accents flow through all new surfaces.

Unresolved / Next-round recommendations:
1. PWA install card is render-tested only (beforeinstallprompt never fires in headless Chrome) — real-device QA should confirm the native sheet + `appinstalled` transition.
2. Backup import UI is merge-only; consider a destructive "replace" option with confirmation dialog if users need exact restore.
3. Mochi "LEARNING" trend label appears right after a mid-session grain switch (engine re-baselines on threshold change; self-heals on next reading) — could be softened with a transient copy variant.
4. Next.js dev-tools "N" bubble still overlaps bottom-left nav in dev only (cosmetic).
5. Chart scrub on the History tab's per-entry timeline or a dedicated trend page could extend the new inspection pattern.

---
Task ID: 4 (cron review round 3)
Agent: Main Agent (Z.ai Code)
Task: QA status assessment via agent-browser, then — since the app was stable — hero-chart legibility fix + two new features (History Trends analytics panel, backup Replace-mode import with confirmation) + styling detail polish.

Work Log:
- QA BASELINE (agent-browser, 390px): page 200, ZERO console errors, all tabs + demo + history/stats + discover functional; grain source-of-truth, themes, accents all intact. No regressions from Tasks 1–3. One QA issue found: hero-chart text (axis labels, min/max annotations, interval Δ label, scrub hint, countdown, LIVE chip) nearly illegible on the saturated accent gradient in BOTH themes (white fills at 18–30% opacity).
- FIX — Hero chart legibility (sparkline-chart.tsx + hero-card.tsx + globals.css):
  - New `.grain-spark-text` / `.grain-spark-count` classes with `paint-order: stroke` halo technique; theme-aware: dark = white glyphs + dark halo, light = deep-brown glyphs (rgba(62,28,0,.75)) + white halo (hero bottom fades to near-white in light mode, so white text vanished there). Applied to min/max annotations, 3 time-axis labels, Δ interval label, scrub hint, demo countdown.
  - LIVE chip restyled: green-on-orange translucent → dark glass chip (rgba(0,0,0,.32) + blur + hairline border) with pulsing glowing green dot — readable on any accent/theme.
  - Countdown text under chart white/30 → white/60 + tabular-nums; hero grain label white/40 → white/55; chart dot markers 0.25 → 0.4.
- NEW FEATURE — History Trends panel (src/components/grain/history/trends-chart.tsx + history-tab.tsx + globals.css):
  - Large interactive moisture chart (358×216 viewBox, ~210px tall) between Summary and the reading list (renders at ≥2 stored entries).
  - Range selector: iOS-style glass segmented control (`.grain-seg`) with 24H / 7D / 30D / ALL; auto-detects the smallest range with ≥2 points on mount; switching clears any active scrub (range-scoped selection, no setState-in-effect — lint-clean).
  - Time-proportional X axis + monotone cubic curve + accent gradient fill (stop-color via CSS var so accent switching recolors it live).
  - Threshold zone bands from the ACTIVE grain profile (green <safe, amber safe→critical, red >critical) drawn as clamped translucent rects + dashed threshold hairlines with right-aligned % labels; accent dashed avg reference line.
  - Dots colored by the risk state captured with each entry (getRiskColor), latest point enlarged; thinning to ≤48 dots for long ranges.
  - Scrub inspection: same timestamp-anchored pattern as the hero sparkline (pointer drag / desktop hover / ←→ Home End keyboard, Escape/blur clear, touch auto-clear 3.2s, crosshair cursor, accent focus ring, haptic tick on point change) with the glass tooltip showing value + "MMM d · HH:mm".
  - Per-range mini stats row: AVG (accent) / MIN / MAX / READINGS with divider line, tabular-nums.
  - Browser-verified: 24H sine wave with zones + scrub tooltip "12.7% Oct 8 · 13:14"; ALL/24H switching re-anchors axis labels (HH:mm vs MMM d); accent teal→ flows through curve/fill/chip/avg line; Hindi renders (रुझान / औसत नमी / न्यूनतम / अधिकतम / रीडिंग).
- NEW FEATURE — Backup import Replace mode (settings-tab.tsx + i18n):
  - New destructive row "Replace All Data · Wipes local data, restores backup" in Settings → Data; opens a glass confirmation modal (custom, app-token themed): warning icon tile, title, undo-ability warning, Cancel (neutral, autofocus) + "Choose Backup File" (red destructive).
  - Modal rendered via `createPortal` into `.grain-app` — required TWO fixes discovered live in browser: (1) ancestors use `.grain-tab-enter` transform/backdrop-filter which trap position:fixed (overlay rendered inline) → portal; (2) portaling to <body> loses all `--gm-*` tokens (transparent card) → portal target is `.grain-app` (has no transform → fixed still tracks viewport, and vars resolve).
  - `importModeRef` routes the shared hidden file input to `importBackupJSON(text, 'merge' | 'replace')`; distinct toasts ("Backup restored · N" / "Local data replaced · N"); Escape + backdrop-click close the modal.
  - FULL round-trip verified in browser with synthetic backups: merge import (3 entries) → export confirms → Replace with 1-entry backup → toast + export confirms history/readings now exactly ['test-b-0'] (old entries wiped) → Clear History cleanup. Escape-close verified.
- i18n: 12 new keys × 4 languages (history.trends_title/trends_empty/trends_need_more/trends_count + settings.replace_data/replace_desc/replace_confirm_title/replace_confirm_desc/replace_confirm_action/cancel + toast.backup_replaced). Positional python insertion per-language-block (en/hinglish share strings, hi/mr translated); every key verified count==4.
- STYLING DETAILS: trends card = glass with diagonal accent sheen (mirrors Summary card); seg control active = accent bg 0.16 + inset accent ring; reduced-motion block extended (modal fade/pop, trends card fade, seg/trends transitions); "READINGS STORED" → dedicated short "Readings" key (fixed 4-col truncation).
- PROCESS NOTE: dev server CSS watcher went stale mid-round (globals.css edits stopped recompiling — trends CSS present but modal CSS absent from served bundle); fixed by fully restarting dev server (kill + `(setsid bun run dev &)` subshell detachment — plain `&`/nohup variants were reaped between tool calls).
- VALIDATION: `bun run lint` clean; `bunx tsc --noEmit` clean (app code); zero browser console errors across all passes; screenshots: r4-trends-dark.png, r4-trends-scrub.png, r4-trends-all.png, r4-replace-modal4.png, r4-home-light2.png (dark), r4-home-light3.png (light hero fix), r4-trends-light.png, r4-trends-teal.png, r4-hindi-trends.png.

Stage Summary (browser-verified):
- Hero chart is legible on every accent × theme combination (halo-stroked, theme-aware text colors).
- History is now a full analytics surface: Summary → Trends (rangeable, scrubable, zone-banded, risk-colored) → per-entry list.
- Backups are now fully symmetric: export, merge-import, and guarded replace-import with confirm modal.
- All prior behavior intact: grain source-of-truth (Soybean→Wheat mid-demo re-verified), demo isolation, BLE flow untouched, 4 languages, accent system flows through both new surfaces.

Unresolved / Next-round recommendations:
1. BLE auto-reconnect (Task 2) still needs real-hardware QA.
2. PWA install card (Task 3) is render-tested only — needs real-device beforeinstallprompt verification.
3. Trends chart could get a temperature series toggle (data already stored per entry) — natural extension.
4. Next.js dev-tools "N" bubble still overlaps bottom-left nav in dev only (cosmetic, not shipped).
5. Import modal currently doesn't trap focus (Escape + backdrop click work; full focus trap could be added if desired).

---
Task ID: 5 (cron review round 4)
Agent: Main Agent (Z.ai Code)
Task: QA status assessment via agent-browser, then — app stable — bug fixes + two feature expansions (Trends metric toggle, modal focus trap) + styling detail polish.

Work Log:
- QA BASELINE (agent-browser, 390px): page 200, ZERO console errors/warnings, all tabs + demo + history/stats/trends + discover + settings functional. Grain source-of-truth re-verified (Wheat→Soybean mid-demo: hero label + zone bar <12%·<16% update live). No regressions from Tasks 1–4.
- BUG FOUND: demo countdown "Next reading in X" (text-white/60) nearly invisible in LIGHT mode — hero gradient fades to near-white at its bottom. Same issue affecting the hero "%" sign and grain label (white/55-60 on light orange).
- FIX — Hero light-mode legibility (hero-card.tsx + globals.css):
  - New theme-aware classes: `.grain-hero-sub` (unit %, grain label) and `.grain-hero-countdown` (demo countdown) — dark: unchanged white translucency; light: deep-brown rgba(62,28,0,.62-.66) + soft white text-shadow halo (mirrors the SVG .grain-spark-text halo pattern). Verified legible in light, unchanged in dark.
- NEW FEATURE — Trends metric toggle (MOISTURE | TEMP) (trends-chart.tsx + globals.css):
  - Second segmented control (reuses .grain-seg) in a new header row; metric-scoped scrub clearing (selectMetric same pattern as selectRange).
  - Temp mode: own auto domain (±30% pad), accent curve/dots (no risk coloring), NO moisture threshold zones/hairlines (correct — thresholds are moisture-specific), scrub tooltip with °C suffix, per-range mini stats swap to AVG TEMP/MIN/MAX (°C) via existing history.stat_temp key.
  - Legacy-entry tolerance: temp mode filters entries lacking numeric temperature; <2 usable → trends_need_more state.
  - Reuses existing i18n keys (hero.moisture / metric.temp) — no new keys.
- NEW FEATURE — Trend direction chip (trends header):
  - Glass pill next to TRENDS title: TrendUp/TrendDown/Minus icon + signed delta over the selected range (e.g. ↗ +0.4% / ↘ -0.5% / — +0.2°C), tabular-nums, grain-fade-in.
  - Color semantics: moisture rising=amber/falling=green (storage-risk semantics); temp mode uses accent for any direction. aria-label = localized direction (existing history.trend_* keys) + magnitude. role=status.
- NEW FEATURE — Replace-modal focus trap + focus restore (settings-tab.tsx):
  - Tab/Shift+Tab cycle within the dialog (disabled-filtered focusables), capture-phase Escape (works even when focus is on body), focus restored to the opener on close.
  - LIVE-FOUND SUBTLE BUG during implementation: capturing lastFocus in the open-effect grabbed the Cancel button (React already applied autoFocus by passive-effect time) → restore targeted a detached node (silent no-op). Fixed by capturing document.activeElement in the click handler (openReplaceModal) BEFORE setState.
  - Browser-verified: open→Cancel focused; Tab cycles Cancel→Choose Backup File→(wrap)Cancel; Shift+Tab reverse; Escape→modal closes→focus back on "Replace All Data"; backdrop-click close still works.
- STYLING DETAILS:
  - Scrub guide line in trends chart: fixed rgba(255,255,255,.45) → theme-aware var(--gm-text-tertiary) @ 0.55 opacity (was weak in light mode).
  - 3 horizontal grid hairlines (25/50/75% of plot) in trends chart via var(--gm-separator) — subtle instrument feel, both metrics, both themes.
  - `.grain-trend-chip` glass pill (toggle-bg + hairline border); `.grain-seg-metric` uppercase + slightly wider padding.
- INFRA FIX: Next.js dev-tools "1 Issue" badge (cross-origin dev warning from preview host loading /_next/* assets) → added `allowedDevOrigins: ["preview-chat-*.space-z.ai"]` to next.config.ts + full dev-server restart (setsid). Badge gone; warning no longer logged.
- i18n NOTE: initially added 3 new trend keys, then discovered `history.trend_rising/falling/stable` (plus spike/drop) already existed in all 4 languages (Mochi engine labels) — removed my duplicates (object would have had dupe keys), reused existing. All counts verified = 4.
- VALIDATION: `bun run lint` clean; `bunx tsc --noEmit` clean for app code (remaining 4 errors pre-existing in examples/ + skills/); zero browser console errors/warnings across dark+light × moisture+temp × pointer+keyboard scrub; demo + IndexedDB persistence verified across a dev-server restart (62 readings survived clear-test via accidental "Clear History" click, then regenerated at 1-min demo interval).
- Screenshots (download/): r5-qa-home.png, r5-qa-settings.png, r5-qa-demo-home.png, r5-qa-history.png, r5-qa-discover.png, r5-qa-soybean.png, r5-qa-light-home.png, r5-qa-light-trends.png, r5-light-countdown.png (legibility fix), r5-trends-moisture.png, r5-trends-temp.png, r5-trends-temp-scrub.png, r5-dark-countdown.png, r5-dark-trends.png, r5-dark-trends-temp.png, r5-kbd-scrub.png, r5-final-dark-history.png, r5-final-home.png.

Stage Summary (browser-verified):
- Trends is now a dual-metric instrument (moisture with storage zones / temperature) with at-a-glance direction chip, and hero text is fully legible in both themes.
- The destructive-data modal now meets keyboard a11y expectations (trap + Escape + focus restore).
- Dev-tools issue badge eliminated (allowedDevOrigins).
- All prior behavior intact: grain source-of-truth, demo isolation, BLE flow untouched, 4 languages, accents flow through all new surfaces (temp curve/dot/chip use accent var).

Unresolved / Next-round recommendations:
1. BLE auto-reconnect (Task 2) + PWA install card (Task 3) still need real-device QA.
2. Trends metric selection could persist across sessions (currently resets to Moisture on remount) — one AppSettings key.
3. Discover tab video cards use gray placeholder thumbnails — real thumbnails (image-search or YouTube thumb URLs) would lift visual quality noticeably.
4. History per-entry detail could show delta vs previous reading (small trend arrow per row).
5. Dev-tools "N" bubble still overlaps bottom-left nav in dev only (cosmetic, not shipped).

---
Task ID: 6 (cron review round 5)
Agent: Main Agent (Z.ai Code)
Task: QA status assessment via agent-browser, then — app stable — fix the Discover thumbnail issue (last round's top recommendation) + three feature expansions (Trends metric/range persistence, per-entry delta chips + share, Storage Score gauge) + styling detail polish.

Work Log:
- QA BASELINE (agent-browser, 390px): page 200, ZERO console errors, all tabs + demo + history/stats/trends/score + discover + settings functional. Confirmed prior round's #3 recommendation as the main QA issue: EVERY Discover thumbnail showed YouTube's gray "video unavailable" placeholder — the curated video IDs were fabricated and img.youtube.com returned 404s.
- FIX — Discover real videos (discover-content.ts):
  - Curated 24 REAL YouTube videos via web-search (site:youtube.com queries) + YouTube oEmbed API verification (every ID returns 200 title+channel; every thumbnail returns HTTP 200). Mapped to categories: critical (Ag PhD spoilage, Millennial Farmer dryer, UK Extension bin safety, RealAgriculture drying), warn (SDSU Extension crop hour, GRDC temperature monitoring, Farming Smarter aeration, GSI GrainVue), safe (UK storage tips, Northern Farmer moisture testing, Tom Lamb meter explainer, pest-damage storage), wheat (Abid Ali Agrarian + SAWBO salt-testing), rice (IRRI moisture measurement + Digital Green/CSISA paddy drying), corn (Ag PhD drying + Beck's END ZONE), soybean (Grains and Grit + CGTN smart storage), barley (Barndoor Ag tester + AGI BinManager), oats (roosty6). Sources are now REAL channel names (old file had invented ones).
  - discover-tab.tsx: extracted DiscoverCard component with per-image onError fallback → branded accent-gradient tile + glass play circle (never shows broken image / gray placeholder again); play affordance redesigned as blurred glass circle over a bottom scrim (was flat overlay).
- FIX — next.config.ts `devIndicators: false`: the floating dev-tools "N" bubble overlapped the Home nav label at 390px (long-standing cosmetic item). Verified gone; nav labels fully visible.
- FEATURE — Trends metric + range persistence (grain-types.ts + trends-chart.tsx):
  - New AppSettings keys `trendsMetric: 'moisture'|'temp'` (default moisture) + `trendsRange: 'auto'|'24h'|'7d'|'30d'|'all'` (default auto = previous behavior). selectMetric/selectRange persist via updateSettings. Backup import merge already generic — new keys flow through safely.
  - Browser-verified: TEMP+7D selected → keys appear in IndexedDB settings record → full page reload + demo restart → trends reopens TEMP+7D.
- FEATURE — Per-entry delta vs previous reading (history-tab.tsx):
  - computeDelta(entry, prev): signed moisture delta with storage semantics — rising=amber #F59E0B, falling=green #22C55E, |Δ|<0.05=neutral. Glass pill chips (.grain-delta-chip, tabular-nums, aria-label 'vs previous reading +0.2%') in list rows AND in the detail moisture card.
- FEATURE — Share reading (ReadingDetail):
  - Accent glass button (.grain-share-btn) next to close; Web Share API when available → clipboard copy fallback → toast 'Copied to clipboard' + button flips to Check icon for 1.6s; AbortError (user dismissed share sheet) stays silent; other failures toast 'Could not share'. Share text includes grain, moisture, temp, timestamp, state + Mochi message (localized). NOTE: web-bluetooth Navigator typing breaks `in`-narrowing for share() → cast pattern like bluetooth.ts.
- FEATURE — Storage Score (new src/lib/storage-score.ts + StorageScoreCard in history-tab.tsx):
  - 0–100 composite: ZONES 55% (reading distribution below safe/warn/critical), STABILITY 25% (moisture stddev, 0.4→2.5% mapped), TREND 20% (last-8 direction; rising costs marks). Bands: ≥85 Excellent (green), ≥70 Good (lime), ≥50 Fair (amber), <50 Risky (red) — semantic colors independent of accent, by design.
  - Renders between Summary and Trends (≥3 entries): 270° SVG arc gauge (dasharray animated, .grain-score-arc) + score/100 + three labeled subscore mini-bars (.grain-score-bar-track/fill). Band label chip in header.
- i18n: 12 new keys × 4 languages (score_title/excellent/good/fair/risky/zones/stability/trend, delta_prev, share, toast.copied, toast.share_fail) via positional python insertion.
  - PROCESS BUG (caught in browser QA): my insertion script REPLACED the anchor lines instead of inserting after them — 'toast.demo_off' + 'history.trend_drop' were deleted in all 4 languages; Hindi UI showed raw key "toast.demo_off" in the toast. Restored both keys with a corrected insert-before-anchor script; per-language ordering verified programmatically (trend_spike < trend_drop < score_title < share < settings.title; demo_on < demo_off < copied < share_fail < demo.title); toast re-verified in Hindi ("डेमो मोड बंद").
- STYLING DETAILS: score gauge arc/bar transitions (600ms cubic-bezier, disabled under prefers-reduced-motion); delta chips reuse the toggle-bg glass pill family; share button = accent-tinted glass square matching close button; discover fallback gradient uses --gm-accent-soft so it recolors with accents; bottom scrim + glass play circle on thumbnails.
- VALIDATION: `bun run lint` clean; `bunx tsc --noEmit` clean for app code; ZERO browser console errors across the entire pass; dev server restarted (setsid) to pick up next.config.ts. Screenshots (download/): r6-qa-home-initial, r6-qa-discover (gray placeholder baseline), r6-discover-real (real thumbs), r6-discover-fallback (CDN-blocked fallback test via network route), r6-devbubble-check, r6-history-top (score card), r6-history-rows2 (delta chips dark), r6-detail + r6-share (detail + clipboard toast), r6-temp-trends (temp+7d), r6-light-history, r6-light-rows, r6-hindi-history, r6-hindi-toast-fixed (bug), r6-hindi-toast2 (fixed), r6-teal-score, r6-final-home-dark.

Stage Summary (browser-verified):
- Discover now recommends 24 real, verified videos with working thumbnails and honest channel names; broken thumbnails degrade to a branded tile.
- Trends chart remembers metric + range across sessions.
- History list + detail show per-reading deltas with storage-risk color semantics; any reading can be shared/copied in one tap.
- History gains a Storage Score instrument (0–100 arc gauge + component breakdown) that quantifies storage safety at a glance.
- All prior behavior intact: grain source-of-truth, demo isolation, BLE flow untouched, 4 languages, themes, accents flow through all new surfaces.

Unresolved / Next-round recommendations:
1. BLE auto-reconnect (Task 2) + PWA install card (Task 3) still need real-device QA.
2. Storage Score could get a per-grain explanation sheet (what moves the score) — a natural onboarding improvement.
3. Discover video grid is a single column; a "saved videos" (bookmarks) store would add return value.
4. History detail could graph the surrounding 16 readings as a mini sparkline around the selected point.
5. Marathi translations for the 12 new keys were added but only spot-verified in code (Hindi was browser-verified).
