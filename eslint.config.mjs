// ESLint flat config
import js from '@eslint/js';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';

export default [
  // Ignore generated/build artifacts and dependencies
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/out/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  {
    plugins: {
      'react-hooks': pluginReactHooks,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      // Reduce CI noise: disable import ordering checks
      'import/order': 'off',
      // Console allowed; prefer removing in PRs but do not fail CI
      'no-console': 'off',
      // Rely on TS for unused checks; do not gate CI on these
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Service worker files run in a special global environment (self, caches, fetch, URL, Response, clients)
  {
    files: ['sw.js', 'public/sw.js'],
    languageOptions: {
      globals: {
        self: 'readonly',
        caches: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        clients: 'readonly',
        location: 'readonly',
  console: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  prettier,
];
