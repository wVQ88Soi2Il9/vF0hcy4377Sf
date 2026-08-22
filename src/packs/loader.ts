import type { pack, item_definition, recipe } from '@/core/types';
import type { pack_registry } from '@/core/pack_manager';
import { register_device_class } from '@/core/pack_manager';

// Helper function to resolve ID with namespace
function resolve_id(id: string, ns: string): string
{
    return id.includes(':') ? id : `${ns}:${id}`;
}

/**
 * Loads all packs automatically by scanning the folder structure.
 * 1. JSON files inside packs/{namespace}/data/*.json (items)
 * 2. TypeScript recipe modules inside packs/{namespace}/recipes/*.ts
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
                recipes: []
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
 * Loads and registers all dynamic TypeScript device classes under packs/{namespace}/devices/*.ts
 */
export function load_all_device_classes(registry: pack_registry): void
{
    const device_modules = import.meta.glob('./*/devices/*.ts', { eager: true }) as Record<string, any>;

    for (const path in device_modules)
    {
        const parts = path.split('/');
        if (parts.length < 4)
        {
            continue;
        }

        const namespace = parts[1];
        const filename = parts[3].replace('.ts', '');
        if (filename.startsWith('base_') || filename.startsWith('_'))
        {
            continue;
        }

        const mod = device_modules[path];
        const cls = mod.device_class || mod.default || mod[filename];

        if (cls && typeof cls === 'function')
        {
            const full_id = resolve_id(mod.device_id || filename, namespace);
            register_device_class(registry, full_id, cls);
        }
    }
}

/**
 * Auto-discovers and calls init_pack() from every pack's index.ts.
 * Any pack that exports init_pack() will be initialized automatically.
 */
export function call_all_pack_inits(): void
{
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
