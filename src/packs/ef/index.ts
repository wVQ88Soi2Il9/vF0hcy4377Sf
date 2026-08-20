import { basic_renderer } from '@/packs/basic_renderer';
import { all_ef_devices } from './devices/all_devices';
import { ef_pack_data } from './pack';

export { ef_pack_data };
export * from './devices/ef_device';
export * from './devices/categories';
export * from './devices/all_devices';
export * from './items/ef_item';
export * from './items/all_items';
export * from './recipes/ef_recipe';
export * from './recipes/all_recipes';
export * from './environments/environments';
export * from './plans/plans';

/**
 * Endfield Pack OOP Initializer.
 * Registers all OOP Device draw methods into basic_renderer.
 */
export function init_pack(): void
{
    for (const dev of all_ef_devices)
    {
        const full_id = dev.id.includes(':') ? dev.id : `ef:${dev.id}`;
        basic_renderer.register_draw(full_id, (ctx, sx, sy, sw, sh, zoom, placed_dev, def, camera) =>
        {
            dev.draw(ctx, sx, sy, sw, sh, zoom, placed_dev, def, camera);
        });
    }
}
