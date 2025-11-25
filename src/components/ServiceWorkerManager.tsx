"use client";
import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

export function ServiceWorkerManager() {
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const refreshingRef = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return; // Avoid SW in dev to reduce stale chunk issues
    if ('serviceWorker' in navigator) {
      const version = process.env['NEXT_PUBLIC_SW_VERSION'] || String(Date.now());
      const swUrl = new URL(
        `/sw.js?v=${encodeURIComponent(version)}`,
        'https://hour-stacker.vercel.app/'
      ).toString();
      navigator.serviceWorker
        .register(swUrl, { updateViaCache: 'none' })
        .then((registration) => {
          // Check for SW updates when the page becomes visible
          const onVisibility = () => {
            if (document.visibilityState === 'visible') {
              try {
                registration.update();
              } catch (err) {
                if (process.env.NODE_ENV !== 'production') {
                  // Ignore update errors in dev; this is a best-effort check
                  console.debug('Service Worker update check failed', err);
                }
              }
            }
          };
          document.addEventListener('visibilitychange', onVisibility);

          // Cleanup listener on unload/react teardown
          window.addEventListener('unload', () => {
            document.removeEventListener('visibilitychange', onVisibility);
          });
          // If there's an updated worker waiting, prompt the user to reload
          if (registration.waiting) {
            waitingWorkerRef.current = registration.waiting;
            showUpdateToast();
          }
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available; prompt the user
                  waitingWorkerRef.current = newWorker as unknown as ServiceWorker;
                  showUpdateToast();
                }
              });
            }
          });

          // Reload once the new SW becomes the controller
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshingRef.current) return;
            refreshingRef.current = true;
            window.location.reload();
          });
        })
        .catch((error) => console.error('Service Worker registration failed:', error));
    }
  }, []);

  function showUpdateToast() {
    toast({
      title: 'Update available',
      description: 'A new version is ready. Reload to update now.',
      action: (
        <ToastAction
          altText="Reload"
          onClick={() => {
            waitingWorkerRef.current?.postMessage({ type: 'SKIP_WAITING' });
          }}
        >
          Reload
        </ToastAction>
      ),
    });
  }
  return null;
}
