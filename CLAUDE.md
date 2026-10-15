# CLAUDE.md

Shared project rules: [AGENTS.md](AGENTS.md). The rules below are Claude-only.

## Interaction, scope, git

- Unclear request: ask. Beyond a small, clearly requested edit: list changes and wait for approval. Unattended: take the smallest safe reading and record the assumption in docket.
- Keep changes within task scope. Do not refactor unrelated code.
- Auto commit and push only in a remote-control or cloud session: after each completed change, commit and push to the designated branch. In a local session, commit only when asked. Do not switch or reset branches, force-push, or open a PR unless asked. When reverting, keep a copy of the diff.
- Report work as awaiting Human acceptance; never mark it completed or rejected (docket, docs, or "tests pass"). Exception: `docket.py verify PLAN` closes a plan when its verify command passes.
- Verify code changes with `pnpm test`. Skip build/check (`pnpm build`, `npx tsc -b`) unless asked.

## Authority and design

```text
current instruction
> resolved docket plan (human-closed; its why is the decision)
> current implementation
> old implementation
```

old implementation = code marked superseded by the user or a resolved docket plan; unmarked code is current.

- Do not invent architecture. An unresolved design stays unresolved (ask; no stand-in decisions in code) and is recorded in docket, unless the task explicitly asks you to decide it.
- Fail fast: never substitute a value for missing or invalid data; make it required, or throw. Temporary compatibility layers, aliases, or bridges must state a cleanup target.

## Style

TypeScript in `src/` and `tests/` (`docs/docket/` is exempt): Allman braces, snake_case (lowercase; variables, functions, types, files, JSON keys), semicolons.

## Refactoring and records

- Leave large cross-file renames to Human-managed IDE refactoring; no broad text replacement.
- Record important decisions, open designs, and assumptions in docket (`docs/docket/`, see `.claude/skills/docket/SKILL.md`) when practical. `docs/archive/` is read-only history.
