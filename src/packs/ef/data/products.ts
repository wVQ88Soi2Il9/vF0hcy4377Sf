/**
 * 產品與配方資料（由 docs/aaaaa/scripts/generate-src-data.mjs 產生）
 *
 * 來源：docs/aaaaa/data/products.json（不含 materials 假產品、不含測試 stub）
 * 每個產品含 form（solid｜liquid｜gas）。基礎材料請查 materials.ts。
 *
 * 請勿手改本檔資料區；改 JSON 後重新執行：
 *   pnpm generate:src-data
 */

import type { recipe_def, product_def, item_form, port_media } from '../types';
import { form_to_port_media } from '../types';
import { get_material_form } from './materials';

// ─── 產品定義 ─────────────────────────────────────────────────────────────────

export const product_list: product_def[] = [
    {
        id: 'p_357bc568a0',
        name: '錦草溶液',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_p_357bc568a0_0',
                inputs: [
                    { item_id: '錦草粉末', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [{ item_id: '錦草溶液', quantity: 1 }],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_357bc568a0_1',
                inputs: [{ item_id: '藍鐵瓶-錦草溶液', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '錦草溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_357bc568a0_2',
                inputs: [{ item_id: '赤銅瓶-錦草溶液', quantity: 1 }],
                outputs: [
                    { item_id: '赤銅瓶', quantity: 1 },
                    { item_id: '錦草溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_11fbc3ad0c',
        name: '芽針溶液',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_p_11fbc3ad0c_0',
                inputs: [
                    { item_id: '芽針粉末', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [{ item_id: '芽針溶液', quantity: 1 }],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_11fbc3ad0c_1',
                inputs: [{ item_id: '藍鐵瓶-芽針溶液', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '芽針溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_11fbc3ad0c_2',
                inputs: [{ item_id: '赤銅瓶-芽針溶液', quantity: 1 }],
                outputs: [
                    { item_id: '赤銅瓶', quantity: 1 },
                    { item_id: '芽針溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_4367d72809',
        name: '液化息壤',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_p_4367d72809_0',
                inputs: [
                    { item_id: '息壤', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [{ item_id: '液化息壤', quantity: 1 }],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_4367d72809_1',
                inputs: [{ item_id: '藍鐵瓶-液化息壤', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '液化息壤', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'liquid_gas_converter_p_4367d72809_2',
                inputs: [{ item_id: '息壤氣', quantity: 1 }],
                outputs: [{ item_id: '液化息壤', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_30c91f4361',
        name: '液化重息壤',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_p_30c91f4361_0',
                inputs: [
                    { item_id: '重息壤', quantity: 1 },
                    { item_id: '沉積酸', quantity: 1 },
                ],
                outputs: [{ item_id: '液化重息壤', quantity: 1 }],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_30c91f4361_1',
                inputs: [{ item_id: '藍鐵瓶-液化重息壤', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '液化重息壤', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'liquid_gas_converter_p_30c91f4361_2',
                inputs: [{ item_id: '重息壤氣', quantity: 5 }],
                outputs: [{ item_id: '液化重息壤', quantity: 2 }],
                machine: '液氣轉化機',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_474e16ba23',
        name: '壤晶廢液',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_p_474e16ba23_0',
                inputs: [
                    { item_id: '液化息壤', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                outputs: [
                    { item_id: '壤晶廢液', quantity: 1 },
                    { item_id: '惰性壤晶廢液', quantity: 1 },
                ],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'purifier_p_474e16ba23_1',
                inputs: [{ item_id: '惰性壤晶廢液', quantity: 4 }],
                outputs: [
                    { item_id: '壤晶廢液', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                machine: '提純機',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_03f411c191',
        name: '惰性壤晶廢液',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_p_03f411c191_0',
                inputs: [
                    { item_id: '液化息壤', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                outputs: [
                    { item_id: '壤晶廢液', quantity: 1 },
                    { item_id: '惰性壤晶廢液', quantity: 1 },
                ],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'red_copper_solution',
        name: '赤銅溶液',
        form: 'liquid',
        recipes: [
            {
                id: 'reactor_red_copper_solution_0',
                inputs: [
                    { item_id: '赤銅粉末', quantity: 1 },
                    { item_id: '沉積酸', quantity: 1 },
                ],
                outputs: [{ item_id: '赤銅溶液', quantity: 1 }],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'liquid_gas_converter_red_copper_solution_1',
                inputs: [{ item_id: '氣態赤銅', quantity: 1 }],
                outputs: [{ item_id: '赤銅溶液', quantity: 2 }],
                machine: '液氣轉化機',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'hue_copper_solution',
        name: '赫銅溶液',
        form: 'liquid',
        recipes: [
            {
                id: 'purifier_hue_copper_solution_0',
                inputs: [{ item_id: '赤銅溶液', quantity: 4 }],
                outputs: [
                    { item_id: '赫銅溶液', quantity: 1 },
                    { item_id: '沉積酸', quantity: 1 },
                ],
                machine: '提純機',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'liquid_gas_converter_hue_copper_solution_1',
                inputs: [{ item_id: '氣態赫銅', quantity: 1 }],
                outputs: [{ item_id: '赫銅溶液', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_91f73b991f',
        name: '汙水',
        form: 'liquid',
        recipes: [
            {
                id: 'refinery_p_91f73b991f_0',
                inputs: [
                    { item_id: '赤銅礦', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [
                    { item_id: '赤銅塊', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                machine: '精煉爐',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'reactor_p_91f73b991f_1',
                inputs: [
                    { item_id: '壤晶廢液', quantity: 2 },
                    { item_id: '藍鐵粉末', quantity: 1 },
                ],
                outputs: [
                    { item_id: '壤晶', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'reactor_p_91f73b991f_2',
                inputs: [
                    { item_id: '赫銅溶液', quantity: 1 },
                    { item_id: '藍鐵粉末', quantity: 1 },
                ],
                outputs: [
                    { item_id: '赫銅塊', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_81e181b9f1',
        name: '碳塊',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_p_81e181b9f1_0',
                inputs: [{ item_id: '蕎花', quantity: 1 }],
                outputs: [{ item_id: '碳塊', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'refinery_p_81e181b9f1_1',
                inputs: [{ item_id: '砂葉', quantity: 1 }],
                outputs: [{ item_id: '碳塊', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'refinery_p_81e181b9f1_2',
                inputs: [{ item_id: '芽針', quantity: 1 }],
                outputs: [{ item_id: '碳塊', quantity: 2 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_86cef8f975',
        name: '晶體外殼',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_p_86cef8f975_0',
                inputs: [{ item_id: '源礦', quantity: 1 }],
                outputs: [{ item_id: '晶體外殼', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'purple_crystal_fiber',
        name: '紫晶纖維',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_purple_crystal_fiber_0',
                inputs: [{ item_id: '紫晶礦', quantity: 1 }],
                outputs: [{ item_id: '紫晶纖維', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'blue_iron_ingot',
        name: '藍鐵塊',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_blue_iron_ingot_0',
                inputs: [{ item_id: '藍鐵礦', quantity: 1 }],
                outputs: [{ item_id: '藍鐵塊', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'red_copper_ingot',
        name: '赤銅塊',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_red_copper_ingot_0',
                inputs: [
                    { item_id: '赤銅礦', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [
                    { item_id: '赤銅塊', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                machine: '精煉爐',
                machine_mode: 'liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'solid_gas_converter_red_copper_ingot_1',
                inputs: [{ item_id: '氣態赤銅', quantity: 1 }],
                outputs: [{ item_id: '赤銅塊', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'solid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'stable_carbon_block',
        name: '穩定碳塊',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_stable_carbon_block_0',
                inputs: [{ item_id: '緻密碳粉末', quantity: 1 }],
                outputs: [{ item_id: '穩定碳塊', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_4513c909d2',
        name: '密製晶體',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_p_4513c909d2_0',
                inputs: [{ item_id: '緻密晶體粉末', quantity: 1 }],
                outputs: [{ item_id: '密製晶體', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_f9e29e8e46',
        name: '高晶纖維',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_p_f9e29e8e46_0',
                inputs: [{ item_id: '高晶粉末', quantity: 1 }],
                outputs: [{ item_id: '高晶纖維', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_b1244946f7',
        name: '鋼塊',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_p_b1244946f7_0',
                inputs: [{ item_id: '緻密藍鐵粉末', quantity: 1 }],
                outputs: [{ item_id: '鋼塊', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'hue_copper_ingot',
        name: '赫銅塊',
        form: 'solid',
        recipes: [
            {
                id: 'reactor_hue_copper_ingot_0',
                inputs: [
                    { item_id: '赫銅溶液', quantity: 2 },
                    { item_id: '藍鐵粉末', quantity: 1 },
                ],
                outputs: [
                    { item_id: '赫銅塊', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'solid_gas_converter_hue_copper_ingot_1',
                inputs: [{ item_id: '氣態赫銅', quantity: 2 }],
                outputs: [{ item_id: '赫銅塊', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'solid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_e20f7f8f60',
        name: '息壤',
        form: 'solid',
        recipes: [
            {
                id: 'tianyou_furnace_p_e20f7f8f60_0',
                inputs: [
                    { item_id: '穩定碳塊', quantity: 2 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [{ item_id: '息壤', quantity: 1 }],
                machine: '天有洪爐',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'tianyou_furnace_p_e20f7f8f60_1',
                inputs: [
                    { item_id: '碳塊', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [{ item_id: '息壤', quantity: 1 }],
                machine: '天有洪爐',
                machine_mode: 'default',
                environment: 'stable',
                time_seconds: 2,
            },
            {
                id: 'solid_gas_converter_p_e20f7f8f60_2',
                inputs: [{ item_id: '息壤氣', quantity: 1 }],
                outputs: [{ item_id: '息壤', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'solid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_428c533a67',
        name: '重息壤',
        form: 'solid',
        recipes: [
            {
                id: 'tianyou_furnace_p_428c533a67_0',
                inputs: [
                    { item_id: '息壤', quantity: 10 },
                    { item_id: '壤晶廢液', quantity: 5 },
                ],
                outputs: [{ item_id: '重息壤', quantity: 1 }],
                machine: '天有洪爐',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
            {
                id: 'solid_gas_converter_p_428c533a67_1',
                inputs: [{ item_id: '重息壤氣', quantity: 5 }],
                outputs: [{ item_id: '重息壤', quantity: 2 }],
                machine: '固氣轉化機',
                machine_mode: 'solid_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_2f23971aac',
        name: '壤晶',
        form: 'solid',
        recipes: [
            {
                id: 'reactor_p_2f23971aac_0',
                inputs: [
                    { item_id: '壤晶廢液', quantity: 2 },
                    { item_id: '藍鐵粉末', quantity: 1 },
                ],
                outputs: [
                    { item_id: '壤晶', quantity: 1 },
                    { item_id: '汙水', quantity: 1 },
                ],
                machine: '反應池',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'carbon_powder',
        name: '碳粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_carbon_powder_0',
                inputs: [{ item_id: '碳塊', quantity: 1 }],
                outputs: [{ item_id: '碳粉末', quantity: 2 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'yuan_ore_powder',
        name: '源石粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_yuan_ore_powder_0',
                inputs: [{ item_id: '源礦', quantity: 1 }],
                outputs: [{ item_id: '源石粉末', quantity: 1 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_bf85c290ae',
        name: '晶體外殼粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_bf85c290ae_0',
                inputs: [{ item_id: '晶體外殼', quantity: 1 }],
                outputs: [{ item_id: '晶體外殼粉末', quantity: 1 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'purple_crystal_powder',
        name: '紫晶粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_purple_crystal_powder_0',
                inputs: [{ item_id: '紫晶纖維', quantity: 1 }],
                outputs: [{ item_id: '紫晶粉末', quantity: 1 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'blue_iron_powder',
        name: '藍鐵粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_blue_iron_powder_0',
                inputs: [{ item_id: '藍鐵塊', quantity: 1 }],
                outputs: [{ item_id: '藍鐵粉末', quantity: 1 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'red_copper_powder',
        name: '赤銅粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_red_copper_powder_0',
                inputs: [{ item_id: '赤銅塊', quantity: 1 }],
                outputs: [{ item_id: '赤銅粉末', quantity: 1 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_7eec6b9218',
        name: '砂葉粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_7eec6b9218_0',
                inputs: [{ item_id: '砂葉', quantity: 1 }],
                outputs: [{ item_id: '砂葉粉末', quantity: 3 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_6fab4f31c1',
        name: '酮化灌木粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_6fab4f31c1_0',
                inputs: [{ item_id: '酮化灌木', quantity: 1 }],
                outputs: [{ item_id: '酮化灌木粉末', quantity: 2 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_401730aec0',
        name: '細磨蕎花粉末',
        form: 'solid',
        recipes: [
            {
                id: 'grinder_p_401730aec0_0',
                inputs: [
                    { item_id: '蕎花粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '細磨蕎花粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_e97c50dcfc',
        name: '細磨柑實粉末',
        form: 'solid',
        recipes: [
            {
                id: 'grinder_p_e97c50dcfc_0',
                inputs: [
                    { item_id: '柑實粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '細磨柑實粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_534e020e2c',
        name: '緻密碳粉末',
        form: 'solid',
        recipes: [
            {
                id: 'grinder_p_534e020e2c_0',
                inputs: [
                    { item_id: '碳粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '緻密碳粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_35b86e15db',
        name: '緻密源石粉末',
        form: 'solid',
        recipes: [
            {
                id: 'grinder_p_35b86e15db_0',
                inputs: [
                    { item_id: '源石粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '緻密源石粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_ab5e7d09e6',
        name: '緻密晶體粉末',
        form: 'solid',
        recipes: [
            {
                id: 'refinery_p_ab5e7d09e6_0',
                inputs: [{ item_id: '緻密源石粉末', quantity: 1 }],
                outputs: [{ item_id: '緻密晶體粉末', quantity: 1 }],
                machine: '精煉爐',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'grinder_p_ab5e7d09e6_1',
                inputs: [
                    { item_id: '晶體外殼粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '緻密晶體粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_01f2839db2',
        name: '高晶粉末',
        form: 'solid',
        recipes: [
            {
                id: 'grinder_p_01f2839db2_0',
                inputs: [
                    { item_id: '紫晶粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '高晶粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_fa4ec09c39',
        name: '緻密藍鐵粉末',
        form: 'solid',
        recipes: [
            {
                id: 'grinder_p_fa4ec09c39_0',
                inputs: [
                    { item_id: '藍鐵粉末', quantity: 2 },
                    { item_id: '砂葉粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '緻密藍鐵粉末', quantity: 1 }],
                machine: '研磨機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'purple_crystal_bottle',
        name: '紫晶質瓶',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_purple_crystal_bottle_0',
                inputs: [{ item_id: '紫晶纖維', quantity: 2 }],
                outputs: [{ item_id: '紫晶質瓶', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'blue_iron_bottle',
        name: '藍鐵瓶',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_blue_iron_bottle_0',
                inputs: [{ item_id: '藍鐵塊', quantity: 2 }],
                outputs: [{ item_id: '藍鐵瓶', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_blue_iron_bottle_1',
                inputs: [{ item_id: '藍鐵瓶-清水', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_blue_iron_bottle_2',
                inputs: [{ item_id: '藍鐵瓶-錦草溶液', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '錦草溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_blue_iron_bottle_3',
                inputs: [{ item_id: '藍鐵瓶-芽針溶液', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '芽針溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_blue_iron_bottle_4',
                inputs: [{ item_id: '藍鐵瓶-液化息壤', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '液化息壤', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_blue_iron_bottle_5',
                inputs: [{ item_id: '藍鐵瓶-液化重息壤', quantity: 1 }],
                outputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '液化重息壤', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_59a8b2ebb3',
        name: '高晶質瓶',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_p_59a8b2ebb3_0',
                inputs: [{ item_id: '高晶纖維', quantity: 1 }],
                outputs: [{ item_id: '高晶質瓶', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_1942c57af4',
        name: '鋼質瓶',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_p_1942c57af4_0',
                inputs: [{ item_id: '鋼塊', quantity: 2 }],
                outputs: [{ item_id: '鋼質瓶', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_ee81861cfe',
        name: '赤銅瓶',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_p_ee81861cfe_0',
                inputs: [{ item_id: '赤銅塊', quantity: 2 }],
                outputs: [{ item_id: '赤銅瓶', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_ee81861cfe_1',
                inputs: [{ item_id: '赤銅瓶-錦草溶液', quantity: 1 }],
                outputs: [
                    { item_id: '赤銅瓶', quantity: 1 },
                    { item_id: '錦草溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'disassembler_p_ee81861cfe_2',
                inputs: [{ item_id: '赤銅瓶-芽針溶液', quantity: 1 }],
                outputs: [
                    { item_id: '赤銅瓶', quantity: 1 },
                    { item_id: '芽針溶液', quantity: 1 },
                ],
                machine: '拆解機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_77ea4b3620',
        name: '赫銅瓶',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_p_77ea4b3620_0',
                inputs: [{ item_id: '赫銅塊', quantity: 2 }],
                outputs: [{ item_id: '赫銅瓶', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_fd5c8e6a57',
        name: '紫晶零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_p_fd5c8e6a57_0',
                inputs: [{ item_id: '紫晶纖維', quantity: 1 }],
                outputs: [{ item_id: '紫晶零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_5853024d18',
        name: '鐵製零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_p_5853024d18_0',
                inputs: [{ item_id: '藍鐵塊', quantity: 1 }],
                outputs: [{ item_id: '鐵製零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_2b34f667d4',
        name: '高晶零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_p_2b34f667d4_0',
                inputs: [{ item_id: '高晶纖維', quantity: 1 }],
                outputs: [{ item_id: '高晶零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_c8ca1b6aa9',
        name: '鋼製零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_p_c8ca1b6aa9_0',
                inputs: [{ item_id: '鋼塊', quantity: 1 }],
                outputs: [{ item_id: '鋼製零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'red_copper_part',
        name: '赤銅零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_red_copper_part_0',
                inputs: [{ item_id: '赤銅塊', quantity: 1 }],
                outputs: [{ item_id: '赤銅零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'hue_copper_part',
        name: '赫銅零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_hue_copper_part_0',
                inputs: [{ item_id: '赫銅塊', quantity: 5 }],
                outputs: [{ item_id: '赫銅零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_09cf08fc31',
        name: '紫晶裝備原件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_09cf08fc31_0',
                inputs: [
                    { item_id: '晶體外殼', quantity: 5 },
                    { item_id: '紫晶纖維', quantity: 5 },
                ],
                outputs: [{ item_id: '紫晶裝備原件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_de442c1b63',
        name: '藍鐵裝備原件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_de442c1b63_0',
                inputs: [
                    { item_id: '晶體外殼', quantity: 10 },
                    { item_id: '藍鐵礦', quantity: 10 },
                ],
                outputs: [{ item_id: '藍鐵裝備原件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_004c9c7011',
        name: '高晶裝備原件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_004c9c7011_0',
                inputs: [
                    { item_id: '密製晶體', quantity: 10 },
                    { item_id: '高晶纖維', quantity: 10 },
                ],
                outputs: [{ item_id: '高晶裝備原件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_9e3013377c',
        name: '息壤裝備原件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_9e3013377c_0',
                inputs: [
                    { item_id: '密製晶體', quantity: 10 },
                    { item_id: '息壤', quantity: 10 },
                ],
                outputs: [{ item_id: '息壤裝備原件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_3792959641',
        name: '赤銅裝備原件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_3792959641_0',
                inputs: [
                    { item_id: '赤銅零件', quantity: 10 },
                    { item_id: '息壤', quantity: 10 },
                ],
                outputs: [{ item_id: '赤銅裝備原件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_cfbc25b709',
        name: '赫銅裝備零件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_cfbc25b709_0',
                inputs: [
                    { item_id: '赫銅零件', quantity: 2 },
                    { item_id: '重息壤', quantity: 2 },
                ],
                outputs: [{ item_id: '赫銅裝備零件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'low_cap_valley_battery',
        name: '低容量谷地電池',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_low_cap_valley_battery_0',
                inputs: [
                    { item_id: '紫晶零件', quantity: 5 },
                    { item_id: '源石粉末', quantity: 10 },
                ],
                outputs: [{ item_id: '低容量谷地電池', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'mid_cap_valley_battery',
        name: '中容量谷地電池',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_mid_cap_valley_battery_0',
                inputs: [
                    { item_id: '鐵製零件', quantity: 10 },
                    { item_id: '源石粉末', quantity: 15 },
                ],
                outputs: [{ item_id: '中容量谷地電池', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'high_cap_valley_battery',
        name: '高容量谷地電池',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_high_cap_valley_battery_0',
                inputs: [
                    { item_id: '鋼製零件', quantity: 10 },
                    { item_id: '緻密源石粉末', quantity: 15 },
                ],
                outputs: [{ item_id: '高容量谷地電池', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_4e045fe819',
        name: '低容量武陵電池',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_4e045fe819_0',
                inputs: [
                    { item_id: '息壤', quantity: 5 },
                    { item_id: '緻密源石粉末', quantity: 15 },
                ],
                outputs: [{ item_id: '低容量武陵電池', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_74df87deb1',
        name: '中容量武陵電池',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_74df87deb1_0',
                inputs: [
                    { item_id: '壤晶', quantity: 5 },
                    { item_id: '緻密源石粉末', quantity: 20 },
                ],
                outputs: [{ item_id: '中容量武陵電池', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_efa39f4dc6',
        name: '藍鐵瓶-清水',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_efa39f4dc6_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '清水', quantity: 1 },
                ],
                outputs: [{ item_id: '藍鐵瓶-清水', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_2b3a5be353',
        name: '藍鐵瓶-錦草溶液',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_2b3a5be353_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '錦草溶液', quantity: 1 },
                ],
                outputs: [{ item_id: '藍鐵瓶-錦草溶液', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_320a02c4c0',
        name: '藍鐵瓶-芽針溶液',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_320a02c4c0_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '芽針溶液', quantity: 1 },
                ],
                outputs: [{ item_id: '藍鐵瓶-芽針溶液', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_bd293474c6',
        name: '藍鐵瓶-液化息壤',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_bd293474c6_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '液化息壤', quantity: 1 },
                ],
                outputs: [{ item_id: '藍鐵瓶-液化息壤', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_02c2d62bfd',
        name: '藍鐵瓶-液化重息壤',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_02c2d62bfd_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 1 },
                    { item_id: '液化重息壤', quantity: 1 },
                ],
                outputs: [{ item_id: '藍鐵瓶-液化重息壤', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_aae111567e',
        name: '赤銅瓶-錦草溶液',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_aae111567e_0',
                inputs: [
                    { item_id: '赤銅瓶', quantity: 1 },
                    { item_id: '錦草溶液', quantity: 1 },
                ],
                outputs: [{ item_id: '赤銅瓶-錦草溶液', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_761fd205da',
        name: '赤銅瓶-芽針溶液',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_761fd205da_0',
                inputs: [
                    { item_id: '赤銅瓶', quantity: 1 },
                    { item_id: '芽針溶液', quantity: 1 },
                ],
                outputs: [{ item_id: '赤銅瓶-芽針溶液', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'gas_liquid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_e19d6f9c84',
        name: '工業爆炸物',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_e19d6f9c84_0',
                inputs: [
                    { item_id: '紫晶零件', quantity: 5 },
                    { item_id: '酮化灌木粉末', quantity: 1 },
                ],
                outputs: [{ item_id: '工業爆炸物', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_e37f0919ab',
        name: '蕎花粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_e37f0919ab_0',
                inputs: [{ item_id: '蕎花', quantity: 1 }],
                outputs: [{ item_id: '蕎花粉末', quantity: 2 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_63733c56a2',
        name: '柑實粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_63733c56a2_0',
                inputs: [{ item_id: '柑實', quantity: 1 }],
                outputs: [{ item_id: '柑實粉末', quantity: 2 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_3f2fadbe84',
        name: '錦草粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_3f2fadbe84_0',
                inputs: [{ item_id: '錦草', quantity: 1 }],
                outputs: [{ item_id: '錦草粉末', quantity: 2 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_a6804da113',
        name: '芽針粉末',
        form: 'solid',
        recipes: [
            {
                id: 'crusher_p_a6804da113_0',
                inputs: [{ item_id: '芽針', quantity: 1 }],
                outputs: [{ item_id: '芽針粉末', quantity: 2 }],
                machine: '粉碎機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_17c929799d',
        name: '蕎癒膠囊',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_17c929799d_0',
                inputs: [
                    { item_id: '紫晶質瓶', quantity: 5 },
                    { item_id: '蕎花粉末', quantity: 5 },
                ],
                outputs: [{ item_id: '蕎癒膠囊', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_ac3992d54e',
        name: '優質蕎癒膠囊',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_ac3992d54e_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 10 },
                    { item_id: '蕎花粉末', quantity: 10 },
                ],
                outputs: [{ item_id: '優質蕎癒膠囊', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_553ca3e20c',
        name: '柑實罐頭',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_553ca3e20c_0',
                inputs: [
                    { item_id: '紫晶質瓶', quantity: 5 },
                    { item_id: '柑實粉末', quantity: 5 },
                ],
                outputs: [{ item_id: '柑實罐頭', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_67a63f6bd6',
        name: '優質柑實罐頭',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_67a63f6bd6_0',
                inputs: [
                    { item_id: '藍鐵瓶', quantity: 10 },
                    { item_id: '柑實粉末', quantity: 10 },
                ],
                outputs: [{ item_id: '優質柑實罐頭', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_d3cb86d010',
        name: '錦草飲料',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_d3cb86d010_0',
                inputs: [
                    { item_id: '鐵製零件', quantity: 10 },
                    { item_id: '藍鐵瓶-錦草溶液', quantity: 5 },
                ],
                outputs: [{ item_id: '錦草飲料', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_bb7c07f0c4',
        name: '芽針針劑',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_bb7c07f0c4_0',
                inputs: [
                    { item_id: '鐵製零件', quantity: 10 },
                    { item_id: '藍鐵瓶', quantity: 5 },
                ],
                outputs: [{ item_id: '芽針針劑', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_814c4991ee',
        name: '精選蕎癒膠囊',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_814c4991ee_0',
                inputs: [
                    { item_id: '鋼質瓶', quantity: 10 },
                    { item_id: '細磨蕎花粉末', quantity: 10 },
                ],
                outputs: [{ item_id: '精選蕎癒膠囊', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_e1f527de1d',
        name: '精選柑實罐頭',
        form: 'solid',
        recipes: [
            {
                id: 'filling_machine_p_e1f527de1d_0',
                inputs: [
                    { item_id: '鋼質瓶', quantity: 10 },
                    { item_id: '細磨柑實粉末', quantity: 10 },
                ],
                outputs: [{ item_id: '精選柑實罐頭', quantity: 1 }],
                machine: '灌裝機',
                machine_mode: 'base_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_d1a8862de8',
        name: '優質錦草飲料',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_d1a8862de8_0',
                inputs: [
                    { item_id: '赤銅零件', quantity: 10 },
                    { item_id: '赤銅瓶-錦草溶液', quantity: 5 },
                ],
                outputs: [{ item_id: '優質錦草飲料', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_1c799b3b83',
        name: '優質芽針針劑',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_1c799b3b83_0',
                inputs: [
                    { item_id: '赤銅零件', quantity: 10 },
                    { item_id: '赤銅瓶-芽針溶液', quantity: 5 },
                ],
                outputs: [{ item_id: '優質芽針針劑', quantity: 1 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_aa9c48ae57',
        name: '氣態灼銅',
        form: 'gas',
        recipes: [
            {
                id: 'solid_gas_converter_p_aa9c48ae57_0',
                inputs: [{ item_id: '灼銅塊', quantity: 1 }],
                outputs: [{ item_id: '氣態灼銅', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'gas_reactor_p_aa9c48ae57_1',
                inputs: [
                    { item_id: '氣態赫銅', quantity: 2 },
                    { item_id: '息壤氣', quantity: 1 },
                ],
                outputs: [{ item_id: '氣態灼銅', quantity: 1 }],
                machine: '氣體反應爐',
                machine_mode: 'default',
                environment: 'acidic',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_b471ae5777',
        name: '息壤氣',
        form: 'gas',
        recipes: [
            {
                id: 'liquid_gas_converter_p_b471ae5777_0',
                inputs: [{ item_id: '液化息壤', quantity: 1 }],
                outputs: [{ item_id: '息壤氣', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'solid_gas_converter_p_b471ae5777_1',
                inputs: [{ item_id: '息壤', quantity: 1 }],
                outputs: [{ item_id: '息壤氣', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_3589a67152',
        name: '分離芯',
        form: 'solid',
        recipes: [
            {
                id: 'packaging_machine_p_3589a67152_0',
                inputs: [
                    { item_id: '赤銅耐壓罐', quantity: 1 },
                    { item_id: '息壤', quantity: 1 },
                ],
                outputs: [{ item_id: '分離芯', quantity: 2 }],
                machine: '封裝機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_92d1d93bb4',
        name: '赤銅耐壓罐',
        form: 'solid',
        recipes: [
            {
                id: 'shaping_machine_p_92d1d93bb4_0',
                inputs: [
                    { item_id: '赤銅塊', quantity: 2 },
                    { item_id: '惰氣', quantity: 1 },
                ],
                outputs: [{ item_id: '赤銅耐壓罐', quantity: 1 }],
                machine: '塑型機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_d0b1666a32',
        name: '灼銅裝備原件',
        form: 'solid',
        recipes: [
            {
                id: 'equipment_parts_machine_p_d0b1666a32_0',
                inputs: [
                    { item_id: '灼銅零件', quantity: 1 },
                    { item_id: '重息壤', quantity: 2 },
                ],
                outputs: [{ item_id: '灼銅裝備原件', quantity: 1 }],
                machine: '裝備原件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_19149749de',
        name: '灼銅零件',
        form: 'solid',
        recipes: [
            {
                id: 'parts_machine_p_19149749de_0',
                inputs: [{ item_id: '灼銅塊', quantity: 5 }],
                outputs: [{ item_id: '灼銅零件', quantity: 1 }],
                machine: '配件機',
                machine_mode: 'default',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_d484c37e7b',
        name: '灼銅塊',
        form: 'solid',
        recipes: [
            {
                id: 'solid_gas_converter_p_d484c37e7b_0',
                inputs: [{ item_id: '氣態灼銅', quantity: 1 }],
                outputs: [{ item_id: '灼銅塊', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'solid_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_075d2864b6',
        name: '氣態赫銅',
        form: 'gas',
        recipes: [
            {
                id: 'purifier_p_075d2864b6_0',
                inputs: [
                    { item_id: '氣態赤銅', quantity: 2 },
                    { item_id: '分離芯', quantity: 1 },
                ],
                outputs: [{ item_id: '氣態赫銅', quantity: 2 }],
                machine: '提純機',
                machine_mode: 'gas_mode',
                environment: 'stable',
                time_seconds: 2,
            },
            {
                id: 'liquid_gas_converter_p_075d2864b6_1',
                inputs: [{ item_id: '赫銅溶液', quantity: 1 }],
                outputs: [{ item_id: '氣態赫銅', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'solid_gas_converter_p_075d2864b6_2',
                inputs: [{ item_id: '赫銅塊', quantity: 1 }],
                outputs: [{ item_id: '氣態赫銅', quantity: 2 }],
                machine: '固氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_0a62d5e259',
        name: '氣態赤銅',
        form: 'gas',
        recipes: [
            {
                id: 'liquid_gas_converter_p_0a62d5e259_0',
                inputs: [{ item_id: '赤銅溶液', quantity: 2 }],
                outputs: [{ item_id: '氣態赤銅', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
            {
                id: 'solid_gas_converter_p_0a62d5e259_1',
                inputs: [{ item_id: '赤銅塊', quantity: 2 }],
                outputs: [{ item_id: '氣態赤銅', quantity: 1 }],
                machine: '固氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_16ef66f641',
        name: '重息壤氣',
        form: 'gas',
        recipes: [
            {
                id: 'purifier_p_16ef66f641_0',
                inputs: [
                    { item_id: '息壤氣', quantity: 2 },
                    { item_id: '分離芯', quantity: 1 },
                ],
                outputs: [{ item_id: '重息壤氣', quantity: 1 }],
                machine: '提純機',
                machine_mode: 'gas_mode',
                environment: 'stable',
                time_seconds: 2,
            },
            {
                id: 'liquid_gas_converter_p_16ef66f641_1',
                inputs: [{ item_id: '液化重息壤', quantity: 2 }],
                outputs: [{ item_id: '重息壤氣', quantity: 5 }],
                machine: '液氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 10,
            },
            {
                id: 'solid_gas_converter_p_16ef66f641_2',
                inputs: [{ item_id: '重息壤', quantity: 2 }],
                outputs: [{ item_id: '重息壤氣', quantity: 5 }],
                machine: '固氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 10,
            },
        ],
    },

    {
        id: 'p_7e4ac54c81',
        name: '水蒸氣',
        form: 'gas',
        recipes: [
            {
                id: 'liquid_gas_converter_p_7e4ac54c81_0',
                inputs: [{ item_id: '清水', quantity: 1 }],
                outputs: [{ item_id: '水蒸氣', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },

    {
        id: 'p_ef55529416',
        name: '酸氣',
        form: 'gas',
        recipes: [
            {
                id: 'liquid_gas_converter_p_ef55529416_0',
                inputs: [{ item_id: '沉積酸', quantity: 1 }],
                outputs: [{ item_id: '酸氣', quantity: 1 }],
                machine: '液氣轉化機',
                machine_mode: 'gas_mode',
                environment: 'none',
                time_seconds: 2,
            },
        ],
    },
];

// ─── 查詢 API ─────────────────────────────────────────────────────────────────

/** 產品名稱快查 Map */
const _product_map = new Map<string, product_def>(product_list.map((p) => [p.name, p]));

/**
 * 取得所有使用指定設備的配方。
 *
 * @param machine_name 設備中文名稱
 * @param mode_id 若提供，只回傳 machine_mode 相符或未標 mode 的配方
 */
export function get_recipes_for_machine(machine_name: string, mode_id?: string): recipe_def[]
{
    const recipes = product_list.flatMap((p) => p.recipes.filter((r) => r.machine === machine_name));
    if (mode_id === undefined)
    {
        return recipes;
    }
    return recipes.filter((r) => r.machine_mode == null || r.machine_mode === mode_id);
}

/**
 * 依產品名稱取得所有配方。
 */
export function get_recipes_by_product(product_name: string): recipe_def[]
{
    return _product_map.get(product_name)?.recipes ?? [];
}

/**
 * 取得指定產品的單一配方（依 index，預設第 0 個）。
 */
export function get_recipe(product_name: string, index = 0): recipe_def | undefined
{
    return _product_map.get(product_name)?.recipes[index];
}

/** 依名稱取得產品定義 */
export function get_product(product_name: string): product_def | undefined
{
    return _product_map.get(product_name);
}

/** 取得所有 product_def */
export function get_all_products(): product_def[]
{
    return product_list;
}

/** 取得所有 recipe_def（攤平） */
export function get_all_recipes(): recipe_def[]
{
    return product_list.flatMap((p) => p.recipes);
}

/**
 * 查詢品項物態：優先產品表，其次材料表；皆無則視為 solid。
 * @param item_name 品項中文名（item_id）
 */
export function get_item_form(item_name: string): item_form
{
    return _product_map.get(item_name)?.form ?? get_material_form(item_name) ?? 'solid';
}

/**
 * 品項應使用的線路媒質。
 * @param item_name 品項中文名
 */
export function get_item_port_media(item_name: string): port_media
{
    return form_to_port_media(get_item_form(item_name));
}
