import eslint from '@eslint/js';
import eslintTypescript from 'typescript-eslint';

export default [
  {
    files: ["public/background.js"],
    languageOptions: {
      globals: {
        chrome: "readonly"
      }
    }
  },
  eslint.configs.recommended,
  ...eslintTypescript.configs.strict,
]