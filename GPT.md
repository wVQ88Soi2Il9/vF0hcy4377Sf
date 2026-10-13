# GPT / Codex Rules

1. Priority of authority:

```text
current instruction
> resolved QA
> current implementation
> old implementation
```

2. Do not invent architecture. If a design is unresolved, keep it unresolved unless the task explicitly asks you to decide it.

3. When comparing old/new code, prioritize behavior, invariants, ownership, and missing capability. Do not treat intentional renames as major findings.

4. Keep changes within task scope. Do not refactor unrelated code.

5. Preserve project style:

```text
Allman braces
snake_case
semicolons
no implicit zero-padding
avoid unnecessary global state
```

6. Do not silently repair invalid state. Preserve and enforce explicit invariants.

7. `history.ts` must remain independent of hooks and high-level orchestration.

8. Existing code is not automatically correct. Follow resolved architectural intent over legacy structure.

9. Raise major correctness or architectural risks before minor style issues.

10. For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.

11. Report implementation as awaiting Human acceptance. Do not independently mark work as completed or rejected.

12. Record important features, refactors, and architectural decisions in `docs/history/` when practical. Do not proactively read the entire history at the start of every task.

13. Temporary compatibility layers, aliases, or bridges must state a cleanup target so they do not become permanent technical debt.
