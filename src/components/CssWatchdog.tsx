"use client";
import { useEffect } from 'react';

// Attempts to detect a failed global CSS chunk load and forces a full reload without SW.
export function CssWatchdog() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    links.forEach(link => {
      if (/globals_.+\.css$/.test(link.href)) {
        fetch(link.href, { cache: 'no-store' })
          .then(r => {
            if (!r.ok) {
              console.warn('Global CSS missing, forcing reload without service worker');
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
              }
              setTimeout(() => window.location.reload(), 150);
            }
          })
          .catch(() => {
            console.warn('Global CSS fetch failed, unregistering SW and reloading');
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));
            }
            setTimeout(() => window.location.reload(), 150);
          });
      }
    });
  }, []);
  return null;
}
