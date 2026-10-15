import * as core from '@/core';
import { check_limit } from './layout_math';
import type { panel_declarations } from './extensions';
import { own_fields, dense_array, panel_label, show } from './validate';

export type axis = 'x' | 'y';

/**
 * 版面樹：由掛載者傳入。group 沿 axis 切分；panel 以 namespace（pack_id）/ id（panel 名稱）引用宣告。
 */
export type layout_node = layout_group | layout_panel;

export interface layout_group
{
    readonly kind:     'group';
    readonly axis:     axis;
    readonly children: readonly layout_child[];
}

export interface layout_panel
{
    readonly kind:  'panel';
    readonly panel: Readonly<core.namespaced_id>;
}

/**
 * group 的一個子區塊。size、min、max 為沿父 group 軸的 px 長度；max 可為 Infinity。
 * collapsible 為 true 時必須給 collapsed_size（0 ≤ collapsed_size ≤ min）；為 false 時不可給。
 * 只有 panel 子區塊可以收合（收合透過 panel 的 handle）。
 */
export type layout_child = layout_child_fixed | layout_child_collapsible;

interface layout_child_base
{
    readonly node: layout_node;
    readonly size: number;
    readonly min:  number;
    readonly max:  number;
}

export interface layout_child_fixed extends layout_child_base
{
    readonly collapsible: false;
}

export interface layout_child_collapsible extends layout_child_base
{
    readonly collapsible:    true;
    readonly collapsed_size: number;
}

/**
 * 驗證時的狀態：已放置的 panel（pack_id → 名稱）與已走過的節點物件（防止同一節點被重複引用或成環）。
 */
interface placement
{
    panels: Map<string, Set<string>>;
    nodes:  Set<object>;
}

function check_child(value: unknown, path: string, used: placement, declarations: panel_declarations): layout_child
{
    const child = own_fields(value, ['node', 'size', 'min', 'max', 'collapsible', 'collapsed_size'], path);
    const { size, min, max, collapsible } = child;
    if (typeof size !== 'number' || typeof min !== 'number' || typeof max !== 'number')
    {
        throw new Error(`${path} must provide numeric size, min and max.`);
    }
    check_limit({ min, max }, path);
    if (!Number.isFinite(size) || size < min || size > max)
    {
        throw new Error(`${path}.size = ${size} is outside [${min}, ${max}].`);
    }
    if (typeof collapsible !== 'boolean')
    {
        throw new Error(`${path}.collapsible must be a boolean.`);
    }

    if (!collapsible)
    {
        if ('collapsed_size' in child)
        {
            throw new Error(`${path}.collapsed_size is only allowed when collapsible.`);
        }
        const node = check_node(child.node, `${path}.node`, used, declarations);
        return Object.freeze({ node, size, min, max, collapsible: false });
    }

    const collapsed_size = child.collapsed_size;
    if (typeof collapsed_size !== 'number' || !Number.isFinite(collapsed_size) || collapsed_size < 0 || collapsed_size > min)
    {
        throw new Error(`${path}.collapsed_size must be a number in [0, min] when collapsible, got ${show(collapsed_size)}.`);
    }
    const node = check_node(child.node, `${path}.node`, used, declarations);
    if (node.kind !== 'panel')
    {
        throw new Error(`${path}: only panel children can be collapsible.`);
    }
    return Object.freeze({ node, size, min, max, collapsible: true, collapsed_size });
}

function check_node(value: unknown, path: string, used: placement, declarations: panel_declarations): layout_node
{
    if (typeof value === 'object' && value !== null)
    {
        if (used.nodes.has(value))
        {
            throw new Error(`${path} reuses a node object that already appears in the layout.`);
        }
        used.nodes.add(value);
    }
    const node = own_fields(value, ['kind', 'axis', 'children', 'panel'], path);

    if (node.kind === 'group')
    {
        if ('panel' in node)
        {
            throw new Error(`${path} has unknown key "panel".`);
        }
        const axis = node.axis;
        if (axis !== 'x' && axis !== 'y')
        {
            throw new Error(`${path}.axis must be "x" or "y", got ${show(axis)}.`);
        }
        const raw_children = dense_array(node.children, `${path}.children`);
        if (raw_children.length === 0)
        {
            throw new Error(`${path}.children must be a non-empty array.`);
        }
        const children = raw_children.map((child, i) => check_child(child, `${path}.children[${i}]`, used, declarations));
        return Object.freeze({ kind: 'group', axis, children: Object.freeze(children) });
    }

    if (node.kind === 'panel')
    {
        for (const key of ['axis', 'children'])
        {
            if (key in node)
            {
                throw new Error(`${path} has unknown key "${key}".`);
            }
        }
        const ref = own_fields(node.panel, ['namespace', 'id'], `${path}.panel`);
        const { namespace, id } = ref;
        if (typeof namespace !== 'string' || typeof id !== 'string')
        {
            throw new Error(`${path}.panel must have string namespace and id.`);
        }
        if (!declarations.get(namespace)?.has(id))
        {
            throw new Error(`${path} refers to unknown ${panel_label(namespace, id)}.`);
        }
        if (!used.panels.has(namespace))
        {
            used.panels.set(namespace, new Set());
        }
        const placed = used.panels.get(namespace)!;
        if (placed.has(id))
        {
            throw new Error(`${path} places ${panel_label(namespace, id)} more than once.`);
        }
        placed.add(id);
        return Object.freeze({ kind: 'panel', panel: Object.freeze({ namespace, id }) });
    }

    throw new Error(`${path}.kind must be "group" or "panel", got ${show(node.kind)}.`);
}

/**
 * 驗證版面樹：結構與數值、引用的 panel 都存在、每個宣告的 panel 恰好出現一次。
 * 只讀自身資料屬性，回傳凍結的副本；之後修改傳入的物件不影響結果。
 */
export function check_layout(layout: unknown, declarations: panel_declarations): layout_node
{
    const used: placement = { panels: new Map(), nodes: new Set() };
    const result = check_node(layout, 'layout', used, declarations);
    for (const [pack_id, by_name] of declarations)
    {
        for (const name of by_name.keys())
        {
            if (!used.panels.get(pack_id)?.has(name))
            {
                throw new Error(`${panel_label(pack_id, name)} is declared but not placed in the layout.`);
            }
        }
    }
    return result;
}
