# 0001_202609070009_port-shirones-ui-per-world

- **status:** draft
- **prev:** none
- **skill:** plan-history v3

## Summary

Port origin/master src/packs/shirones_ui into current branch as a per-world UI without global singleton compatibility layers.

**Plan Constraints**

- All UI instances, listeners, and renderer bindings belong to individual pure_world instances.
- Zero global singletons for world, map, or registry.
- Strict Allman braces, snake_case, semicolons, and namespace imports.

## Proposed Changes

1. Adapt src/packs/shirones_ui modules to current core and pack contracts:
   - index.ts: global_init registers pack; world_init(target_world) binds UI lifecycle and subscriptions.
   - layout.ts: accepts target_world and wires sub-panels.
   - viewport_panel.ts: integrates camera and basic_renderer using functional render(target_world.space, ...).
   - info_panel.ts, device_card.ts, device_creator.ts: adapt to dev.device_uid, namespaced_id, and vanilla_alpha operations.
   - history_tree_panel.ts, history_navigation.ts: adapt to core.tree, core.node, rev_op, and vanilla_beta history helpers.
   - cli_panel.ts: executes via cli.exe(input, target_world).
2. Register shirones_ui and dependencies in src/main.ts in correct order.
3. Build and verify with Vite.

## Observations & Inferences

### O1 · 2026-09-07 00:09:00+08:00 — Core and Packs Architecture in dev/0906

Factual description: dev/0906 uses pure_world instances owning space, history, registry, and hook callbacks. Device identifiers are device_uid and definition_id is namespaced_id. History nodes use history_uid and rev_op operations. CLI uses cli.exe(input, target_world).

Inference: shirones_ui must accept target_world in its constructors and avoid legacy global getters (get_map, get_registry, execute_command).

## Tasks

### 1 Port shirones_ui to Per-World Architecture

- **state:** in-progress
- **basis:** → O1

Body: Adapt all shirones_ui modules, integrate into bootstrap, and verify.

**History**

- H1 · 2026-09-07 00:09 decision —— Port shirones_ui per-world without legacy singletons (human: wVQ88Soi2Il9)
