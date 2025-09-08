#!/usr/bin/env node
/* eslint-env node */
// Runs next dev/build with NEXT_PUBLIC_SW_VERSION set to the current git commit SHA.
import { execSync, spawn } from 'node:child_process';
import process from 'node:process';

const mode = process.argv[2];
if (!['dev', 'build'].includes(mode)) {
  process.stderr.write('Usage: node scripts/run-with-sw-version.mjs <dev|build> [extra args...]\n');
  process.exit(1);
}

function getGitSha() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    return sha || String(Date.now());
  } catch {
    return String(Date.now());
  }
}

const sha = getGitSha();
process.env.NEXT_PUBLIC_SW_VERSION = sha;

const extraArgs = process.argv.slice(3);
const cmd = mode === 'dev' ? 'next' : 'next';
const args = mode === 'dev' ? ['dev', '--turbopack', ...extraArgs] : ['build', ...extraArgs];

const child = spawn(cmd, args, { stdio: 'inherit', env: process.env, shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
