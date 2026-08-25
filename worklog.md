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

