const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const reactHooks = require('eslint-plugin-react-hooks');

module.exports = [
  // Ignore common build and dependency folders
  { ignores: ['node_modules/**', '.next/**', 'dist/**', '.wrangler/**'] },

  // TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { '@typescript-eslint': tsPlugin, 'react-hooks': reactHooks },
    rules: {
      // Start from the plugin recommended ruleset. Individual rules
      // will be tuned after running the linter.
      ...tsPlugin.configs.recommended.rules,
      // Temporary: disable rules that are noisy or cause runtime/plugin issues
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',
      '@typescript-eslint/no-explicit-any': 'off',      '@typescript-eslint.no-var-requires': 'off',      '@typescript-eslint.no-require-imports': 'off',
      'react-hooks/exhaustive-deps': 'off',
      // Relax unused-vars to warnings and ignore names starting with _
      '@typescript-eslint/no-unused-vars': ['warn', { 'varsIgnorePattern': '^_', 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // JavaScript files (basic recommended rules)
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {},
  },
];
