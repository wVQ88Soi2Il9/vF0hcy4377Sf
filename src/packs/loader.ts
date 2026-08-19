import type { pack, item_definition, recipe, device_definition } from '@/core/types';
import { register_device_behavior } from '@/API';

// Helper function to resolve ID with namespace
function resolve_id(id: string, ns: string): string
{
    return id.includes(':') ? id : `${ns}:${id}`;
}

/**
 * Loads all packs automatically by scanning the folder structure.
 * 1. JSON files inside packs/[pack]/data/*.json (items, devices)
 * 2. TypeScript recipe modules inside packs/[pack]/recipes/*.ts
 */
export function load_all_packs(): pack[]
{
    // Map to group pack data by namespace
    const namespace_map = new Map<string, pack>();

    function get_or_create_pack(namespace: string): pack
    {
        let p = namespace_map.get(namespace);
        if (!p)
        {
            p = {
                id: namespace,
                items: [],
                recipes: [],
                device_definitions: []
            };
            namespace_map.set(namespace, p);
        }
        return p;
    }

    // 1. Vite's glob import to get all JSON files under packs/*/data/*.json
    const pack_modules = import.meta.glob('./*/data/*.json', { eager: true }) as Record<string, any>;

    for (const path in pack_modules)
    {
        const parts = path.split('/');
        if (parts.length < 4)
        {
            continue;
        }

        const namespace = parts[1];
        const filename = parts[3].replace('.json', '');
        const file_data = pack_modules[path].default;
        const current_pack = get_or_create_pack(namespace);

        if (Array.isArray(file_data))
        {
            if (filename === 'items')
            {
                for (const raw_item of file_data)
                {
                    const full_id = resolve_id(raw_item.id, namespace);
                    current_pack.items.push
                    ({
                        ...raw_item,
                        id: full_id
                    } as item_definition);
                }
            }
            else if (filename === 'devices')
            {
                for (const raw_device of file_data)
                {
                    const full_id = resolve_id(raw_device.id, namespace);

                    const processed_device: device_definition =
                    {
                        ...raw_device,
                        id: full_id,
                        other_info: raw_device.other_info || {}
                    };

                    current_pack.device_definitions.push(processed_device);
                }
            }
        }
    }

    // 2. Vite's glob import to get all dynamic TS recipe files under packs/*/recipes/*.ts
    const recipe_modules = import.meta.glob('./*/recipes/*.ts', { eager: true }) as Record<string, any>;

    for (const path in recipe_modules)
    {
        const parts = path.split('/');
        if (parts.length < 4)
        {
            continue;
        }

        const namespace = parts[1];
        const filename = parts[3].replace('.ts', '');
        const mod = recipe_modules[path];
        const rec_candidate = mod.recipe || mod.default || mod;

        if (rec_candidate && typeof rec_candidate.evaluate === 'function')
        {
            const full_id = resolve_id(rec_candidate.id || filename, namespace);
            const current_pack = get_or_create_pack(namespace);

            const processed_recipe: recipe =
            {
                ...rec_candidate,
                id: full_id,
                evaluate: rec_candidate.evaluate
            };

            current_pack.recipes.push(processed_recipe);
        }
    }

    return Array.from(namespace_map.values());
}

/**
 * Auto-discovers and calls init_pack() from every pack's index.ts,
 * and auto-discovers and registers behaviors from packs/[pack]/behaviors/*.ts.
 */
export function call_all_pack_inits(): void
{
    // 1. Scan and register dynamic device behaviors
    const behavior_modules = import.meta.glob('./*/behaviors/*.ts', { eager: true }) as Record<string, any>;

    for (const path in behavior_modules)
    {
        const parts = path.split('/');
        if (parts.length < 4)
        {
            continue;
        }

        const namespace = parts[1];
        const filename = parts[3].replace('.ts', '');
        const mod = behavior_modules[path];
        const behavior_candidate = mod.behavior || mod.default || mod;

        if (behavior_candidate && typeof behavior_candidate.get_shape === 'function')
        {
            const full_id = resolve_id(mod.device_id || filename, namespace);
            register_device_behavior(full_id, behavior_candidate);
        }
    }

    // 2. Call pack initializers
    const init_modules = import.meta.glob('./*/index.ts', { eager: true }) as Record<string, { init_pack?: () => void }>;

    for (const path in init_modules)
    {
        const mod = init_modules[path];
        if (typeof mod.init_pack === 'function')
        {
            mod.init_pack();
        }
    }
}

