---
description: Project architecture and development conventions
trigger: always_on
---

# Project Guidelines & Architecture

## 1. Collaboration Boundaries

Follow `coding_agents.md`.

For this project in particular:

- Architecture-critical decisions belong to the user.
- Ask rather than infer unresolved intent from surrounding repository code.
- keep task state current;
- preserve meaningful observations and rationale;
- record implementation results with appropriate evidence;
- after implementing an item itself, the Agent must not mark that item as `完成` or `否決`;
- `完成` and `否決` require confirmation independent of the Agent's own implementation judgment.

## 2. Plan History

`docs/history/` is the primary Human-Agent task alignment and implementation history.

Except for trivial debugging, record feature development, refactors, new Packs, and API/UI changes.

The Agent maintains relevant Plan records autonomously.

During implementation:

- keep task state current;
- preserve meaningful observations and rationale;
- record implementation results with appropriate evidence;
- after implementation, set the item to `等待確認`;
- Human decides `完成` or `否決`.

After modifying Plan files, run:

```text
python docs/history/update-head.py
```

Plan History is a record of work and decisions. Its existence does not justify expanding implementation scope.

## 3. QA Records

`docs/QA/` preserves architectural discussions, technical questions, requirement clarification, alternatives, and decision rationale.

Prefer preserving useful information over discarding it.

Record:

- questions and answers;
- settled decisions;
- unresolved questions;
- rejected alternatives when the reason may matter later;
- contradictions discovered between specification and implementation;
- rationale needed to reconstruct architectural intent.

Clearly distinguish observations, assumptions, recommendations, unresolved questions, and Human decisions.

QA may be detailed. Documentation volume is not itself a problem.

Recording an idea or alternative does not make it an implementation requirement.

Naming:

```text
docs/QA/<number>-<yymmddhhmm>_<topic>.md
```

Include Human/Agent identity according to the established QA convention.

When the user requests an architectural evaluation with genuinely competing alternatives, present meaningful reasons for and against them. Do not manufacture artificial symmetry when one option is already determined by an invariant or settled requirement.

## 4. Code Conventions

- Allman braces.
- Lowercase `snake_case` for variables, functions, types, files, and JSON keys.
- Statements end with `;`.
- Never use implicit `?? 0` dimensional padding.
- `space.uid` starts from `1`.

## 5. Architecture

### 5.1 Dependency and Ownership

Dependency direction:

```text
packs → core
```

Runtime world ownership resides in `src/world.ts`.

### Core — `src/core/`

Core contains contracts and pure algorithms:

- vectors, UIDs, namespaced IDs;
- Hook slot types;
- `device` and `space`;
- item and recipe contracts;
- `reversible_operation`;
- `pack_module`;
- `pack_registry`;
- history / undo-tree algorithms.

Core contains:

- no business logic;
- no global live runtime state.

Public entrypoint:

```ts
@/core
```

### World — `src/world.ts`

`pure_world` owns runtime state:

- `space: core.space`;
- `history: core.tree`;
- `registry: core.pack_registry`;
- `current_hook: core.hook_list`.

World instances have independent runtime state and Hook callbacks.

`pure_world` provides world-level Hook injection and triggering.

No singleton or global runtime store.

### Packs — `src/packs/`

Packs contain concrete:

- game rules;
- rendering;
- UI;
- camera;
- CLI;
- data.

Each Pack exposes its public API through `index.ts`.

Responsibilities:

- `cli`: text parsing and Core Registry command dispatch;
- `basic_ui`: layout, panels, and UI state rendering;
- `camera`: camera state, viewport control, projection, and camera CLI;
- `basic_renderer`: 2D projection and device/port rendering.

## 6. Module Boundaries & Imports

Cross-module imports use only the target module's public `index.ts`.

Use namespace imports across module/Pack boundaries:

```ts
import * as core from '@/core';
import * as vanilla_alpha from '@/packs/vanilla_alpha';
import * as world from '@/world';
```

Do not deep-import another module's internal files.

Within the same Pack, named imports are allowed.

Pack `index.ts` aggregates internal exports directly:

```ts
export * from './...';
```

Do not introduce redundant wrapper namespace objects.

## 7. Hooks

Hook definitions are global static slots declared by Packs during `global_init`.

Hook callbacks belong to individual world instances.

Callbacks are injected during `world_init` or runtime through:

```ts
target_world.inject_hook(...);
```

Hooks are triggered through:

```ts
target_world.trigger(...);
```

External code must not mutate `current_hook` directly.

## 8. Pack Lifecycle

Each Pack exposes:

```ts
global_init(registry: core.pack_registry): void;
world_init(target_world?: world.pure_world): void;
```

`global_init` registers static Pack declarations and `world_init`.

`world_init` initializes world-specific state or callbacks.

Packs without world-specific behavior retain an empty `world_init`.

## 9. Domain Rules

### 9.1 2× Grid

Device anchors contain only even coordinates.

A cell anchored at `(x, y, z, ...)` occupies the corresponding length-2 interval on each axis.

A valid face port has exactly one even coordinate and all remaining coordinates odd.

Use the project's position validation utilities rather than implicit coordinate repair.

### 9.2 Object Model

Vertical inheritance represents **is-a** relationships:

```text
device
└── base_device
    └── assembler
```

Capability interfaces represent independent **can-do** properties such as drawing or rotation.

Device-specific drawing behavior remains on the device capability; renderers invoke it polymorphically.

## 10. History

Space mutations are represented by `reversible_operation`.

History is a non-linear undo tree.

Undo followed by a new operation creates a new branch.

`jump_to_node` uses the LCA path to transition between history nodes.

History remains independent of Hooks and Pack business logic.

## 11. CLI

CLI uses space-separated positional arguments.

Example:

```text
create_device conveyor 4 4 0
```

Camera slice arguments use:

```text
d<n>=<val>
```

Aliases belong to individual Packs. Core/history navigation does not define aliases.

## 12. Tooling

When explicitly asked to perform a Git commit:

1. stage the intended changes;
2. generate an appropriate commit message;
3. commit.

Do not run `npx tsc -b` unless explicitly requested.