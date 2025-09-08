"use client";
import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

/**
 * Detects failed Next.js chunk loads (often after a deploy) and offers a quick reload.
 * Works by listening for script load errors pointing at /_next/static/chunks/ and
 * unhandled promise rejections with ChunkLoadError name.
 */
export function ChunkRecovery() {
  const { toast } = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    async function forceHardReload() {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map(r => r.unregister()));
        }
        if (window.caches) {
          const names = await caches.keys();
            await Promise.all(names.map(n => caches.delete(n)));
        }
      } catch {
        /* ignore */
      } finally {
        window.location.reload();
      }
    }

    function show() {
      if (shownRef.current) return;
      shownRef.current = true;
      toast({
        title: 'Update required',
        description: 'Some resources failed to load. Reload to update.',
        action: (
          <ToastAction altText="Reload" onClick={forceHardReload}>Reload</ToastAction>
        ),
      });
    }

    function onError(e: Event) {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === 'SCRIPT') {
        const src = (target as HTMLScriptElement).src || '';
        if (src.includes('/_next/static/chunks/')) {
          show();
        }
      }
    }

    function onUnhandled(e: PromiseRejectionEvent) {
      const reason: unknown = e.reason;
      if (
        reason && typeof reason === 'object' && (
          // Narrow via in-operator & optional chaining
          (('name' in reason && (reason as { name?: string }).name === 'ChunkLoadError')) ||
          (('message' in reason) && /Loading chunk [^ ]+ failed/i.test(String((reason as { message?: unknown }).message)))
        )
      ) {
        show();
      }
    }

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onUnhandled);
    return () => {
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onUnhandled);
    };
  }, [toast]);

  return null;
}
