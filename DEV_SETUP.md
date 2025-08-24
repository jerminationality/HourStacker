Developer setup for HourStacker (Next.js + React)

This file documents the minimal steps to get this project running locally on Windows (PowerShell).

Prerequisites
- Node.js (recommended: 18.x or 20.x LTS). Install from the official installer and make sure `node` and `npm` are on your PATH.
- A terminal (PowerShell is used below).
- Optional: a Node version manager (nvm for Windows) if you manage multiple Node versions.

Quick start (PowerShell)

1. Open PowerShell and change to the project folder:

```powershell
cd 'C:\Users\General\Apps\HourStacker\HourStacker'
```

2. Install dependencies (use `npm ci` in CI, `npm install` for local dev):

```powershell
npm install
```

3. Start the development server:

```powershell
npm run dev
```

Notes
- If you see an error like "'node' is not recognized...", Node is not installed or not on your PATH. Reinstall Node and ensure the installer adds it to PATH or configure your shell.
- This project uses `next dev --turbopack` by default. If Turbopack fails on your machine, try running `npx next dev` or edit `package.json` `dev` script to `next dev`.

Useful scripts (from `package.json`)
- `npm run dev` — start dev server (Turbopack)
- `npm run build` — production build
- `npm run start` — start built app
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type check
- `npm run format` — Prettier

Environment variables
- `.env` files are ignored by git (`.gitignore` contains `.env*`). If the app requires secrets, create a `.env.local` file in the project root and add values there.

Troubleshooting
- If installs fail with native module errors, ensure you have a build toolchain (Windows: install "Build Tools for Visual Studio" or use the Windows SDK). Most web-only dependencies don't require it.
- If `npm run dev` errors on Node version, switch Node to 18/20 and retry.

If you want, I can:
- Add an `.nvmrc` or `engines` entry to `package.json` recommending a Node version.
- Run `npm install` in the repo for you (I can't modify your system Node installation). 
- Add a VS Code `devcontainer.json` or `tasks.json` for a reproducible dev environment.

