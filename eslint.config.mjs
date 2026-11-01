import js from '@eslint/js'
import prettier from 'eslint-config-prettier/flat'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['node_modules', 'build', 'coverage', 'prettier.config.js', 'eslint.config.mjs'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/react-in-jsx-scope': 'off',
      camelcase: 'error',
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
      quotes: ['error', 'single'],
      'no-duplicate-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
]
