import type { pack, item_definition, recipe, device_definition } from '@/core/types';

// Helper function to resolve ID with namespace
function resolve_id(id: string, ns: string): string
{
    return id.includes(':') ? id : `${ns}:${id}`;
}

/**
 * Loads all packs automatically by scanning the folder structure.
 * The folder name under `packs/` acts as the namespace for all JSON files inside its `data/` folder.
 */
export function load_all_packs(): pack[]
{
    // Vite's glob import feature to get all json files under packs/*/data/*.json
    const pack_modules = import.meta.glob('./*/data/*.json', { eager: true }) as Record<string, any>;
    
    // Map to group JSON data by namespace
    const namespace_map = new Map<string, pack>();

    for (const path in pack_modules)
    {
        // Example path: './vanilla/data/devices.json'
        // Extract namespace (e.g. 'vanilla') and filename (e.g. 'devices')
        const parts = path.split('/');
        if (parts.length < 4)
        {
            continue;
        }
        
        const namespace = parts[1];
        const filename = parts[3].replace('.json', '');
        
        const file_data = pack_modules[path].default;
        
        // Ensure pack exists in map
        if (!namespace_map.has(namespace))
        {
            namespace_map.set(namespace, {
                id: namespace,
                items: [],
                recipes: [],
                device_definitions: []
            });
        }
        
        const current_pack = namespace_map.get(namespace)!;

        if (Array.isArray(file_data))
        {
            if (filename === 'items')
            {
                for (const raw_item of file_data)
                {
                    const full_id = resolve_id(raw_item.id, namespace);
                    current_pack.items.push({
                        ...raw_item,
                        id: full_id
                    } as item_definition);
                }
            }
            else if (filename === 'recipes')
            {
                for (const raw_recipe of file_data)
                {
                    const full_id = resolve_id(raw_recipe.id, namespace);
                    
                    const processed_recipe: recipe = {
                        ...raw_recipe,
                        id: full_id,
                        inputs: raw_recipe.inputs?.map((input: any) => ({
                            ...input,
                            item_id: resolve_id(input.item_id, namespace)
                        })) || [],
                        outputs: raw_recipe.outputs?.map((output: any) => ({
                            ...output,
                            item_id: resolve_id(output.item_id, namespace)
                        })) || []
                    };
                    
                    if (raw_recipe.power)
                    {
                        processed_recipe.power = raw_recipe.power.map((p: any) => ({
                            ...p,
                            power_id: resolve_id(p.power_id, namespace)
                        }));
                    }
                    
                    current_pack.recipes.push(processed_recipe);
                }
            }
            else if (filename === 'devices')
            {
                for (const raw_device of file_data)
                {
                    const full_id = resolve_id(raw_device.id, namespace);
                    
                    const processed_device: device_definition = {
                        ...raw_device,
                        id: full_id,
                        other_info: raw_device.other_info || {}
                    };
                    
                    current_pack.device_definitions.push(processed_device);
                }
            }
        }
    }

    return Array.from(namespace_map.values());
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

