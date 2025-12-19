
import "./globals.css";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";
import { ChunkRecovery } from "@/components/ChunkRecovery";
import { CssWatchdog } from "@/components/CssWatchdog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HourStacker",
  description: "Track and visualize your work hours locally with a fast PWA.",
  // Optional: set NEXT_PUBLIC_SITE_URL for absolute OG URLs
  metadataBase: process.env["NEXT_PUBLIC_SITE_URL"] ? new URL(process.env["NEXT_PUBLIC_SITE_URL"] as string) : undefined,
  openGraph: {
    title: "HourStacker",
    description: "Track and visualize your work hours locally with a fast PWA.",
    type: "website",
    images: [
      {
        url: "/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "HourStacker app icon"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "HourStacker",
    description: "Track and visualize your work hours locally with a fast PWA.",
    images: ["/icon-512x512.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-192x192.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
  {/* Title & description now provided via Next.js metadata API */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
        <meta name="theme-color" content="#778DA9" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="HourStacker" />
  <meta name="format-detection" content="telephone=no" />
  <style>{`:root,body,html{touch-action:manipulation;overscroll-behavior:contain}`}</style>
      </head>
  <body className="font-body antialiased bg-[#1F1F1F] text-foreground">
        <style dangerouslySetInnerHTML={{__html: `
          .rdp-root { position: relative; box-sizing: border-box; }
          .rdp-root * { box-sizing: border-box; }
          .rdp-day { width: 44px; height: 44px; text-align: center; }
          .rdp-day_button { background: none; padding: 0; margin: 0; cursor: pointer !important; font: inherit; color: inherit; justify-content: center; align-items: center; display: flex; width: 42px; height: 42px; border: 2px solid transparent; border-radius: 100%; }
          .rdp-day_button:disabled { cursor: revert; }
          .rdp-button_next, .rdp-button_previous { border: none; background: none; padding: 0; margin: 0; cursor: pointer; font: inherit; color: inherit; display: inline-flex; align-items: center; justify-content: center; position: relative; appearance: none; width: 2.25rem; height: 2.25rem; }
          .rdp-month_caption { display: flex; align-content: center; height: 2.75rem; font-weight: bold; font-size: large; }
          .rdp-months { position: relative; display: flex; flex-wrap: wrap; gap: 2rem; max-width: fit-content; }
          .rdp-month_grid { border-collapse: collapse; }
          .rdp-nav { position: absolute; top: 0; right: 0; display: flex; align-items: center; height: 2.75rem; }
          .rdp-weekday { opacity: 0.75; padding: 0.5rem 0; font-weight: 500; font-size: smaller; text-align: center; }
          .rdp-focusable { cursor: pointer !important; }
        `}} />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SettingsProvider>
            <AppDataProvider>
              <div className="relative flex min-h-screen w-full flex-col items-center">
                <div className="w-full max-w-[512px] bg-background min-h-screen">{children}</div>
              </div>
            </AppDataProvider>
          </SettingsProvider>
        </ThemeProvider>
  <Toaster />
  <CssWatchdog />
  <ServiceWorkerManager />
  <ChunkRecovery />
      </body>
    </html>
  );
}
