import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

/* eslint-disable */
// Helper function to convert warnings to 'off'
const removeWarnings = (rulesObject) => {
  const result = {};
  for (const [key, value] of Object.entries(rulesObject)) {
    if (Array.isArray(value) && value[0] === 'warn') {
      result[key] = 'off';
    } else if (value === 'warn') {
      result[key] = 'off';
    } else {
      result[key] = value;
    }
  }
  return result;
};
/* eslint-enable */

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '19.0.0' } },
    plugins: {
      react,
      '@typescript-eslint': typescriptPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...typescriptPlugin.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'semi': ['error', 'always'],
      
      // Disable specific warnings from your project
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];