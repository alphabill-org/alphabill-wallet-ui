import eslint from "@eslint/js";
import eslintImport from "eslint-plugin-import";
import eslintConfigPrettier from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tsEslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  eslintConfigPrettier,
  eslintImport.flatConfigs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "import/no-unresolved": "off",
      "require-await": "error",
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: ["interface"],
          format: ["PascalCase"],
          custom: {
            regex: "^I[A-Z]",
            match: true,
          },
        },
        {
          selector: ["method"],
          format: ["camelCase"],
          modifiers: ["static"],
        },
        {
          selector: ["variable"],
          format: ["UPPER_CASE"],
          modifiers: ["static", "readonly"],
        },
      ],
      "@typescript-eslint/member-ordering": "error",
      "import/order": ["error", { alphabetize: { order: "asc", caseInsensitive: true } }],
    },
  },
  {
    files: ["*.ts", "*.mts", "*.cts", "*.tsx"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
    },
  },
  {
    ignores: ["lib/**/*"],
  },
];
