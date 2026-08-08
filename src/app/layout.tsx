import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "Grain Monitor",
  description: "Real-time grain moisture monitoring companion for ESP32 probes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Grain Monitor",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body
        style={{
          background: '#000',
          margin: 0,
          padding: 0,
          fontFamily: "var(--font-inter), system-ui, -apple-system, sans-serif",
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100dvh',
        }}
      >
        {children}
      </body>
    </html>
  );
}