import
{
    create_pack_registry,
    build_empty_hook_list,
    space,
    pure_world
} from '@/core_v3';

// ── 1. Initialize ────────────────────────────────────────────────────────────
// Load packs in order and collect hook definitions into an empty hook template.
export const registry = create_pack_registry();

export const hook_template = build_empty_hook_list(registry);

// ── 2. Create World ──────────────────────────────────────────────────────────
// Instantiate worlds with fresh hook slots cloned from the template.
export function create_world(sp: space, id?: string): pure_world
{
    return new pure_world(sp, hook_template, id);
}

// ── 3. Default World Instance ────────────────────────────────────────────────
export const default_space = new space([64, 64, 4]);
export const default_world = create_world(default_space);
