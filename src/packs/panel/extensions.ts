import * as core from '@/core';
import * as world from '@/world';

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
 * 錯誤訊息中標示一個 panel；分開列出 pack 與名稱，避免含冒號的名稱產生歧義。
 */
export function panel_label(pack_id: string, name: string): string
{
    return `panel ${JSON.stringify(name)} of pack ${JSON.stringify(pack_id)}`;
}

/**
 * 依 registry 順序讀各 pack 的 other_info.basic_ui.panels。
 * other_info 的型別是 Record<string, unknown>，TypeScript 檢查不到，所以執行期確認 render 是函式。
 */
export function list_panels(registry: core.pack_registry): panel_declarations
{
    const result = new Map<string, Map<string, panel_declaration>>();
    for (const [pack_id, pack] of registry)
    {
        const info = pack.other_info?.['panel'] as { panels: Record<string, panel_declaration> } | undefined;
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
