/**
 * EF (Endfield) Pack 進入點
 */

import { get_registry } from '@/API';

import
{
    environment_list,
    get_environment,
    get_all_environments
} from './data/environments';

import
{
    material_list,
    get_all_materials,
    get_material,
    get_material_form,
    get_material_port_media
} from './data/materials';

import
{
    plans,
    get_plan,
    get_plan_by_name,
    get_all_plans
} from './data/plans';

import
{
    machine_tags,
    machine_list,
    machine_map,
    get_machine,
    get_machine_by_id,
    get_all_machines,
    get_machines_by_tag,
    get_machine_mode
} from './data/machines';

import
{
    product_list,
    get_recipes_for_machine,
    get_recipes_by_product,
    get_recipe,
    get_product,
    get_all_products,
    get_all_recipes,
    get_item_form,
    get_item_port_media
} from './data/products';

import
{
    belt_rate_limit,
    pipe_rate_limit,
    form_to_port_media,
    rate_limit_for_media
} from './types';

import
{
    base_ef_device,
    port_def_to_vector_3d,
    machine_to_shape_3d,
    create_ef_device_class,
    register_all_ef_devices,
    get_tag_color_theme
} from './base_device';

import
{
    recipe_def_to_recipe,
    get_all_ef_recipes,
    register_all_ef_recipes
} from './recipe_adapter';

// Re-export all types
export type
{
    environment,
    port_side,
    port_media,
    port_type,
    machine_category,
    port_def,
    machine_loss,
    machine_mode,
    machine_context,
    machine_tick_fn,
    machine_input_fn,
    machine_output_fn,
    machine_efficiency_fn,
    machine,
    item_form,
    recipe_item,
    recipe_def,
    product_def,
    material_def,
    material_rate,
    machine_limit,
    product_value,
    transport_item,
    plan
} from './types';

export type { ef_device_color_theme } from './base_device';

// Re-export values & queries
export
{
    base_ef_device,
    environment_list,
    get_environment,
    get_all_environments,
    material_list,
    get_all_materials,
    get_material,
    get_material_form,
    get_material_port_media,
    plans,
    get_plan,
    get_plan_by_name,
    get_all_plans,
    machine_tags,
    machine_list,
    machine_map,
    get_machine,
    get_machine_by_id,
    get_all_machines,
    get_machines_by_tag,
    get_machine_mode,
    product_list,
    get_recipes_for_machine,
    get_recipes_by_product,
    get_recipe,
    get_product,
    get_all_products,
    get_all_recipes,
    get_item_form,
    get_item_port_media,
    belt_rate_limit,
    pipe_rate_limit,
    form_to_port_media,
    rate_limit_for_media,
    port_def_to_vector_3d,
    machine_to_shape_3d,
    create_ef_device_class,
    register_all_ef_devices,
    get_tag_color_theme,
    recipe_def_to_recipe,
    get_all_ef_recipes,
    register_all_ef_recipes
};

/**
 * EF Pack 統一導出物件
 */
export const ef =
{
    base_ef_device,
    environment_list,
    get_environment,
    get_all_environments,
    material_list,
    get_all_materials,
    get_material,
    get_material_form,
    get_material_port_media,
    plans,
    get_plan,
    get_plan_by_name,
    get_all_plans,
    machine_tags,
    machine_list,
    machine_map,
    get_machine,
    get_machine_by_id,
    get_all_machines,
    get_machines_by_tag,
    get_machine_mode,
    product_list,
    get_recipes_for_machine,
    get_recipes_by_product,
    get_recipe,
    get_product,
    get_all_products,
    get_all_recipes,
    get_item_form,
    get_item_port_media,
    belt_rate_limit,
    pipe_rate_limit,
    form_to_port_media,
    rate_limit_for_media,
    port_def_to_vector_3d,
    machine_to_shape_3d,
    create_ef_device_class,
    register_all_ef_devices,
    get_tag_color_theme,
    recipe_def_to_recipe,
    get_all_ef_recipes,
    register_all_ef_recipes
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
