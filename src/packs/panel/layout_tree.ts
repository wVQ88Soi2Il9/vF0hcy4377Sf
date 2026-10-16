import * as core from '@/core';
import { panel_label } from './extensions';
import type { panel_declarations } from './extensions';

export type axis = 'x' | 'y';

/**
 * 版面樹：由掛載者傳入。group（內部節點）沿 axis 切分；panel（葉節點）以 namespace（pack_id）/ id（panel 名稱）引用宣告。
 */
export type layout_node = layout_group | layout_panel;

export interface layout_group
{
    kind:     'group';
    axis:     axis;
    children: layout_child[];
}

export interface layout_panel
{
    kind:  'panel';
    panel: core.namespaced_id;
}

/**
 * 長度：數字為 px（max 可為 Infinity），字串為任何 CSS 長度（例如 '25vw'、'max(25vw, 450px)'、'none'）。
 */
export type css_length = number | string;

/**
 * group 的一個子區塊（樹的邊）。size 為比例（容器長度剛好等於 size 總和時即為 px）；
 * min、max 為沿父 group 軸的上下限。只有 panel 子區塊可以收合，且必須給 collapsed_size。
 */
export type layout_child =
    | { node: layout_node;  size: number; min: css_length; max: css_length; collapsible: false }
    | { node: layout_panel; size: number; min: css_length; max: css_length; collapsible: true; collapsed_size: css_length };

/**
 * 檢查型別表達不了的語意：數值範圍、group 不為空、引用的 panel 存在、每個宣告的 panel 恰好出現一次。
 */
export function check_layout(layout: layout_node, declarations: panel_declarations): void
{
    const placed = new Map<string, Set<string>>();

    function visit(node: layout_node, path: string): void
    {
        if (node.kind === 'panel')
        {
            const { namespace, id } = node.panel;
            const label = panel_label(namespace, id);
            if (!declarations.get(namespace)?.has(id))
            {
                throw new Error(`${path} refers to unknown ${label}.`);
            }
            if (!placed.has(namespace))
            {
                placed.set(namespace, new Set());
            }
            if (placed.get(namespace)!.has(id))
            {
                throw new Error(`${path} places ${label} more than once.`);
            }
            placed.get(namespace)!.add(id);
            return;
        }
        if (node.children.length === 0)
        {
            throw new Error(`${path} has no children.`);
        }
        node.children.forEach((child, i) =>
        {
            const at = `${path}.children[${i}]`;
            if (!(Number.isFinite(child.size) && child.size >= 0))
            {
                throw new Error(`${at}.size must be a finite non-negative number, got ${child.size}.`);
            }
            // 數字（px）之間的關係可以先檢查；CSS 字串由瀏覽器解析，寫錯時在建立 group 時報錯
            const { min, max } = child;
            if (typeof min === 'number' && !(Number.isFinite(min) && min >= 0))
            {
                throw new Error(`${at}.min must be a finite non-negative number, got ${min}.`);
            }
            if (typeof max === 'number' && !(max >= 0))
            {
                throw new Error(`${at}.max must be a non-negative number, got ${max}.`);
            }
            // 各自為數字的那一邊就檢查
            if ((typeof min === 'number' && child.size < min) || (typeof max === 'number' && child.size > max))
            {
                throw new Error(`${at} needs min ≤ size ≤ max, got ${min} / ${child.size} / ${max}.`);
            }
            if (child.collapsible && typeof child.collapsed_size === 'number' && !(Number.isFinite(child.collapsed_size) && child.collapsed_size >= 0 && (typeof min !== 'number' || child.collapsed_size <= min)))
            {
                throw new Error(`${at}.collapsed_size must be a finite number in [0, min], got ${child.collapsed_size}.`);
            }
            visit(child.node, `${at}.node`);
        });
    }

    visit(layout, 'layout');
    for (const [pack_id, by_name] of declarations)
    {
        for (const name of by_name.keys())
        {
            if (!placed.get(pack_id)?.has(name))
            {
                throw new Error(`${panel_label(pack_id, name)} is declared but not placed in the layout.`);
            }
        }
    }
}
