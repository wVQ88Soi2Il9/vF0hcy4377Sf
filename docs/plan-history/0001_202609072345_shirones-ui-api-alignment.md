# 0001_202609072345_shirones-ui-api-alignment

- **status:** draft
- **prev:** none
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

### O4 · 2026-09-08 12:00:00+08:00 — Audit found a complete legacy boundary in `shirones_ui`

The current `shirones_ui` entry point still exposes `init_pack()` and imports the removed global `get_map()` and `on_device_change()` APIs. Its child components additionally depend on global world command/history access, legacy history types, `@/packs/vanilla`, `@/packs/cli_tool`, and pack-object imports such as `basic_ui` and `basic_renderer` that are not exported by the current pack indexes.

The current runtime boundary is `pure_world` (`space`, `history`, `registry`, and `current_hook`), while the current pack lifecycle is exposed by `global_init(registry)` and `world_init(target_world)`. The current build fails in the audited UI surface before runtime verification, with errors spanning `cli_panel.ts`, `device_card.ts`, `device_creator.ts`, `history_navigation.ts`, `history_tree_panel.ts`, and `index.ts`.

Inference: the first implementation slice should establish an explicit `pure_world` binding and current lifecycle entry points at `shirones_ui/index.ts`; child components should then be migrated against that binding in later slices. The audit does not justify compatibility wrappers or a renderer/core redesign.

### O5 · 2026-09-08 12:00:00+08:00 — Lifecycle boundary is now explicit at the UI pack entry point

`shirones_ui/index.ts` now exposes `global_init(registry)` and registers a pack module with `world_init(target_world)`. The former `init_pack()` entry point and the invalid UI-specific fields on the `pack_module` object were removed. `world_init` records the bound `pure_world` without constructing a global UI tree; UI factories remain separately exported.

The focused build no longer reports syntax or type errors in `shirones_ui/index.ts`. The build still fails in child components on the legacy imports and symbols recorded by O4.

Inference: the pack lifecycle can proceed independently from world-bound component migration; later items can consume `get_bound_world()` while preserving a single UI construction path.

## Tasks

### 1 Audit legacy API dependencies

- **state:** pending-review
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

Audit result:

- `index.ts`: legacy `init_pack()`, global `get_map()`, and global `on_device_change()`; renderer and basic UI are imported as pack objects rather than current public APIs.
- `device_card.ts` and `device_creator.ts`: removed global world command/registry access, removed `move_device_command`/`delete_device_command`/`select_recipe_command` exports, and stale `@/packs/vanilla` imports.
- `history_navigation.ts`, `history_tree_panel.ts`, and `info_panel.ts`: legacy `history_tree`/`history_node`/`map_command` types and global history callbacks/actions; current runtime exposes `tree`, `node`, `rev_op`, and world-owned history.
- `cli_panel.ts`: stale `@/packs/cli_tool` import and stale `basic_ui` pack-object import.
- `device_creator.ts` and `index.ts`: stale `basic_renderer` pack-object imports and global map assumptions.
- `layout.ts`, `viewport_panel.ts`, and CSS files are primarily structural; renderer/camera ownership should remain outside this audit slice.

The first cheap discriminating check is `pnpm build`; it currently fails on the above stale imports and symbols, confirming the migration surface before implementation.

**History**

- H1 · 2026-09-07 decision —— Migrate against current APIs instead of introducing compatibility wrappers (human: user)
- H2 · 2026-09-08 landed —— Audit completed; implementation must begin with explicit world binding and lifecycle alignment (agent: gpt-5.6-sol)

### 2 Align pack lifecycle

- **state:** pending-review
- **needs:** 0001#1
- **basis:** → O2, O3

Update `shirones_ui` initialization to the current pack lifecycle.

Global-only work such as DOM/layout creation should happen once. World-dependent setup should receive or bind the target `pure_world`.

Avoid recreating the full UI tree merely because a new world is created unless the current pack contract strictly requires it.

Acceptance criteria:

- no legacy `init_pack` dependency remains;
- UI initialization follows the current pack module contract;
- world-specific state can be identified explicitly.

Landed result:

- `global_init(registry)` registers `shirones_ui` using the current pack module contract.
- `world_init(target_world)` records the explicit world binding exposed by `get_bound_world()`.
- Legacy `init_pack()` and the old UI-specific pack object fields were removed.
- UI factories remain independently exportable and are not invoked by global registration.

**History**

- H1 · 2026-09-07 decision —— Treat UI lifetime and world binding as separate concerns (agent: gpt-5.6-sol)
- H2 · 2026-09-08 landed —— Added current pack lifecycle and explicit world binding; focused build leaves only downstream legacy API errors (agent: gpt-5.6-sol)

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