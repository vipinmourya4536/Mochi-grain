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
