import * as core from '@/core';
import * as world from '@/world';
import { check_keys, panel_label } from './validate';

/**
 * 下游 pack 在 other_info.basic_ui.panels 宣告的 panel：只提供內容，位置與尺寸由版面樹決定。
 */
export interface panel_declaration
{
    render(target_world: world.pure_world): HTMLElement;
}

/**
 * pack_id → panel 名稱 → 宣告。
 */
export type panel_declarations = ReadonlyMap<string, ReadonlyMap<string, panel_declaration>>;

/**
 * 依 registry 順序讀各 pack 的 other_info.basic_ui.panels。
 * basic_ui 命名空間只接受 panels；每個宣告只接受 render。格式錯誤時報錯。
 */
export function list_panels(registry: core.pack_registry): panel_declarations
{
    const result = new Map<string, Map<string, panel_declaration>>();
    for (const [pack_id, pack] of registry)
    {
        const info = pack.other_info?.['basic_ui'];
        if (info === undefined)
        {
            continue;
        }
        const namespace = check_keys(info, ['panels'], `Pack "${pack_id}": other_info.basic_ui`);
        const panels = check_keys(namespace.panels, null, `Pack "${pack_id}": other_info.basic_ui.panels`);

        const by_name = new Map<string, panel_declaration>();
        for (const [name, value] of Object.entries(panels))
        {
            const label = panel_label(pack_id, name);
            const declaration = check_keys(value, ['render'], label);
            if (typeof declaration.render !== 'function')
            {
                throw new Error(`${label} must provide render(target_world).`);
            }
            by_name.set(name, declaration as unknown as panel_declaration);
        }
        result.set(pack_id, by_name);
    }
    return result;
}
