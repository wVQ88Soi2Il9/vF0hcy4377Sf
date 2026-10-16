import * as world from '@/world';
import { list_panels } from './extensions';
import { check_layout } from './layout_tree';
import type { layout_node } from './layout_tree';
import { create_group } from './group';
import type { group_view } from './group';
import { panel_label } from './validate';

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
 * 先驗證 container、宣告與版面樹，再呼叫所有 render 並檢查結果，最後才建立 DOM 並放進 container。
 * container 需已接上 document，且有確定的寬高（根容器為 100% × 100%）。
 */
export function mount_ui_root(container: HTMLElement, target_world: world.pure_world, layout: unknown): ui_root
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
    const tree = check_layout(layout, declarations);

    // 先呼叫所有 render：結果必須是全新、未放置、彼此不同的 HTMLElement
    const contents = new Map<string, Map<string, HTMLElement>>();
    const seen = new Set<HTMLElement>();
    for (const [pack_id, by_name] of declarations)
    {
        const rendered = new Map<string, HTMLElement>();
        for (const [name, declaration] of by_name)
        {
            const label = panel_label(pack_id, name);
            const content = declaration.render(target_world);
            if (!(content instanceof HTMLElement))
            {
                throw new Error(`${label}: render must return an HTMLElement.`);
            }
            if (content.parentNode !== null || seen.has(content))
            {
                throw new Error(`${label}: render must return a new element that is not placed anywhere.`);
            }
            seen.add(content);
            rendered.set(name, content);
        }
        contents.set(pack_id, rendered);
    }

    const panels = new Map<string, Map<string, panel_handle>>();

    function register(pack_id: string, name: string, content: HTMLElement, group: group_view | null, index: number, collapsible: boolean): void
    {
        content.dataset.basic_ui_pack = pack_id;
        content.dataset.basic_ui_name = name;
        const refuse = (): never =>
        {
            throw new Error(`${panel_label(pack_id, name)} is not collapsible.`);
        };
        const handle: panel_handle = group !== null && collapsible
            ? {
                content,
                collapsible: true,
                is_collapsed: () => group.is_collapsed(index),
                collapse: () => group.collapse(index),
                expand: () => group.expand(index)
            }
            : { content, collapsible: false, is_collapsed: () => false, collapse: refuse, expand: refuse };
        if (!panels.has(pack_id))
        {
            panels.set(pack_id, new Map());
        }
        panels.get(pack_id)!.set(name, handle);
    }

    function content_of(node: layout_node & { kind: 'panel' }): HTMLElement
    {
        return contents.get(node.panel.namespace)!.get(node.panel.id)!;
    }

    function build(node: layout_node & { kind: 'group' }): HTMLElement
    {
        const elements = node.children.map(child => (child.node.kind === 'panel' ? content_of(child.node) : build(child.node)));
        const group = create_group(doc, node.axis, node.children, elements);
        node.children.forEach((child, i) =>
        {
            if (child.node.kind === 'panel')
            {
                register(child.node.panel.namespace, child.node.panel.id, elements[i], group, i, child.collapsible);
            }
        });
        return group.element;
    }

    const element = doc.createElement('div');
    element.dataset.basic_ui_root = '';
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.overflow = 'hidden';
    if (tree.kind === 'panel')
    {
        const content = content_of(tree);
        register(tree.panel.namespace, tree.panel.id, content, null, 0, false);
        element.appendChild(content);
    }
    else
    {
        element.appendChild(build(tree));
    }

    container.appendChild(element);
    return { element, panels };
}
