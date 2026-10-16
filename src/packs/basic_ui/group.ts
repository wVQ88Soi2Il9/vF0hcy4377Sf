import type { axis, layout_child } from './layout_tree';

/**
 * 分割線沿軸的固定寬度（px）。
 */
export const separator_size = 4;

/**
 * 一個 group 的 DOM 與狀態。尺寸交給瀏覽器的 flexbox：
 * 每個 slot 為 flex: <weight> 1 0px，並以 min/max-width（或 height）設上下限；
 * 容器縮放時由瀏覽器依 weights 等比分配、夾在上下限內，放不下所有 min 時溢出捲動。
 * 收合把 slot 固定為 collapsed_size，展開恢復原 weight。
 */
export interface group_view
{
    readonly element: HTMLElement;
    is_collapsed(index: number): boolean;
    set_collapsed(index: number, collapsed: boolean): void;
}

interface drag_state
{
    pointer_id: number;
    index:      number;
    start_at:   number;
    start:      number[];
    changed:    boolean;
}

function clamp(value: number, child: layout_child): number
{
    return Math.min(child.max, Math.max(child.min, value));
}

export function create_group(doc: Document, group_axis: axis, children: layout_child[], children_elements: HTMLElement[]): group_view
{
    const main = group_axis === 'x' ? 'clientX' : 'clientY';
    const length = group_axis === 'x' ? 'width' : 'height';
    const min_length = group_axis === 'x' ? 'minWidth' : 'minHeight';
    const max_length = group_axis === 'x' ? 'maxWidth' : 'maxHeight';
    const weights = children.map(c => c.size);
    const collapsed = children.map(() => false);
    const slots: HTMLElement[] = [];
    const separators: HTMLElement[] = [];
    let drag: drag_state | null = null;

    const element = doc.createElement('div');
    element.dataset.basic_ui_group = group_axis;
    element.style.display = 'flex';
    element.style.flexDirection = group_axis === 'x' ? 'row' : 'column';
    element.style.overflow = 'auto';
    element.style.width = '100%';
    element.style.height = '100%';

    function apply(): void
    {
        children.forEach((child, i) =>
        {
            const slot = slots[i];
            const pinned = collapsed[i] && child.collapsible ? child.collapsed_size : null;
            slot.style.flex = pinned === null ? `${weights[i]} 1 0px` : `0 0 ${pinned}px`;
            slot.style[min_length] = `${pinned ?? child.min}px`;
            slot.style[max_length] = pinned !== null ? `${pinned}px` : child.max === Infinity ? 'none' : `${child.max}px`;
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
        const { index, pointer_id } = drag;
        drag = null;
        if (separators[index].hasPointerCapture(pointer_id))
        {
            separators[index].releasePointerCapture(pointer_id);
        }
    }

    /**
     * 拖曳第 index 條分割線：只動兩側，各自夾在上下限內；其餘子區塊的 weights 改為與目前 px 成比例
     * （維持原 weight 總和），flexbox 依此分配會剛好重現畫面，不會跳動。
     */
    function on_move(event: PointerEvent): void
    {
        if (drag === null || event.pointerId !== drag.pointer_id)
        {
            return;
        }
        const a = drag.index;
        const b = a + 1;
        const start = drag.start;
        const lo = Math.max(children[a].min - start[a], start[b] - children[b].max);
        const hi = Math.min(children[a].max - start[a], start[b] - children[b].min);
        const d = Math.min(hi, Math.max(lo, event[main] - drag.start_at));
        // 還沒真正改變尺寸（原地按下、溢出時兩側都卡在上下限）就不動 weights，保留原比例
        if (!drag.changed && d === 0)
        {
            return;
        }
        drag.changed = true;
        const next = [...start];
        next[a] = clamp(start[a] + d, children[a]);
        next[b] = clamp(start[b] - d, children[b]);

        const open = children.map((_, i) => i).filter(i => !collapsed[i]);
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
            // 次像素誤差可能讓量到的 px 略超出上下限，夾回去
            const start = slots.map((slot, i) => (collapsed[i] ? 0 : clamp(slot.getBoundingClientRect()[length], children[i])));
            drag = { pointer_id: event.pointerId, index, start_at: event[main], start, changed: false };
        });
        separator.addEventListener('pointermove', on_move);
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

    apply();

    return {
        element,
        is_collapsed: (index: number) => collapsed[index],
        set_collapsed(index: number, value: boolean): void
        {
            end_drag();
            collapsed[index] = value;
            apply();
        }
    };
}
