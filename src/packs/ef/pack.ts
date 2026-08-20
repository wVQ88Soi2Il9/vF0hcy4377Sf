import type { pack } from '@/core/types';
import { all_ef_devices } from './devices/all_devices';
import { all_ef_items } from './items/all_items';
import { all_ef_recipes } from './recipes/all_recipes';

/**
 * Endfield OOP Pack Data Definition.
 * Exposes all OOP devices, items, and recipes as a registered engine pack.
 */
export const ef_pack_data: pack =
{
    id:                 'ef',
    items:              all_ef_items.map(item => item.to_definition()),
    recipes:            all_ef_recipes.map(recipe => recipe.to_recipe()),
    device_definitions: all_ef_devices.map(device => device.to_definition())
};

export default ef_pack_data;
