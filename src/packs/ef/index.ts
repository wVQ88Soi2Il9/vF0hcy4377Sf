/**
 * EF (Endfield) Pack 進入點
 */

import { get_registry } from '@/API';
import * as environments from './data/environments';
import * as materials from './data/materials';
import * as machines from './data/machines';
import * as products from './data/products';
import { base_ef_device, register_all_ef_devices, port_def_to_vector_3d, machine_to_shape_3d, get_tag_color_theme } from './base_device';
import { register_all_ef_recipes, recipe_def_to_recipe, get_all_ef_recipes } from './recipe_adapter';

// ─── 導出型別 ─────────────────────────────────────────────────────────────────
export type * from './types';
export type { ef_device_color_theme } from './base_device';

// ─── 導出資料模組與適配邏輯 ───────────────────────────────────────────────────
export
{
    environments,
    materials,
    machines,
    products,
    base_ef_device,
    port_def_to_vector_3d,
    machine_to_shape_3d,
    get_tag_color_theme,
    recipe_def_to_recipe,
    get_all_ef_recipes
};

/**
 * EF Pack 統一導出物件
 */
export const ef =
{
    base_ef_device,
    environments,
    materials,
    machines,
    products,
    port_def_to_vector_3d,
    machine_to_shape_3d,
    get_tag_color_theme,
    recipe_def_to_recipe,
    get_all_ef_recipes
};

/**
 * Pack 初始化生命週期函式（由 loader.ts 自動發現並呼叫）
 */
export function init_pack(): void
{
    const registry = get_registry();
    if (registry)
    {
        register_all_ef_devices(registry);
        register_all_ef_recipes(registry);
    }
}
