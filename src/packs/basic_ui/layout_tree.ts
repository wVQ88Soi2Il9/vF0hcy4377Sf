import * as core from '@/core';
import { check_limit } from './layout_math';
import type { panel_declarations } from './extensions';
import { check_keys, panel_label } from './validate';

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

type placed = Map<string, Set<string>>;

function check_child(value: unknown, path: string, used: placed, declarations: panel_declarations): void
{
    const child = check_keys(value, ['node', 'size', 'min', 'max', 'collapsible', 'collapsed_size'], path);
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
    if (collapsible)
    {
        const c = child.collapsed_size;
        if (typeof c !== 'number' || !Number.isFinite(c) || c < 0 || c > min)
        {
            throw new Error(`${path}.collapsed_size must be a number in [0, min] when collapsible.`);
        }
        if (check_keys(child.node, null, `${path}.node`).kind !== 'panel')
        {
            throw new Error(`${path}: only panel children can be collapsible.`);
        }
    }
    else if ('collapsed_size' in child)
    {
        throw new Error(`${path}.collapsed_size is only allowed when collapsible.`);
    }
    check_node(child.node, `${path}.node`, used, declarations);
}

function check_node(value: unknown, path: string, used: placed, declarations: panel_declarations): void
{
    const kind = check_keys(value, null, path).kind;
    if (kind === 'group')
    {
        const group = check_keys(value, ['kind', 'axis', 'children'], path);
        if (group.axis !== 'x' && group.axis !== 'y')
        {
            throw new Error(`${path}.axis must be "x" or "y".`);
        }
        if (!Array.isArray(group.children) || group.children.length === 0)
        {
            throw new Error(`${path}.children must be a non-empty array.`);
        }
        for (let i = 0; i < group.children.length; i++)
        {
            check_child(group.children[i], `${path}.children[${i}]`, used, declarations);
        }
        return;
    }
    if (kind === 'panel')
    {
        const panel = check_keys(value, ['kind', 'panel'], path);
        const { namespace, id } = check_keys(panel.panel, ['namespace', 'id'], `${path}.panel`);
        if (typeof namespace !== 'string' || typeof id !== 'string')
        {
            throw new Error(`${path}.panel must have string namespace and id.`);
        }
        if (!declarations.get(namespace)?.has(id))
        {
            throw new Error(`${path} refers to unknown ${panel_label(namespace, id)}.`);
        }
        if (!used.has(namespace))
        {
            used.set(namespace, new Set());
        }
        if (used.get(namespace)!.has(id))
        {
            throw new Error(`${path} places ${panel_label(namespace, id)} more than once.`);
        }
        used.get(namespace)!.add(id);
        return;
    }
    throw new Error(`${path}.kind must be "group" or "panel".`);
}

/**
 * 驗證版面樹：結構與數值、引用的 panel 都存在、每個宣告的 panel 恰好出現一次。
 */
export function check_layout(layout: unknown, declarations: panel_declarations): layout_node
{
    const used: placed = new Map();
    check_node(layout, 'layout', used, declarations);
    for (const [pack_id, by_name] of declarations)
    {
        for (const name of by_name.keys())
        {
            if (!used.get(pack_id)?.has(name))
            {
                throw new Error(`${panel_label(pack_id, name)} is declared but not placed in the layout.`);
            }
        }
    }
    return layout as layout_node;
}
