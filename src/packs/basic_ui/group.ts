import { resize_pair } from './layout_math';
import type { limit } from './layout_math';
import type { axis, layout_child } from './layout_tree';

/**
 * 分割線沿軸的固定寬度（px）。
 */
export const separator_size = 4;

/**
 * 一個 group 的 DOM 與狀態。尺寸交給瀏覽器的 flexbox：
 * 每個 slot 為 flex: <weight> 1 0px，並以 min/max-width（或 height）設上下限；
 * 容器縮放時由瀏覽器依 weights 等比分配、夾在上下限內，放不下所有 min 時溢出捲動。
 * 拖曳時把展開中子區塊的 weights 設為目前的 px（兩側為拖曳後的新 px）；收合把該 slot 固定為 collapsed_size。
 */
export interface group_view
{
    readonly element: HTMLElement;
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
    changed:    boolean;
}

export function create_group(doc: Document, group_axis: axis, children: readonly layout_child[], children_elements: HTMLElement[]): group_view
{
    const main = group_axis === 'x' ? 'clientX' : 'clientY';
    const length = group_axis === 'x' ? 'width' : 'height';
    const min_length = group_axis === 'x' ? 'minWidth' : 'minHeight';
    const max_length = group_axis === 'x' ? 'maxWidth' : 'maxHeight';
    const weights = children.map(c => c.size);
    const collapsed: boolean[] = children.map(() => false);
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

    const slots: HTMLElement[] = [];
    const separators: HTMLElement[] = [];

    function apply(): void
    {
        const current = limits();
        slots.forEach((slot, i) =>
        {
            slot.style.flex = collapsed[i] ? `0 0 ${current[i].min}px` : `${weights[i]} 1 0px`;
            slot.style[min_length] = `${current[i].min}px`;
            slot.style[max_length] = current[i].max === Infinity ? 'none' : `${current[i].max}px`;
            slot.dataset.basic_ui_collapsed = String(collapsed[i]);
        });
    }

    /**
     * 量目前各 slot 的 px；次像素誤差可能略超出上下限，夾回去。
     */
    function measure(): number[]
    {
        const current = limits();
        return slots.map((slot, i) => Math.min(current[i].max, Math.max(current[i].min, slot.getBoundingClientRect()[length])));
    }

    function end_drag(): void
    {
        if (drag === null)
        {
            return;
        }
        // 先清除狀態：releasePointerCapture 可能同步觸發 lostpointercapture
        const { index, pointer_id } = drag;
        drag = null;
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
            // 鄰接收合中的子區塊時不拖曳：收合的 weight 要留給展開時使用
            if (!event.isPrimary || event.button !== 0 || drag !== null || collapsed[index] || collapsed[index + 1])
            {
                return;
            }
            event.preventDefault();
            separator.setPointerCapture(event.pointerId);
            drag = { pointer_id: event.pointerId, index, start_at: event[main], start: measure(), changed: false };
        });
        separator.addEventListener('pointermove', event =>
        {
            if (drag === null || event.pointerId !== drag.pointer_id)
            {
                return;
            }
            const next = resize_pair(drag.start, limits(), drag.index, event[main] - drag.start_at);
            // 還沒真正改變尺寸（原地按下、溢出時兩側都卡在上下限）就不動 weights，保留原比例
            if (!drag.changed && next[drag.index] === drag.start[drag.index])
            {
                return;
            }
            drag.changed = true;
            // 展開中的子區塊 weights 改為與目前 px 成比例：flexbox 依此分配會剛好重現畫面，其他子區塊不會跳動。
            // 縮放成原本的 weight 總和，讓收合中子區塊的 weight 仍在同一個尺度，展開時大小不變
            const open = next.map((_, i) => i).filter(i => !collapsed[i]);
            const old_sum = open.reduce((total, i) => total + weights[i], 0);
            const new_sum = open.reduce((total, i) => total + next[i], 0);
            if (new_sum > 0)
            {
                for (const i of open)
                {
                    weights[i] = next[i] * old_sum / new_sum;
                }
                apply();
            }
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
        slot.style.overflow = 'hidden';
        slot.appendChild(child_element);
        slots.push(slot);
        element.appendChild(slot);
    });

    function collapsible_child(index: number): void
    {
        const child = children[index];
        if (child === undefined || !child.collapsible)
        {
            throw new Error(`Child ${index} is not collapsible.`);
        }
    }

    apply();

    return {
        element,
        is_collapsed: (index: number) => collapsed[index],
        collapse(index: number): void
        {
            collapsible_child(index);
            end_drag();
            collapsed[index] = true;
            apply();
        },
        expand(index: number): void
        {
            collapsible_child(index);
            end_drag();
            collapsed[index] = false;
            apply();
        }
    };
}
