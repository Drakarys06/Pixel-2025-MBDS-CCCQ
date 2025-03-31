/* eslint-disable */
const js = require('@eslint/js');
const globals = require('globals');
const typescript = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      'eslint.config.js',
    ],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      'no-console': 'warn',
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      ...typescript.configs.recommended.rules,
    },
  },
];
/* eslint-enable */