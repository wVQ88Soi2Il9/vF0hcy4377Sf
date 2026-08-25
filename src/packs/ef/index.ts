/**
 * EF (Endfield) Pack 進入點
 */

import * as environments from './data/environments';
import * as materials from './data/materials';
import * as machines from './data/machines';
import * as products from './data/products';
import { base_ef_device, port_def_to_vector_3d, machine_to_shape_3d, get_tag_color_theme, resolve_machine, create_ef_device_class } from './base_device';
import { recipe_def_to_recipe, get_all_ef_recipes } from './recipe_adapter';
import { solidpipe, liquidpipe, gaspipe, base_ef_pipe } from './pipes';
import { machine_list } from './data/machines';
import { material_list } from './data/materials';
import { product_list } from './data/products';
import type { pack_module, item_definition, recipe, device_constructor } from '@/core';

// Build unified items dictionary for ef pack
const ef_items: Record<string, item_definition> = {};
for (const mat of material_list)
{
    ef_items[mat.id] = {
        pack:       'ef',
        id:         mat.id,
        other_info: { ef: { name: mat.name, form: mat.form } }
    };
    if (mat.name && mat.name !== mat.id)
    {
        ef_items[mat.name] = {
            pack:       'ef',
            id:         mat.name,
            other_info: { ef: { name: mat.name, form: mat.form, alias_of: mat.id } }
        };
    }
}
for (const prod of product_list)
{
    ef_items[prod.id] = {
        pack:       'ef',
        id:         prod.id,
        other_info: { ef: { name: prod.name, form: prod.form } }
    };
    if (prod.name && prod.name !== prod.id)
    {
        ef_items[prod.name] = {
            pack:       'ef',
            id:         prod.name,
            other_info: { ef: { name: prod.name, form: prod.form, alias_of: prod.id } }
        };
    }
}

// Build unified recipes dictionary for ef pack
const ef_recipes: Record<string, recipe> = {};
for (const r of get_all_ef_recipes())
{
    ef_recipes[r.id] = r;
}

// Build unified devices dictionary for ef pack
const ef_devices: Record<string, device_constructor> = {
    solidpipe,
    liquidpipe,
    gaspipe
};
for (const m of machine_list)
{
    ef_devices[m.id] = create_ef_device_class(m);
}

/**
 * EF Pack 統一導出物件
 */
export const ef: pack_module =
{
    pack_id: 'ef',
    items: ef_items,
    recipes: ef_recipes,
    devices: ef_devices,
    base_ef_device,
    base_ef_pipe,
    solidpipe,
    liquidpipe,
    gaspipe,
    environments,
    materials,
    machines,
    products,
    port_def_to_vector_3d,
    machine_to_shape_3d,
    get_tag_color_theme,
    resolve_machine,
    recipe_def_to_recipe,
    get_all_ef_recipes
};

/**
 * Pack 初始化生命週期函式（由 loader.ts 自動發現並呼叫）
 */
export function init_pack(): void
{
    // EF pack 模組已由 index 導出自動載入
}
