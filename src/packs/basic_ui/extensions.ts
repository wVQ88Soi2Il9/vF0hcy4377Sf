import * as core from '@/core';
import * as world from '@/world';

export interface panel_declaration
{
    render(target_world: world.pure_world): HTMLElement;
}

export type panel_declarations = ReadonlyMap<string, ReadonlyMap<string, panel_declaration>>;

// 分開列出 pack 與名稱：名稱可能含冒號
export function panel_label(pack_id: string, name: string): string
{
    return `panel ${JSON.stringify(name)} of pack ${JSON.stringify(pack_id)}`;
}

// other_info 是 Record<string, unknown>，型別檢查不到，所以執行期確認 render
export function list_panels(registry: core.pack_registry): panel_declarations
{
    const result = new Map<string, Map<string, panel_declaration>>();
    for (const [pack_id, pack] of registry)
    {
        const info = pack.other_info?.['basic_ui'] as { panels: Record<string, panel_declaration> } | undefined;
        if (info === undefined)
        {
            continue;
        }
        const by_name = new Map<string, panel_declaration>();
        for (const [name, declaration] of Object.entries(info.panels))
        {
            if (typeof declaration?.render !== 'function')
            {
                throw new Error(`${panel_label(pack_id, name)} must provide render(target_world).`);
            }
            by_name.set(name, declaration);
        }
        result.set(pack_id, by_name);
    }
    return result;
}
