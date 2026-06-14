# eslint-rules/ — Custom ESLint Rules

## Purpose

Two custom ESLint rules for code style enforcement.

## Ownership

- `sibling-separator`: enforces blank lines between sibling elements in Vue templates
- `no-html-comments`: disallows HTML comments in Vue templates (use JS comments instead)

## Local Contracts

- Rules registered in `eslint.config.mjs` via Nuxt ESLint config
- Active on every `vue lint` and `vue lint:fix` run

## Work Guidance

- `sibling-separator`: adds visual separation between template sections
- `no-html-comments`: enforces `<!-- -->` → `{/* */}` migration (cleaner Vue style)
- Both rules are project-specific; do not exist in standard ESLint/Vue plugins

## Verification

- Rules verified via `pnpm lint` (runs ESLint with all rules)
