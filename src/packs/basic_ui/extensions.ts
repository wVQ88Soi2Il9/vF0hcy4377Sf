import * as core from '@/core';
import * as world from '@/world';
import { check_panel_options } from './panel';
import type { panel_options } from './panel';

/**
 * 下游 pack 在 other_info.basic_ui.panels 宣告的 panel。
 */
export interface panel_declaration extends panel_options
{
    render(target_world: world.pure_world): HTMLElement;
}

export interface panel_entry
{
    pack_id:     string;
    name:        string;
    declaration: panel_declaration;
}

function is_record(value: unknown): value is Record<string, unknown>
{
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function check_declaration(value: unknown, label: string): panel_declaration
{
    if (!is_record(value))
    {
        throw new Error(`Panel "${label}" must be an object.`);
    }
    if (typeof value.render !== 'function')
    {
        throw new Error(`Panel "${label}" must provide render(target_world).`);
    }
    if (!Array.isArray(value.edges) || !is_record(value.min_size) || !is_record(value.max_size))
    {
        throw new Error(`Panel "${label}" must provide edges, min_size and max_size.`);
    }
    const declaration = value as unknown as panel_declaration;
    try
    {
        check_panel_options(declaration);
    }
    catch (error)
    {
        throw new Error(`Panel "${label}": ${(error as Error).message}`);
    }
    return declaration;
}

/**
 * 依 registry 順序列出各 pack 在 other_info.basic_ui.panels 宣告的 panel。
 * basic_ui 命名空間只接受 panels；格式錯誤時報錯。
 */
export function list_panels(registry: core.pack_registry): panel_entry[]
{
    const entries: panel_entry[] = [];
    for (const [pack_id, pack] of registry)
    {
        const info = pack.other_info?.['basic_ui'];
        if (info === undefined)
        {
            continue;
        }
        if (!is_record(info))
        {
            throw new Error(`Pack "${pack_id}": other_info.basic_ui must be an object.`);
        }
        for (const key of Object.keys(info))
        {
            if (key !== 'panels')
            {
                throw new Error(`Pack "${pack_id}": unknown key "${key}" in other_info.basic_ui.`);
            }
        }
        if (!is_record(info.panels))
        {
            throw new Error(`Pack "${pack_id}": other_info.basic_ui.panels must be an object.`);
        }
        for (const [name, value] of Object.entries(info.panels))
        {
            entries.push({ pack_id, name, declaration: check_declaration(value, `${pack_id}:${name}`) });
        }
    }
    return entries;
}
