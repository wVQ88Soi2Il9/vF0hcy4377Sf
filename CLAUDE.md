# CLAUDE.md

Project instructions live in [AGENTS.md](AGENTS.md). The rules below apply to Claude.

## Working style

1. If a request is not clear, ask before acting. State the most likely reading and let the user confirm.
2. For anything beyond a small, clearly requested edit, list the proposed changes first and wait for approval.
3. Keep changes within task scope. Do not refactor unrelated code. Findings and cleanups are reported in the reply (docket plan if worth tracking), not applied; if one blocks the task, stop and report.
4. After each completed change, commit and push to the designated branch. Do not switch or reset branches, force-push, or open a PR unless asked.
5. When reverting, say exactly what was reverted and keep a copy of the diff so individual items can be re-applied.
6. Report implementation as awaiting Human acceptance (Human = the user in this conversation). Do not independently mark work as completed or rejected anywhere (docket, docs); saying in the reply that tests pass is not a mark. Exception: `docket.py verify PLAN` closes a plan when its verify command passes (logic, not your judgment). Tell the user in the same reply: plan id, command, result.
7. Do not run `npx tsc -b` or `pnpm build` (it runs `tsc -b`) unless explicitly asked; it is too slow.
8. If nobody can answer (unattended run), take the smallest safe reading, record the assumption as a docket fact, and do not guess architecture.

## Authority and design

1. Priority of authority:

```text
current instruction
> resolved docket plan (human-closed; its why is the decision)
> current implementation
> old implementation
```

old implementation = code the user or a resolved docket plan marks as superseded; unmarked code is current.

2. Do not invent architecture. If a design is unresolved, ask; until answered keep it unresolved (no stand-in decisions in code) and record it as an open docket plan, unless the task explicitly asks you to decide it.
3. Existing code is not automatically correct. Follow resolved architectural intent over old implementation.
4. Fail fast: never substitute a value for missing or invalid data (?? x, || x, padding, default branches); make it required, or throw. Enforce explicit invariants.
5. `src/core/history.ts` must remain independent of hooks and high-level orchestration.
6. Temporary compatibility layers, aliases, or bridges must state a cleanup target so they do not become permanent technical debt.

## Reviewing

- When comparing old/new code, prioritize behavior, invariants, ownership, and missing capability. Do not treat intentional renames as major findings.
- Raise major correctness or architectural risks before minor style issues.

## Style

Applies to TypeScript in `src/` and `tests/`. `docs/docket/` is exempt.

```text
Allman braces
snake_case (lowercase; variables, functions, types, files, JSON keys)
semicolons
avoid unnecessary global state
```

## Refactoring and records

- For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.
- Record important features, refactors, and architectural decisions in docket (`docs/docket/`, see `.claude/skills/docket/SKILL.md`) when practical. Read it with `docket.py brief`, not in full.
