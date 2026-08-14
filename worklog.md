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
