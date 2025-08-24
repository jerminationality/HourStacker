"use client";
import { useEffect } from 'react';

export function ServiceWorkerManager() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const version = process.env.NEXT_PUBLIC_SW_VERSION || String(Date.now());
      const swUrl = `/sw.js?v=${encodeURIComponent(version)}`;
      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);
  return null;
}
