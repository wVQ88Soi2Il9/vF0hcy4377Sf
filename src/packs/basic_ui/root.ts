import * as world from '@/world';
import { create_panel } from './panel';
import type { panel } from './panel';
import { list_panels } from './extensions';

export interface ui_root
{
    element: HTMLElement;
    panels:  Map<string, Map<string, panel>>;
}

/**
 * 在 container 內建立全頁唯一的 UI 根容器，並依 registry 順序掛上各 pack 宣告的 panel；panels 為 pack_id → name → panel。
 * 同一份 document 已有根容器時報錯；所有 panel 建好後才放進 container。
 */
export function mount_ui_root(container: HTMLElement, target_world: world.pure_world): ui_root
{
    const doc = container.ownerDocument;
    if (doc.querySelector('[data-basic_ui_root]') !== null)
    {
        throw new Error('A basic_ui root is already mounted in this document.');
    }

    const element = doc.createElement('div');
    element.dataset.basic_ui_root = '';
    const panels = new Map<string, Map<string, panel>>();

    for (const entry of list_panels(target_world.catalog.registry))
    {
        const content = entry.declaration.render(target_world);
        if (!(content instanceof HTMLElement))
        {
            throw new Error(`Panel "${entry.pack_id}:${entry.name}": render must return an HTMLElement.`);
        }
        const p = create_panel(content, entry.declaration);
        p.element.dataset.basic_ui_pack = entry.pack_id;
        p.element.dataset.basic_ui_name = entry.name;
        if (!panels.has(entry.pack_id))
        {
            panels.set(entry.pack_id, new Map());
        }
        panels.get(entry.pack_id)!.set(entry.name, p);
        element.appendChild(p.element);
    }

    container.appendChild(element);
    return { element, panels };
}
