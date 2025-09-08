Allowed Commands (Execution Allowlist)
=====================================

This project restricts automated command execution to the explicit list below. 
The assistant (GitHub Copilot) should ONLY run these via existing npm scripts or VS Code tasks.

Approved Commands
-----------------

1. npm run lint         – Lint TypeScript/React source (no writes)
2. npm run dev          – Start Next.js dev server (background)
3. npm run -s typecheck – TypeScript type check (silent)
4. npm run build        – Production build
5. flutter clean        – Clean Flutter build artifacts (if/when Flutter subtree exists)
6. flutter test         – Run Flutter test suite

Auto-Run Policy
---------------
The assistant may run the following automatically after making file edits without asking for permission:

* npm run lint
* npm run -s typecheck

If either fails, the assistant should attempt up to two targeted fixes, re-run, then report remaining issues.

Invocation Rules
----------------
* Prefer invoking through VS Code tasks (see .vscode/tasks.json) or `npm run` scripts.
* Do NOT add new shell flags or chain additional commands.
* Do NOT execute arbitrary git/network/data-modifying commands unless added here first.
* Auto-run exceptions: lint & typecheck (see Auto-Run Policy) may trigger immediately post-edit.
* Any request to run a non-allowlisted command must be refused with a brief explanation.

Extending the List
------------------
1. Open a PR adding the command and rationale to this file.
2. Add a matching task in `.vscode/tasks.json` (or an npm script in `package.json`).
3. Merge, then the assistant may begin using it.

Security Notes
--------------
* Lint/typecheck/build are read-only relative to app data.
* Dev server runs with local side effects only.
* Flutter commands are inert if Flutter tooling or project portions are absent.

Last Updated: 2025-09-07
