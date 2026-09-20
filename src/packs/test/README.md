# Test pack

Ported from the repository's `master/src/packs/test` to the current Core contracts.

- Devices: assembler, belt, merger, splitter, irregular_3d, pipe.
- Recipes: advanced_circuit, iron_gear.
- `global_init(registry)` registers the pack.

The old pack depended on removed `layered_2d`, `vanilla`, global `world.get_map()`, and the former canvas renderer. Device shapes, ports, IDs, colors, and default pipe path are preserved using the current `core.device` and HTML renderer contracts.

The current recipe contract returns outputs from `evaluate(device_uid)` but does not provide a world or device lookup. Therefore the old assembler-only and altitude-dependent evaluation rules cannot be represented here; both recipes expose their output using the current contract.

`test:pipe` uses its default path when created through the generic UI. A custom path can still be supplied through `other_info.segments` by callers that construct the operation directly. The test pack has no dependency on a particular UI pack.
