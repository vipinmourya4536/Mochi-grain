---
Task ID: 1
Agent: Main
Task: Add demo mode to Grain Monitor app and push to GitHub

Work Log:
- Audited all key source files: page.tsx, grain-store.ts, settings-tab.tsx, header.tsx, grain-types.ts, mochi-engine.ts, i18n.ts, offline-storage.ts, connected-view.tsx, hero-card.tsx, metric-pills.tsx, insight-card.tsx, recent-readings.tsx, history-tab.tsx, disconnected-view.tsx
- Added `demoMode`, `demoInterval`, `enableDemoMode()`, `disableDemoMode()` to Zustand store interface and implementation
- Created `generateDemoReading()` function that produces realistic moisture (11-15%), temperature (25-30°C), battery, and signal values with sinusoidal jitter
- Created `generateDemoHistory()` that generates 20 history entries spanning ~3 days with full Mochi decision analysis
- Demo mode auto-switches to Home tab and shows: hero card with moisture, sparkline chart, metric pills (temp/signal/grain), Mochi insight card, and 3 recent readings
- Live simulation updates every 8 seconds with new readings
- Modified `loadSelectedEntry()` to support in-memory demo history lookups
- Added demo toggle button with Play/StopCircle icons in Settings > Advanced section
- Added green "DEMO" badge in header when demo is active
- Added 8 i18n keys (demo.title, demo.desc, demo.start, demo.stop, demo.active, demo.badge, toast.demo_on, toast.demo_off) across all 4 languages (en/hi/mr/hinglish)
- Verified with lint (clean) and agent-browser (full flow works: start demo → home view → history → history detail)
- Pushed to GitHub: commit 70e6826

Stage Summary:
- Demo mode fully functional with realistic grain monitoring data
- No hardware required – user can test the entire app experience
- 4 files changed: grain-store.ts, i18n.ts, settings-tab.tsx, header.tsx
- Pushed to https://github.com/vipinmourya4536/Mochi-grain.git
---
Task ID: 1
Agent: Main Agent
Task: Configurable real-time demo interval + professional sparkline chart

Work Log:
- Analyzed screenshot showing Chrome BLE pairing dialog
- Read all relevant source files (grain-store, hero-card, sparkline-chart, settings-tab, i18n, page.tsx)
- Changed demo interval from 3s simulation to real-time (demoIntervalSec * 1000 ms)
- Removed SIMULATION_TICK_MS constant, now uses actual configured interval
- Timestamps use Date.now() for real-time accuracy
- Rebuilt sparkline-chart.tsx: 120px height, time axis labels (HH:MM), min/max value annotations, grid lines, interval delta label, countdown indicator with pulsing green dot
- Enhanced hero-card.tsx: LIVE badge, real-time countdown timer (ticking every second), "Next reading in Xm Xs" text
- Updated i18n for all 4 languages: changed sim_speed text to real-time description, added demo.next_reading and demo.live keys
- Fixed settings-tab.tsx: probe controls (Sync/Wake) hidden during demo mode, hasConnection = hasDevice && !demoMode
- Verified with agent-browser: countdown 9m 59s for 10min interval, professional chart with time labels, LIVE/DEMO badges, clean lint

Stage Summary:
- Demo data now arrives at actual real-time intervals (1min/5min/10min/30min/1hr)
- Professional sparkline with time-proportional X axis, value annotations, smooth monotone cubic curves
- Live countdown shows exactly when next reading arrives
- Demo and BLE flows are fully isolated
- All i18n updated for en/hi/mr/hinglish

---
Task ID: 1
Agent: main
Task: Implement Mochi Decision Engine v2.0

Work Log:
- Rewrote grain-types.ts: Added STATE/EXPRESSION/PRIORITY/TREND enums, EngineState, MochiExpression, expanded MochiDecision with expression/confidence/debug, added stateToRiskTheme mapper, expanded RiskTheme to include monitor, expanded StatusBadge with MONITOR/RECOVERY/LEARNING/IDLE
- Rewrote mochi-engine.ts: Full 6-module engine with trendAnalyzer, historyAnalyzer (dedup/gap detection/stability windows), riskEvaluator (moisture+temp+trend escalation), ruleEvaluator (recovery detection, 9 rule types), cooldownManager, messageResolver (13 message types with i18n keys), getStatusBadge (8 states), getInsightTitle, getTrendLabel
- Updated grain-store.ts: Wired stateToRiskTheme for all decision.state → riskTheme conversions (enableDemoMode, live interval, handleReading)
- Updated accent-hex.ts: getRiskColor/getRiskBg now map engine states via stateToRiskTheme, added monitor color
- Redesigned insight-card.tsx: Dark brown v2 card matching reference UI, SAFE · STABLE header, expression-mapped icons, state-specific icon colors, evidence + recommendation structure, confidence indicator, rule ID display
- Added 196 i18n keys (49 per language × 4): engine message/action keys for all 13 rules, status badges (monitor/recovery/learning/idle/invalid), trend keys (rising_rapidly/falling_rapidly/insufficient_data), engine title keys
- Updated history-tab.tsx: New trend types (rising_rapidly, falling_rapidly), expanded state labels, confidence display (HIGH/MEDIUM/LOW instead of %)
- Updated discover-tab.tsx: Uses stateToRiskTheme for condition mapping
- Added CSS: grain-insight-card-v2 with dark brown backgrounds per state, monitor risk theme for hero/alert colors

Stage Summary:
- Full Mochi Decision Engine v2.0 implemented with 6 sub-modules
- UI matches reference screenshots (SAFE · STABLE, dark brown insight card)
- All 4 languages (en/hi/mr/hinglish) have complete translations
- Recovery detection, cooldown suppression, confidence scoring all working
- 13 distinct engine messages with evidence + recommendation pattern
---
Task ID: 1
Agent: Main
Task: Fix pitch-black cards in light mode

Work Log:
- Analyzed user screenshot showing insight card as pitch black in light mode
- Identified root cause: `.grain-insight-card-v2` had dark brown/black background colors (#1c1410, #1a1610, etc.) with NO light mode overrides
- Also found hardcoded `rgba(255,255,255,...)` borders in insight-card.tsx that only work in dark mode
- Found grain-card::before, hero-card border/::before with dark-mode-only white alpha values
- Added light mode CSS overrides for insight-card-v2 (safe: #fffbf5, warn: #fffbeb, critical: #fef2f2, monitor: #fffef5)
- Added light mode grain-card::before with brighter white highlight
- Added light mode hero-card border and ::after glow adjustments
- Added light mode sparkline stroke (higher contrast white on colored gradient)
- Replaced hardcoded rgba(255,255,255,0.06) and rgba(255,255,255,0.04) in insight-card.tsx with var(--gm-separator) and var(--gm-border)
- Verified with Agent Browser: light mode now shows white/light insight cards, dark mode still correct
- No lint errors, no console errors

Stage Summary:
- Insight card v2 now properly supports both light and dark themes
- Hero card, grain cards, sparkline all adapt to light mode
- All changes are CSS-only (globals.css) plus 2 line changes in insight-card.tsx
---
Task ID: 2
Agent: Main
Task: Compact Mochi decision card + fix system theme-color

Work Log:
- Analyzed user screenshots showing oversized insight card and hardcoded orange status bar
- Redesigned insight-card.tsx: reduced icon 44→36px, glyph 22→18px, gap 16→12px
- Tightened typography: status 9px, title 14px, desc 12px, action 11px
- Reduced CSS padding from 1.25rem (20px) to 14px/16px, border-radius 1rem→0.875rem
- Tightened inter-element spacing: mt-2.5→mt-1.5, pt-2.5→pt-1.5, mb-1.5→mb-1
- Removed hardcoded themeColor: "#F97316" from layout.tsx viewport export
- Updated manifest.json theme_color from #F97316 to #09090b (neutral dark for install-time)
- Added computeThemeColor() function that darkens accent to 18% in dark mode
- Added useEffect in page.tsx to dynamically update <meta name="theme-color">
- Verified theme-color changes: orange→#2d1504, green→#062311, blue→#0b172c, light→#f5f5f7
- Verified insight card height reduced from ~180px to ~115px
- No text truncation, no fixed heights, no line-clamp used
- Pushed to GitHub (commit b151dbf)

Stage Summary:
- Files changed: insight-card.tsx, globals.css, layout.tsx, page.tsx, manifest.json
- Mochi decision card is now ~35% shorter vertically
- System theme-color now dynamically follows accent color + dark/light mode
