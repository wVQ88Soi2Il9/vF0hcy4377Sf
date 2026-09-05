# Project Guidelines

## 1. Collaboration

Follow `coding_agents.md`.

- Architecture-critical decisions belong to the Human.
- Ask rather than infer unresolved architectural intent.
- Distinguish observed facts from inference, recommendations, and Human decisions.
- Preserve uncertainty when the available evidence does not determine an answer.
- Do not force observations into a uniform schema; structure follows evidence.
- Do not expand implementation scope merely because related issues are discovered.

## 2. Plan & QA

`docs/history/` records non-trivial implementation work and its rationale.

- Keep relevant records current during implementation.
- After implementing an item, mark it `pending-review`.
- The implementing Agent must not mark its own work `done` or `rejected`; Human confirmation is required.
- After modifying Plan files, run:

```text
python docs/history/update-head.py
```

`docs/QA/` records architectural discussions, decisions, unresolved questions, rejected alternatives when relevant, and rationale needed to reconstruct intent.

Recording information in Plan or QA does not make it an implementation requirement.

## 3. Code Conventions

- Allman braces.
- Lowercase `snake_case` for variables, functions, types, files, and JSON keys.
- Statements end with `;`.
- Never use implicit `?? 0` dimensional padding.
- `space.uid` starts from `1`.

## 4. Architecture

Dependency direction:

```text
packs → core
```

`src/core/` contains contracts and pure algorithms. It contains no Pack business logic and no global live runtime state.

`src/world.ts` owns runtime state. Each `pure_world` independently owns its space, history, registry, and Hook callbacks.

`src/packs/` contains concrete behavior and data.

No singleton or global runtime store.

Space mutations are represented by `reversible_operation`. History remains independent of Hooks and Pack business logic.

## 5. Module Boundaries

Cross-module imports use only the target module's public `index.ts`.

Use namespace imports across module/Pack boundaries:

```ts
import * as core from '@/core';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import * as world from '@/world';
```

Do not deep-import another module's internal files.

Within the same Pack, named imports are allowed.

## 6. Hooks & Pack Lifecycle

Hook definitions are global static slots. Hook callbacks belong to individual world instances.

Packs expose:

```ts
global_init(registry: core.pack_registry): void;
world_init(target_world?: world.pure_world): void;
```

`global_init` registers static declarations. `world_init` initializes world-specific state or callbacks.

External code must not mutate a world's Hook list directly.

## 7. Domain Invariants

- Device anchors contain only even coordinates.
- A valid face port has exactly one even coordinate and all remaining coordinates odd.
- Use project position-validation utilities rather than implicit coordinate repair.
- Inheritance represents **is-a** relationships; capability interfaces represent independent **can-do** properties.

## 8. CLI

CLI uses space-separated positional arguments.

Do not infer additional CLI syntax or argument semantics from examples alone.

## 9. Tooling

When explicitly asked to commit, stage the intended changes, generate an appropriate commit message, and commit.

Do not run `npx tsc -b` unless explicitly requested.