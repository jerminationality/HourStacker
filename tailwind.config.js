/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */
// Re-export TS config so build tools that only look for .js pick it up.
const tsConfig = require('./tailwind.config.ts').default;
module.exports = tsConfig;
