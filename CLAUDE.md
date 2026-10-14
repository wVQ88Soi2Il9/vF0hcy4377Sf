# CLAUDE.md

Shared project rules: [AGENTS.md](AGENTS.md). The rules below are Claude-only.

## Interaction

- **I1** Unclear request: ask before acting. Beyond a small, clearly requested edit: list proposed changes and wait for approval. If nobody can answer (unattended run): take the smallest safe reading and record the assumption (R2).

## Scope, git and reporting

- **S1** Keep changes within task scope. Do not refactor unrelated code. Findings and cleanups are reported in the reply, not applied; if one blocks the task, stop.
- **S2** After each completed change, commit and push to the designated branch. Do not switch or reset branches, force-push, or open a PR unless asked.
- **S3** When reverting, say exactly what was reverted and keep a copy of the diff so individual items can be re-applied.
- **S4** Report implementation as awaiting Human acceptance (Human = the user in this conversation). Do not independently mark work as completed or rejected anywhere (docket, docs, or by saying in the reply that tests pass). Exception: `docket.py verify PLAN` closes a plan when its verify command passes; report plan id, command, result in the same reply.
- **S5** Verify code changes with `pnpm test`. Skip build/check (`pnpm build`, `npx tsc -b`) unless asked.

## Authority and design

```text
current instruction
> resolved docket plan (human-closed; its why is the decision)
> current implementation
> old implementation
```

Existing code is not automatically correct. old implementation = code the user or a resolved docket plan marks as superseded; unmarked code is current.

- **A1** Do not invent architecture. An unresolved design stays unresolved (ask per I1; no stand-in decisions in code) and is recorded (R2), unless the task explicitly asks you to decide it.
- **A3** Fail fast: never substitute a value for missing or invalid data (?? x, || x, padding, default branches); make it required, or throw. Enforce explicit invariants.
- **A4** Temporary compatibility layers, aliases, or bridges must state a cleanup target so they do not become permanent technical debt.

## Reviewing

- **V1** Raise major correctness or architectural risks before minor style issues. When comparing old/new code, prioritize behavior, invariants, ownership, and missing capability; do not treat intentional renames as major findings.

## Style

Applies to TypeScript in `src/` and `tests/`. `docs/docket/` is exempt.

```text
Allman braces
snake_case (lowercase; variables, functions, types, files, JSON keys)
semicolons
avoid unnecessary global state
```

## Refactoring and records

- **R1** For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.
- **R2** Record important features, refactors, architectural decisions, open designs, assumptions, and findings worth tracking in docket (`docs/docket/`, see `.claude/skills/docket/SKILL.md`) when practical (see the skill for how to read it).
- **R3** `docs/archive/` is read-only history; do not edit it or treat it as current.
