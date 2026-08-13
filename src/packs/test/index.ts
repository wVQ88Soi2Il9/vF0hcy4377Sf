import { basic_renderer } from '@/packs/basic_renderer';
import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';

interface draw_module
{
    device_id: string;
    draw:      device_draw_fn;
}

/**
 * Initialization function for test pack.
 * Auto-discovers and registers all device draw functions in ./basic_renderer$/*.ts
 */
export function init_pack(): void
{
    const draw_modules = import.meta.glob('./$basic_renderer/*.ts', { eager: true }) as Record<string, draw_module>;

    for (const path in draw_modules)
    {
        const mod = draw_modules[path];
        if (mod.device_id && typeof mod.draw === 'function')
        {
            basic_renderer.register_draw(mod.device_id, mod.draw);
        }
    }
}
