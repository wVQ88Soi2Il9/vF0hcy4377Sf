# 0001_202609072345_shirones-ui-api-alignment

- **status:** draft
- **skill:** plan-history v3

## Summary

Align `src/packs/shirones_ui` with the current runtime and pack APIs on `dev/0906`.

The existing UI pack still contains dependencies on APIs and ownership assumptions from the previous architecture. The migration should update those boundaries directly rather than preserve compatibility wrappers for deprecated global APIs.

**Plan Constraints**

- Keep `shirones_ui` as a UI pack; do not move runtime/domain ownership into it.
- Prefer current `pure_world`, registry, hook, history, and pack APIs over compatibility adapters.
- Preserve existing UI behavior and layout unless an API mismatch requires structural change.
- Separate global UI lifetime from world-specific bindings where applicable.
- Do not redesign unrelated renderer, camera, or core APIs as part of this migration.

## Proposed Changes

1. Audit `shirones_ui` and identify every dependency on removed or renamed core/pack APIs.
2. Update pack initialization to the current `global_init` / `world_init` lifecycle.
3. Replace global world/history/device access with explicit current-world bindings.
4. Migrate UI refresh paths from legacy callbacks to the current per-world hook system.
5. Align history UI with the current history tree and `reversible_operation` APIs.
6. Align device creation, device inspection, CLI, viewport, and history navigation components with the current world API.
7. Verify renderer/camera integration and define the minimum binding required by `shirones_ui`.
8. Remove obsolete compatibility code and stale imports after all consumers are migrated.
9. Build and manually verify the complete UI against at least one `pure_world`.

## Observations & Inferences

### O1 · 2026-09-07 23:45:00+08:00 — Plan-history corpus is empty

`docs/plan-history/head.md` currently reports no plans and no open items.

Inference: this migration should allocate sequence `0001`; there is no previous plan to reference.

### O2 · 2026-09-07 23:45:00+08:00 — Current runtime uses per-world state

The current architecture centers runtime state around `pure_world`, with world-local space, history, registry access, and hook state.

Inference: `shirones_ui` should bind to a world explicitly rather than recover the active state through deprecated global getters.

### O3 · 2026-09-07 23:45:00+08:00 — UI lifetime and world lifetime are distinct

`shirones_ui` contains DOM/layout responsibilities that do not inherently need to be recreated for every world, while displayed data and callbacks depend on a specific world.

Inference: retain global UI construction where possible and make world-dependent behavior explicitly rebindable.

## Tasks

### 1 Audit legacy API dependencies

- **state:** todo
- **basis:** → O2

Inspect all files under `src/packs/shirones_ui`.

Record usages of removed, renamed, or ownership-incompatible APIs, especially:

- global world/space getters;
- legacy history types and functions;
- legacy device-change callbacks;
- old pack initialization entry points;
- renderer/camera assumptions;
- direct imports from packs whose public API has changed.

The result should determine the actual migration surface before implementation.

**History**

- H1 · 2026-09-07 decision —— Migrate against current APIs instead of introducing compatibility wrappers (human: user)

### 2 Align pack lifecycle

- **state:** todo
- **needs:** 0001#1
- **basis:** → O2, O3

Update `shirones_ui` initialization to the current pack lifecycle.

Global-only work such as DOM/layout creation should happen once. World-dependent setup should receive or bind the target `pure_world`.

Avoid recreating the full UI tree merely because a new world is created unless the current pack contract strictly requires it.

Acceptance criteria:

- no legacy `init_pack` dependency remains;
- UI initialization follows the current pack module contract;
- world-specific state can be identified explicitly.

**History**

- H1 · 2026-09-07 decision —— Treat UI lifetime and world binding as separate concerns (agent: gpt-5.6-sol)

### 3 Replace legacy world access

- **state:** todo
- **needs:** 0001#2
- **basis:** → O2, O3

Remove dependencies on deprecated global accessors such as global map/world/history getters.

Introduce the smallest explicit world-binding mechanism needed by the UI components.

Components that operate on devices, history, commands, or space must derive those objects from the bound `pure_world`.

Do not create a second authoritative world singleton inside `shirones_ui`.

**History**

- H1 · 2026-09-07 decision —— World-dependent UI reads and operations must originate from the bound world (agent: gpt-5.6-sol)

### 4 Migrate UI refresh hooks

- **state:** todo
- **needs:** 0001#3
- **basis:** → O2

Replace legacy change listeners with the current world hook mechanism.

Bind only the callbacks required to refresh affected UI sections. Ensure callbacks from a previously bound world cannot continue mutating the currently displayed UI after a world switch.

Acceptance criteria:

- device/history-related UI refreshes after their corresponding operations;
- stale world callbacks are detached or otherwise unable to affect active UI;
- hook ownership remains in the world architecture rather than in global compatibility state.

**History**

- H1 · 2026-09-07 decision —— Use current per-world hooks for UI synchronization (agent: gpt-5.6-sol)

### 5 Align history UI

- **state:** todo
- **needs:** 0001#3
- **basis:** → O2

Migrate `history_tree_panel` and history navigation code to the current history representation.

Replace legacy history node/tree/command names and global history functions with the current tree, `reversible_operation`, and world/history APIs.

Preserve existing history UI behavior where the current runtime still supports it.

Do not add history-specific compatibility abstractions solely to preserve old `shirones_ui` code.

**History**

- H1 · 2026-09-07 decision —— History UI follows the current history API directly (agent: gpt-5.6-sol)

### 6 Align device and CLI components

- **state:** todo
- **needs:** 0001#3
- **basis:** → O2

Update device creation, device inspection, device card, CLI panel, and related controls to operate on the bound world and current registry/API types.

Confirm argument and return-value changes instead of performing mechanical symbol renames.

Acceptance criteria:

- device creation reaches the current world operation path;
- displayed device data comes from current world state;
- CLI execution targets the correct world;
- no stale legacy types remain in these components.

**History**

- H1 · 2026-09-07 decision —— API migration must preserve semantics, not only rename symbols (agent: gpt-5.6-sol)

### 7 Verify renderer and camera boundary

- **state:** todo
- **needs:** 0001#3
- **basis:** → O3

Inspect how `shirones_ui` mounts or controls renderer and camera components.

Keep renderer/camera ownership unchanged unless the current APIs require a binding adjustment.

Define explicitly which state is:

- UI-global;
- renderer/camera-global;
- world-specific.

Avoid expanding this task into a renderer or camera redesign.

**History**

- H1 · 2026-09-07 decision —— Limit renderer/camera work to compatibility required by the UI migration (agent: gpt-5.6-sol)

### 8 Remove obsolete migration residue

- **state:** todo
- **needs:** 0001#4, 0001#5, 0001#6, 0001#7
- **basis:** → O2

After all consumers use current APIs, remove:

- obsolete imports;
- unused legacy types;
- compatibility code made unnecessary by the migration;
- duplicate world/history state held only for old architecture support.

Do not perform unrelated cleanup.

**History**

- H1 · 2026-09-07 decision —— Cleanup is limited to residue created obsolete by this migration (agent: gpt-5.6-sol)

### 9 Verify integrated shirones_ui

- **state:** todo
- **needs:** 0001#8
- **basis:** → O2, O3

Run the project build/type checks and manually exercise the relevant UI paths.

Verify at minimum:

- UI initializes successfully;
- a world can be displayed;
- device create/delete/move-related UI remains synchronized;
- history navigation and history display use current state;
- renderer viewport remains functional;
- CLI actions target the intended world;
- creating or binding another world does not duplicate global UI or leave stale callbacks active.

After implementation and verification by the agent, set this item and all landed implementation items to `pending-review`, not `done`.

**History**

- H1 · 2026-09-07 decision —— Final acceptance remains human-controlled under plan-history v3 (human: user)