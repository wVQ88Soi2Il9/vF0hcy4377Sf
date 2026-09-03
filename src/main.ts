import
{
    create_pack_registry,
    build_empty_hook_list
} from '@/core_v3';

// ── 1. Initialize ────────────────────────────────────────────────────────────
// Load packs in order and collect hook definitions into an empty hook template.
export const registry = create_pack_registry();

export const hook_template = build_empty_hook_list(registry);
