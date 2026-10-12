# CLAUDE.md

Project instructions live in [AGENTS.md](AGENTS.md). The rules below apply to Claude and are aligned with [GPT.md](GPT.md).

## Working style

1. If a request is not clear, ask before acting. State the most likely reading and let the user confirm.
2. For anything beyond a small, clearly requested edit, list the proposed changes first and wait for approval.
3. Keep changes within task scope. Do not refactor unrelated code. Findings and cleanups are reported, not applied.
4. Never commit, push, or switch/reset branches unless asked.
5. When reverting, say exactly what was reverted and keep a copy of the diff so individual items can be re-applied.
6. Report implementation as awaiting Human acceptance. Do not independently mark work as completed or rejected.

## Authority and design

1. Read the relevant `docs/QA/`, README, and surrounding code before modifying architecture.
2. Priority of authority:

```text
current instruction
> resolved QA
> current implementation
> old implementation
```

3. Do not invent architecture. If a design is unresolved, keep it unresolved unless the task explicitly asks you to decide it.
4. Existing code is not automatically correct. Follow resolved architectural intent over legacy structure.
5. Do not silently repair invalid state. Preserve and enforce explicit invariants.
6. `history.ts` must remain independent of hooks and high-level orchestration.
7. Temporary compatibility layers, aliases, or bridges must state a cleanup target so they do not become permanent technical debt.

## Reviewing

- When comparing old/new code, prioritize behavior, invariants, ownership, and missing capability. Do not treat intentional renames as major findings.
- Raise major correctness or architectural risks before minor style issues.

## Style

```text
Allman braces
snake_case
semicolons
no implicit zero-padding
avoid unnecessary global state
```

## Refactoring and records

- For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.
- Record important features, refactors, and architectural decisions in `docs/history/` when practical. Do not proactively read the entire history at the start of every task.
