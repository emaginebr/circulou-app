/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', 'coverage', 'public'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['react-refresh', 'react', 'react-hooks', '@typescript-eslint'],
  rules: {
    'react-refresh/only-export-components': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
    'arrow-body-style': ['warn', 'as-needed'],
    camelcase: ['error', { properties: 'never', ignoreImports: true }],
    'new-cap': ['error', { capIsNew: false, newIsCap: true }],
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
