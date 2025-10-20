import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import tsESLint from '@typescript-eslint/parser';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default [
  {
    files: ['entrypoints/**/*.{js,jsx,ts,tsx}'],
    ignores: ['entrypoints/common/locale/**/*'],
    languageOptions: {
      parser: tsESLint,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      react: eslintPluginReact,
      import: eslintPluginImport,
      prettier: eslintPluginPrettier,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      'react/jsx-uses-react': 'off',
      'react/react-in-jsx-scope': 'off',
      'import/order': 'off',
      'prettier/prettier': 'warn',
    },
  },
];