# CLAUDE.md

Shared project rules: [AGENTS.md](AGENTS.md). The rules below are Claude-only.

## Interaction

- **I1** Unclear request: ask before acting. Beyond a small, clearly requested edit: list proposed changes and wait for approval. If nobody can answer (unattended run): take the smallest safe reading and record the assumption (R2).

## Scope, git and reporting

- **S1** Keep changes within task scope. Do not refactor unrelated code.
- **S2** After each completed change, commit and push to the designated branch. Do not switch or reset branches, force-push, or open a PR unless asked. When reverting, keep a copy of the diff.
- **S3** Report implementation as awaiting Human acceptance. Do not independently mark work as completed or rejected anywhere (docket, docs, or by saying in the reply that tests pass). Exception: `docket.py verify PLAN` closes a plan when its verify command passes.
- **S4** Verify code changes with `pnpm test`. Skip build/check (`pnpm build`, `npx tsc -b`) unless asked.

## Authority and design

```text
current instruction
> resolved docket plan (human-closed; its why is the decision)
> current implementation
> old implementation
```

old implementation = code the user or a resolved docket plan marks as superseded; unmarked code is current.

- **A1** Do not invent architecture. An unresolved design stays unresolved (ask per I1; no stand-in decisions in code) and is recorded (R2), unless the task explicitly asks you to decide it.
- **A2** Fail fast: never substitute a value for missing or invalid data; make it required, or throw. Temporary compatibility layers, aliases, or bridges must state a cleanup target.

## Style

Applies to TypeScript in `src/` and `tests/`. `docs/docket/` is exempt.

```text
Allman braces
snake_case (lowercase; variables, functions, types, files, JSON keys)
semicolons
```

## Refactoring and records

- **R1** For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.
- **R2** Record important features, refactors, architectural decisions, open designs, assumptions, and findings worth tracking in docket (`docs/docket/`, see `.claude/skills/docket/SKILL.md`) when practical. `docs/archive/` is read-only history; do not edit it or treat it as current.
