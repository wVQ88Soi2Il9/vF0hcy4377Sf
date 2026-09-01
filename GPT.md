# GPT / Codex Rules

1. Read relevant `docs/QA/`, README, and surrounding code before modifying architecture.

2. Priority of authority:

```text
current instruction
> resolved QA
> current implementation
> old implementation
```

3. Do not invent architecture. If a design is unresolved, keep it unresolved unless the task explicitly asks you to decide it.

4. When comparing old/new code, prioritize behavior, invariants, ownership, and missing capability. Do not treat intentional renames as major findings.

5. Keep changes within task scope. Do not refactor unrelated code.

6. Preserve project style:

```text
Allman braces
snake_case
semicolons
no implicit zero-padding
avoid unnecessary global state
```

7. Do not silently repair invalid state. Preserve and enforce explicit invariants.

8. `history.ts` must remain independent of hooks and high-level orchestration.

9. Existing code is not automatically correct. Follow resolved architectural intent over legacy structure.

10. Raise major correctness or architectural risks before minor style issues.
