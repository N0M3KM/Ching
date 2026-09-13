import js from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
 {ignores:['dist/**','node_modules/**','coverage/**','apps/web/dist/**','playwright-report/**','test-results/**']},
 js.configs.recommended,tseslint.configs.recommended,
 {files:['**/*.mjs'],languageOptions:{globals:{URL:'readonly',fetch:'readonly',AbortSignal:'readonly',Buffer:'readonly',console:'readonly',process:'readonly'}}},
 {files:['**/*.ts','**/*.tsx'],rules:{'@typescript-eslint/consistent-type-imports':'error','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_',varsIgnorePattern:'^_'}]}}
);
