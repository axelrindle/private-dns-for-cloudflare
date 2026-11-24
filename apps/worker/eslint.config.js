import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import stylistic from '@stylistic/eslint-plugin'
import gitignore from 'eslint-config-flat-gitignore'

export default defineConfig(
  gitignore(),
  tseslint.configs.strictTypeCheckedOnly,
  {
    name: 'app/typescript',
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  {
    ...stylistic.configs.recommended,
    name: 'stylistic/recommended',
  },
  {
    name: 'app/style',
    plugins: {
      '@stylistic': stylistic,
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
    },
  },
)
