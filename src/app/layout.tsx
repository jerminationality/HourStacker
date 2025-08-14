
import "./globals.css";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerManager } from "@/components/ServiceWorkerManager";
import { CssWatchdog } from "@/components/CssWatchdog";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>HourStacker</title>
        <meta name="description" content="An app to help you keep track of your hours." />
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
      <body className="font-body antialiased bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SettingsProvider>
            <AppDataProvider>
              <div className="relative flex min-h-screen w-full flex-col items-center">
                <div className="w-full max-w-4xl">{children}</div>
              </div>
            </AppDataProvider>
          </SettingsProvider>
        </ThemeProvider>
  <Toaster />
  <CssWatchdog />
        <ServiceWorkerManager />
      </body>
    </html>
  );
}
