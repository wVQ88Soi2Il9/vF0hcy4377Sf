import { distribute, resize_pair, set_child_size } from './layout_math';
import type { limit } from './layout_math';
import type { axis, layout_child } from './layout_tree';

/**
 * 分割線沿軸的固定寬度（px），從 group 長度中扣除。
 */
export const separator_size = 4;

/**
 * 一個 group 的 DOM 與尺寸狀態。group 掌管所有子區塊的尺寸；分割線不存尺寸。
 * - sizes：目前各子區塊的 px 長度；
 * - weights：比例，拖曳結束與展開後由 sizes 更新；收合不更新；
 *   容器放不下所有 min（溢出或容器為 0）時不更新，因為此時 sizes 是 min 的退路而非比例。
 */
export interface group_view
{
    readonly element: HTMLElement;
    layout(total: number): void;
    is_collapsed(index: number): boolean;
    collapse(index: number): void;
    expand(index: number): void;
}

interface drag_state
{
    pointer_id: number;
    index:      number;
    start_at:   number;
    start:      number[];
    last_at:    number;
    moved:      boolean;
}

const epsilon = 1e-6;

function sum(values: number[]): number
{
    return values.reduce((a, b) => a + b, 0);
}

/**
 * 依版面樹的子區塊建立 group。children_elements[i] 放進第 i 個 slot。
 * 初始 sizes 與 weights 為版面樹給的 size；第一次 layout(total) 之後依容器長度分配。
 */
export function create_group(doc: Document, group_axis: axis, children: readonly layout_child[], children_elements: HTMLElement[]): group_view
{
    const main = group_axis === 'x' ? 'clientX' : 'clientY';
    const collapsed: boolean[] = children.map(() => false);
    const remembered: number[] = children.map(c => c.size);
    let sizes = children.map(c => c.size);
    let weights = children.map(c => c.size);
    let available = sum(sizes);
    let last_total: number | null = null;
    let drag: drag_state | null = null;

    const element = doc.createElement('div');
    element.dataset.basic_ui_group = group_axis;
    element.style.display = 'flex';
    element.style.flexDirection = group_axis === 'x' ? 'row' : 'column';
    element.style.overflow = 'auto';
    element.style.width = '100%';
    element.style.height = '100%';

    function limits(): limit[]
    {
        return children.map((c, i) =>
        {
            if (collapsed[i] && c.collapsible)
            {
                return { min: c.collapsed_size, max: c.collapsed_size };
            }
            return { min: c.min, max: c.max };
        });
    }

    function overflowing(): boolean
    {
        return available <= sum(limits().map(l => l.min)) + epsilon;
    }

    function save_weights(): void
    {
        if (!overflowing())
        {
            weights = weights.map((w, i) => (collapsed[i] ? w : sizes[i]));
        }
    }

    const slots: HTMLElement[] = [];
    const separators: HTMLElement[] = [];

    function apply(): void
    {
        slots.forEach((slot, i) =>
        {
            slot.style.flexBasis = `${sizes[i]}px`;
            slot.dataset.basic_ui_collapsed = String(collapsed[i]);
        });
    }

    function end_drag(): void
    {
        if (drag === null)
        {
            return;
        }
        // 先清除狀態：releasePointerCapture 可能同步觸發 lostpointercapture
        const { index, pointer_id, moved } = drag;
        drag = null;
        if (moved)
        {
            save_weights();
        }
        if (separators[index].hasPointerCapture(pointer_id))
        {
            separators[index].releasePointerCapture(pointer_id);
        }
    }

    function create_separator(index: number): HTMLElement
    {
        const separator = doc.createElement('div');
        separator.dataset.basic_ui_separator = String(index);
        separator.style.flex = `0 0 ${separator_size}px`;
        separator.style.cursor = group_axis === 'x' ? 'col-resize' : 'row-resize';
        separator.style.touchAction = 'none';

        separator.addEventListener('pointerdown', event =>
        {
            if (!event.isPrimary || event.button !== 0 || drag !== null)
            {
                return;
            }
            event.preventDefault();
            separator.setPointerCapture(event.pointerId);
            drag = { pointer_id: event.pointerId, index, start_at: event[main], start: [...sizes], last_at: event[main], moved: false };
        });
        separator.addEventListener('pointermove', event =>
        {
            if (drag === null || event.pointerId !== drag.pointer_id)
            {
                return;
            }
            drag.last_at = event[main];
            drag.moved = true;
            sizes = resize_pair(drag.start, limits(), drag.index, drag.last_at - drag.start_at);
            apply();
        });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
        {
            separator.addEventListener(type, event =>
            {
                if (drag !== null && (event as PointerEvent).pointerId === drag.pointer_id)
                {
                    end_drag();
                }
            });
        }
        return separator;
    }

    children_elements.forEach((child_element, i) =>
    {
        if (i > 0)
        {
            const separator = create_separator(i - 1);
            separators.push(separator);
            element.appendChild(separator);
        }
        const slot = doc.createElement('div');
        slot.dataset.basic_ui_slot = String(i);
        slot.style.flex = '0 0 auto';
        slot.style.overflow = 'hidden';
        slot.style.minWidth = '0';
        slot.style.minHeight = '0';
        slot.appendChild(child_element);
        slots.push(slot);
        element.appendChild(slot);
    });

    function collapsible_child(index: number): layout_child & { collapsible: true }
    {
        const child = children[index];
        if (child === undefined || !child.collapsible)
        {
            throw new Error(`Child ${index} is not collapsible.`);
        }
        return child;
    }

    apply();

    return {
        element,
        /**
         * 容器沿軸的長度改變時，扣掉分割線後依 weights 分配；長度沒變（只有交叉軸變化）時不動。
         * 拖曳中以新尺寸為拖曳起點，避免跳動。
         */
        layout(total: number): void
        {
            if (total === last_total)
            {
                return;
            }
            last_total = total;
            available = Math.max(0, total - separator_size * (children.length - 1));
            sizes = distribute(weights, limits(), available);
            if (drag !== null)
            {
                drag.start = [...sizes];
                drag.start_at = drag.last_at;
            }
            apply();
        },
        is_collapsed: (index: number) => collapsed[index],
        collapse(index: number): void
        {
            const child = collapsible_child(index);
            if (collapsed[index])
            {
                return;
            }
            end_drag();
            // 溢出時 sizes 是 min 的退路，改記 weight
            remembered[index] = overflowing() ? weights[index] : sizes[index];
            collapsed[index] = true;
            sizes = set_child_size(weights, limits(), index, child.collapsed_size, available);
            apply();
        },
        expand(index: number): void
        {
            collapsible_child(index);
            if (!collapsed[index])
            {
                return;
            }
            end_drag();
            collapsed[index] = false;
            sizes = set_child_size(weights, limits(), index, remembered[index], available);
            save_weights();
            apply();
        }
    };
}
