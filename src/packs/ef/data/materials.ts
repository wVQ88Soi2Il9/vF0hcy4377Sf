/**
 * 基礎材料資料
 */

import type { material_def, item_form, port_media } from '../types';
import { form_to_port_media } from '../types';

// ─── 材料定義 ─────────────────────────────────────────────────────────────────

export const material_list: material_def[] = [
    {
        id:   'yuan_ore',
        name: '源礦',
        form: 'solid'
    },
    {
        id:   'p_292f416660',
        name: '紫晶礦',
        form: 'solid'
    },
    {
        id:   'blue_iron_ore',
        name: '藍鐵礦',
        form: 'solid'
    },
    {
        id:   'red_copper_ore',
        name: '赤銅礦',
        form: 'solid'
    },
    {
        id:   'p_aeb7fa2d20',
        name: '蕎花',
        form: 'solid'
    },
    {
        id:   'p_d74a8aaae0',
        name: '柑實',
        form: 'solid'
    },
    {
        id:   'p_7bb34ef875',
        name: '砂葉',
        form: 'solid'
    },
    {
        id:   'p_2c867eee25',
        name: '酮化灌木',
        form: 'solid'
    },
    {
        id:   'p_864f2688dd',
        name: '錦草',
        form: 'solid'
    },
    {
        id:   'p_d4b2255964',
        name: '芽針',
        form: 'solid'
    },
    {
        id:   'clean_water',
        name: '清水',
        form: 'liquid'
    },
    {
        id:   'deposit_acid',
        name: '沉積酸',
        form: 'liquid'
    },
    {
        id:   'p_468e8d31ba',
        name: '惰氣',
        form: 'gas'
    },
    {
        id:   'p_b471ae5777',
        name: '息壤氣',
        form: 'gas'
    }
];

const _material_map = new Map<string, material_def>(material_list.map((m) => [m.name, m]));

/** 取得所有基礎材料 */
export function get_all_materials(): material_def[]
{
    return material_list;
}

/** 依名稱查材料 */
export function get_material(name: string): material_def | undefined
{
    return _material_map.get(name);
}

/**
 * 依名稱查材料物態；未知時回傳 undefined。
 */
export function get_material_form(name: string): item_form | undefined
{
    return _material_map.get(name)?.form;
}

/**
 * 材料物態對應的線路媒質；未知材料回傳 null。
 */
export function get_material_port_media(name: string): port_media | null
{
    const form = get_material_form(name);
    return form ? form_to_port_media(form) : null;
}
