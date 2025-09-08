
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
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="HourStacker" />
  <meta name="format-detection" content="telephone=no" />
      </head>
  <body className="font-body antialiased bg-[#1F1F1F] text-foreground">
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
