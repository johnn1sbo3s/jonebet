# Agent Notes

## Verification after edits

**Do NOT run `npx eslint`, `npx prettier --check`, or `pnpm build` after every edit.** Those are slow and noisy. They run automatically via `husky` + `lint-staged` on commit.

How to verify changes:
- The user runs `pnpm run dev` in their own terminal and checks the browser.
- Unit tests: run `pnpm test:unit` only when the change might affect test behavior, or when the plan/task explicitly asks for it.

When a subagent implementation finishes a task, the subagent's self-report (DONE / DONE_WITH_CONCERNS / BLOCKED) is enough — no need to re-run the full lint/test suite from the controller.
