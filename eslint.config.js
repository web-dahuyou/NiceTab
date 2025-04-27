import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import tsESLint from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsESLint
    },
    plugins: {
      'react-hooks': eslintPluginReactHooks
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn'
    }
  }
];