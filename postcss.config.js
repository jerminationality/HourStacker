/* eslint-env node */
/* eslint-disable no-undef, @typescript-eslint/no-require-imports */
// CommonJS PostCSS config to ensure Next.js detects `plugins` key correctly.
// Keep minimal to avoid mis-loading ESM default.
module.exports = {
  plugins: [
    require('tailwindcss'),
  ],
};
