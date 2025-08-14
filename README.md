## HourStacker

Time tracking PWA built with Next.js 15 (App Router), React 18, TypeScript, Tailwind, and shadcn/Radix UI. Local data stored via custom context + localStorage; service worker + manifest provide offline/PWA basics.

### Features
- Projects with cumulative hour totals
- Shifts with start/end times, descriptions, grouped by day & month
- Active shift live timer
- Export project data to clipboard (plain text)
- Configurable hour display (decimal / descriptive / both) & time format (12h/24h)
- PWA: manifest + icons + service worker registration
- Theming (light/dark) via next-themes & Tailwind design tokens
<!-- AI scaffolding removed (Genkit deps pruned) -->

### Tech Stack
- Next.js 15 / React 18
- TypeScript (strict + extra safety flags)
- Tailwind CSS + Radix UI components (shadcn patterns)
- date-fns, react-hook-form + zod, lucide-react icons
- ESLint (flat config) + Prettier formatting
- Nix dev environment (optional) for Firebase Studio

### Scripts
| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build (fails on type or lint errors) |
| `npm start` | Run built app |
| `npm run typecheck` | TypeScript check only |
| `npm run lint` | ESLint (errors fail) |
| `npm run lint:fix` | Auto-fix lint issues |
| `npm run format` | Prettier write |
| `npm run check` | Typecheck + lint combo |

### Development
Install dependencies and run the dev server:
```bash
npm install
npm run dev
```
Open http://localhost:3000.

### Code Quality
- Build now enforces type & lint cleanliness (`ignoreBuildErrors` removed).
- Strict TS with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.
- ESLint flat config with React, hooks, a11y, import ordering, Prettier compatibility.

### PWA
Service worker (`/sw.js`) is registered in `src/app/layout.tsx`. Manifest & icons live in `/public`.

<!-- AI section removed. Reintroduce when adding model-backed features. -->

### Cleanup Changes (This Commit)
- Added ESLint + Prettier configs
- Tightened TypeScript compiler options
- Enforced build-time lint & type errors
- Removed duplicate `Active-shift-card.tsx` (kept `ActiveShiftCard.tsx`)
- Added utility scripts (`check`, `format`, etc.)
- Removed unused AI (Genkit) dependencies & scripts

### Next Ideas
- Persist data to Firebase (add initialization + Firestore sync)
- Add tests (Vitest / Jest) for utilities & contexts
- Add CI workflow (GitHub Actions) running `npm run check` + build
- Implement AI-assisted summaries of shift logs

### Lighthouse PWA Audit Checklist
Use Chrome DevTools Lighthouse (Progressive Web App category). Aim for green across installability & offline readiness.

Core (Installable)
- Manifest contains: name, short_name, start_url='/', display='standalone', theme_color, background_color, icons (192/512).
- `<link rel="manifest" href="/manifest.json" />` present (see `layout.tsx`).
- Icons served with 200 status and correct MIME type.

Service Worker / Offline
- Service worker registers without error (open DevTools > Application > Service Workers).
- Precaches core shell assets (see `sw.js` PRECACHE_URLS) including `/offline.html`.
- Provides offline fallback (navigate after toggling offline; offline page should appear, no network errors for root HTML).
- Version bump (VERSION constant) triggers new service worker and old cache cleanup.

Performance / Fast First Load
- Largest Contentful Paint (LCP) under ~2.5s on mid-tier mobile (test throttled). Consider pruning unused JS if high.
- Avoid large unused polyfills (Next + modern target helps by default).

Best Practices
- No console errors in production build.
- All resources served via HTTPS.
- Images have explicit dimensions (only applicable if adding dynamic images later).

Accessibility (helps overall score)
- Sufficient color contrast (Tailwind tokens should be verified with Lighthouse).
- Interactive elements keyboard accessible (Radix + buttons already assist).

SEO (bonus for store-like presence)
- `<meta name="description">` present (in `layout.tsx`).
- Descriptive title tag (set in head; can be per-page later using metadata API).

Testing Steps
1. Run `npm run build && npm start`.
2. Open Chrome: Audits/ Lighthouse > Mode: Navigation, Categories: PWA + Performance + A11y.
3. Run with mobile emulation + clear storage each run.
4. Toggle offline and reload root to confirm offline fallback.

If a specific Lighthouse audit fails, note the audit ID and adjust either `manifest.json`, `sw.js`, or markup accordingly. Ask for help if you want automated CI Lighthouse checks.

### License
Add a license file if distributing.

