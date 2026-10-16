import * as world from '@/world';
import { list_panels, panel_label } from './extensions';
import { check_layout } from './layout_tree';
import type { layout_node, layout_panel } from './layout_tree';
import { create_group } from './group';
import type { group_view } from './group';

/**
 * 掛上的一個 panel。收合、展開作用在它所在 group 的那個子區塊上。
 */
export interface panel_handle
{
    readonly content:     HTMLElement;
    readonly collapsible: boolean;
    is_collapsed(): boolean;
    collapse(): void;
    expand(): void;
}

export interface ui_root
{
    readonly element: HTMLElement;
    /** pack_id → panel 名稱 → handle */
    readonly panels:  ReadonlyMap<string, ReadonlyMap<string, panel_handle>>;
}

/**
 * 在 container 內建立全頁唯一的根容器，依版面樹（layout）放置各 pack 宣告的 panel。
 * DOM 先在 container 外建好，全部成功才放進 container；中途報錯時 container 不變。
 * container 需已接上 document，且有確定的寬高（根容器為 100% × 100%）。
 */
export function mount_ui_root(container: HTMLElement, target_world: world.pure_world, layout: layout_node): ui_root
{
    const doc = container.ownerDocument;
    if (!container.isConnected)
    {
        throw new Error('container must be attached to the document.');
    }
    if (doc.querySelector('[data-basic_ui_root]') !== null)
    {
        throw new Error('A basic_ui root is already mounted in this document.');
    }
    const declarations = list_panels(target_world.catalog.registry);
    check_layout(layout, declarations);

    const panels = new Map<string, Map<string, panel_handle>>();
    const seen = new Set<HTMLElement>();

    /**
     * 呼叫 render 並登記 handle。render 必須回傳全新、未放置的元素（同一元素被兩個 panel 共用時會被搬走）。
     */
    function mount_panel(node: layout_panel, group: (() => group_view) | null, index: number, collapsible: boolean): HTMLElement
    {
        const { namespace, id } = node.panel;
        const label = panel_label(namespace, id);
        const content = declarations.get(namespace)!.get(id)!.render(target_world);
        if (content.parentNode !== null || seen.has(content))
        {
            throw new Error(`${label}: render must return a new element that is not placed anywhere.`);
        }
        seen.add(content);
        content.dataset.basic_ui_pack = namespace;
        content.dataset.basic_ui_name = id;
        const refuse = (): never =>
        {
            throw new Error(`${label} is not collapsible.`);
        };
        const handle: panel_handle = group !== null && collapsible
            ? {
                content,
                collapsible: true,
                is_collapsed: () => group().is_collapsed(index),
                collapse: () => group().set_collapsed(index, true),
                expand: () => group().set_collapsed(index, false)
            }
            : { content, collapsible: false, is_collapsed: () => false, collapse: refuse, expand: refuse };
        if (!panels.has(namespace))
        {
            panels.set(namespace, new Map());
        }
        panels.get(namespace)!.set(id, handle);
        return content;
    }

    function build(node: layout_node): HTMLElement
    {
        if (node.kind === 'panel')
        {
            return mount_panel(node, null, 0, false);
        }
        // handle 在 group 建好後才會被呼叫，所以以函式延後取得 group
        let group: group_view | null = null;
        const elements = node.children.map((child, i) => (child.node.kind === 'group'
            ? build(child.node)
            : mount_panel(child.node, () => group!, i, child.collapsible)));
        group = create_group(doc, node.axis, node.children, elements);
        return group.element;
    }

    const element = doc.createElement('div');
    element.dataset.basic_ui_root = '';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.overflow = 'hidden';
    element.appendChild(build(layout));
    container.appendChild(element);
    return { element, panels };
}
