# Invoice Ledger fork plan

Use this checklist to spin HourStacker into a standalone invoice tracker.

1. **Copy the scaffold**
   - Folder: `invoice-app/` (already in repo). Move to its own repository when ready:
     ```bash
     git clone <hourstacker>
     cp -R invoice-app ../invoice-ledger
     ```
2. **Install dependencies**
   ```bash
   cd invoice-app
   pnpm install # or npm install
   pnpm dev
   ```
3. **Replace branding**
   - Update `app/layout.tsx` metadata
   - Swap icons under `public/` and tweak colors in `app/globals.css`
4. **Extend domain**
   - `src/contexts/InvoiceContext.tsx` currently stores data in localStorage. Replace with API calls or database layer as needed.
   - Add custom fields to `Client` / `Invoice` interfaces (`src/lib/types.ts`). UI surfaces them automatically when you update `NewClientForm` / `NewInvoiceForm`.
5. **Deploy**
   - Add `NEXT_PUBLIC_SW_VERSION` during builds to bust caches.
   - Configure hosting (Vercel recommended). For Play Store distribution, reuse the Bubblewrap instructions in `docs/android-play-publish.md`.

This scaffold keeps the HourStacker stack (Next.js, Tailwind, shadcn/ui, PWA). Iterate here before making a clean repo.
