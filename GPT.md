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
lowercase snake_case for variables, functions, types, files, and JSON keys
statements end with semicolons
never use implicit ?? 0 dimensional padding
space UID allocation starts from 1
avoid unnecessary global state
```

7. Do not silently repair invalid state. Preserve and enforce explicit invariants.

8. `history.ts` must remain independent of hooks and high-level orchestration.

9. Existing code is not automatically correct. Follow resolved architectural intent over legacy structure.

10. Raise major correctness or architectural risks before minor style issues.

11. For large cross-file symbol, type, variable, function, or file renames, prefer Human-managed IDE semantic refactoring. Do not initiate broad text replacement.

12. Report implementation as awaiting Human acceptance. Do not independently mark work as completed or rejected.

13. Record important features, refactors, and architectural decisions in `docs/history/` when practical. Do not proactively read the entire history at the start of every task.

14. Temporary compatibility layers, aliases, or bridges must state a cleanup target so they do not become permanent technical debt.

15. Normalize Markdown-escaped identifiers and paths in Human messages before resolving them. In particular, interpret `\_` as `_` (for example, `basic\_ui` means `basic_ui`) while preserving backslashes that are actual Windows path separators.

## Architecture

Dependency direction:

```text
packs → core
```

`src/core/` contains contracts and pure algorithms. It contains no Pack business logic and no global live runtime state.

`src/world.ts` owns runtime state. Each `pure_world` independently owns its space, history, registry, and Hook callbacks.

`src/packs/` contains concrete behavior and data.

No singleton or global runtime store.

Space mutations are represented by `reversible_operation`. History remains independent of Hooks and Pack business logic.

## Module Boundaries

Cross-module imports use only the target module's public `index.ts`.

Use namespace imports across module/Pack boundaries:

```ts
import * as core from '@/core';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import * as world from '@/world';
```

Do not deep-import another module's internal files.

Within the same Pack, named imports are allowed.

## Hooks & Pack Lifecycle

Hook definitions are global static slots. Hook callbacks belong to individual world instances.

Packs expose:

```ts
global_init(registry: core.pack_registry): void;
world_init(target_world?: world.pure_world): void;
```

`global_init` registers static declarations. `world_init` initializes world-specific state or callbacks.

External code must not mutate a world's Hook list directly.
