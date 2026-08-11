# 🌾 Grain Monitor

Real-time grain moisture monitoring PWA for ESP32 probes. Track moisture, temperature & grain safety across 9 grain types.

## Features

- **Live Monitoring** — Real-time moisture & temperature readings via BLE
- **9 Grain Types** — Wheat, Rice, Corn, Barley, Soybean, Sorghum, Oats, Millet, Other
- **Smart Alerts** — Safe / Warning / Critical risk states with actionable insights
- **Mochi Decision Engine** — Rule-based moisture analysis with trend detection
- **4 Languages** — English, हिन्दी, मराठी, Hinglish
- **5 Accent Themes** — Orange, Green, Purple, Blue, Teal
- **Dark & Light Mode** — Full theme support
- **Liquid Glass UI** — Glassmorphism design with configurable intensity
- **Offline Storage** — IndexedDB for readings, history & settings
- **PWA** — Install as a mobile app on any device

## Tech Stack

- **Next.js 16** (App Router + Turbopack)
- **TypeScript** + **Tailwind CSS 4** + **shadcn/ui**
- **Zustand** (state) + **IndexedDB** (persistence)
- **Web Bluetooth API** (ESP32 communication)

## Setup

```bash
bun install
bun run dev
```

## Mobile App

This is a PWA — open the deployed URL in Chrome on your phone and tap **"Add to Home Screen"** to install it as a native-like app.

### Publishing Notes
- `manifest.json` configured with `display: standalone` and maskable icons
- `theme_color: #F97316` for orange status bar on Android
- `apple-mobile-web-app-capable: yes` for iOS full-screen
- Portrait-only orientation

## ESP32 Integration

The app connects to ESP32 probes via Web Bluetooth:
- Service UUID: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- Reads moisture, temperature, battery & signal strength
- Supports wake, calibrate, sync & sleep commands

## License

Private — All rights reserved.