# Agent Instructions

Shared project rules for every agent. Claude-specific rules: [CLAUDE.md](CLAUDE.md).

## 1. Architecture

### 1.1 Dependency and Ownership

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

## 2. Module Boundaries & Imports

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

## 3. Hooks

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

## 4. Pack Lifecycle

Each Pack exposes:

```ts
global_init(registry: core.pack_registry): void;
world_init(target_world?: world.pure_world): void;
```

`global_init` registers static Pack declarations and `world_init`.

`world_init` initializes world-specific state or callbacks.

Packs without world-specific behavior retain an empty `world_init`.

## 5. Domain Rules

### 5.1 2× Grid

Device anchors contain only even coordinates.

A cell anchored at `(x, y, z, ...)` occupies the corresponding length-2 interval on each axis.

A valid face port has exactly one even coordinate and all remaining coordinates odd.

Use the project's position validation utilities rather than implicit coordinate repair.

### 5.2 Object Model

Vertical inheritance represents **is-a** relationships:

```text
device
└── base_device
    └── assembler
```

Capability interfaces represent independent **can-do** properties such as drawing or rotation.

Device-specific drawing behavior remains on the device capability; renderers invoke it polymorphically.

### 5.3 UID

`space.uid` starts from `1`.

## 6. History

Space mutations are represented by `reversible_operation`.

History is a non-linear undo tree.

Undo followed by a new operation creates a new branch.

`jump_to_node` uses the LCA path to transition between history nodes.

History remains independent of Hooks and Pack business logic.

## 7. CLI

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
