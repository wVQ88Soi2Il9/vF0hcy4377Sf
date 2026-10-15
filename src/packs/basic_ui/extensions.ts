import * as core from '@/core';
import * as world from '@/world';
import { own_fields, panel_label } from './validate';

/**
 * 下游 pack 在 other_info.basic_ui.panels 宣告的 panel：只提供內容，位置與尺寸由版面樹決定。
 */
export interface panel_declaration
{
    readonly render: (target_world: world.pure_world) => HTMLElement;
}

/**
 * pack_id → panel 名稱 → 宣告。
 */
export type panel_declarations = ReadonlyMap<string, ReadonlyMap<string, panel_declaration>>;

/**
 * 依 registry 順序讀各 pack 的 other_info.basic_ui.panels。
 * basic_ui 命名空間只接受 panels；每個宣告只接受 render。格式錯誤時報錯。
 * 只讀自身資料屬性，回傳凍結的宣告副本。
 */
export function list_panels(registry: core.pack_registry): panel_declarations
{
    const result = new Map<string, ReadonlyMap<string, panel_declaration>>();
    for (const [pack_id, pack] of registry)
    {
        // 只檢查自己的命名空間；其他命名空間的格式不歸 basic_ui 管
        const other_info: unknown = pack.other_info;
        if (other_info === undefined)
        {
            continue;
        }
        if (typeof other_info !== 'object' || other_info === null)
        {
            throw new Error(`Pack "${pack_id}": other_info must be an object.`);
        }
        if (!('basic_ui' in other_info))
        {
            continue;
        }
        const descriptor = Object.getOwnPropertyDescriptor(other_info, 'basic_ui');
        if (descriptor === undefined || !('value' in descriptor))
        {
            throw new Error(`Pack "${pack_id}": other_info.basic_ui must be an own data property.`);
        }
        const namespace = own_fields(descriptor.value, ['panels'], `Pack "${pack_id}": other_info.basic_ui`);
        const panels = own_fields(namespace.panels, null, `Pack "${pack_id}": other_info.basic_ui.panels`);

        const by_name = new Map<string, panel_declaration>();
        for (const name of Object.keys(panels))
        {
            const label = panel_label(pack_id, name);
            const declaration = own_fields(panels[name], ['render'], label);
            if (typeof declaration.render !== 'function')
            {
                throw new Error(`${label} must provide render(target_world).`);
            }
            by_name.set(name, Object.freeze({ render: declaration.render as panel_declaration['render'] }));
        }
        result.set(pack_id, by_name);
    }
    return result;
}
