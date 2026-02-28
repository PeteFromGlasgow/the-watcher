import globals from 'globals'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
export default [
  { ignores: ['**/dist/**/*', 'packages/browser/browser/**/*', 'packages/webapp/.nuxt', 'packages/webapp/.output', 'packages/webapp/nuxt.config.ts', 'packages/marketing/.astro', 'packages/marketing/astro.config.mjs'] },
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  stylistic.configs.customize({
    indent: 2,
    semi: false,
    jsx: true,
    commaDangle: 'never'
  }),
  {
    rules: {
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],
      '@stylistic/brace-style': ['error', '1tbs']
    }
  }
]
