import type { axis, css_length, layout_child } from './layout_tree';

/**
 * 分割線沿軸的固定寬度（px）。
 */
export const separator_size = 4;

/**
 * 一個 group 的 DOM 與狀態。尺寸交給瀏覽器的 flexbox：
 * 每個 slot 為 flex: <weight> 1 0px，並以 min/max-width（或 height）設上下限（可用任何 CSS 長度）；
 * 容器縮放時由瀏覽器依 weights 等比分配、夾在上下限內，放不下所有 min 時溢出捲動。
 * 收合把 slot 固定為 collapsed_size 並隱藏鄰接的分割線，展開恢復原 weight。
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
    limits:     [number, number][];
    changed:    boolean;
}

function to_css(value: css_length): string
{
    if (typeof value === 'string')
    {
        return value;
    }
    return value === Infinity ? 'none' : `${value}px`;
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
    element.dataset.panel_group = group_axis;
    element.style.display = 'flex';
    element.style.flexDirection = group_axis === 'x' ? 'row' : 'column';
    element.style.overflow = 'auto';
    element.style.width = '100%';
    element.style.height = '100%';

    // 掛載時檢查所有 CSS 長度字串：瀏覽器不接受的值會被忽略，這裡改為報錯。
    // 拖曳時要把 min/max 換成 px，混用百分比的 calc() / max() 等算不出來，也在這裡拒絕
    for (const child of children)
    {
        // 每個值用它實際寫入的屬性檢查（例如 'none' 只對 max 合法）；collapsed_size 同時寫進 min 與 max
        const lengths: [css_length, string[]][] = [[child.min, ['min-width']], [child.max, ['max-width']]];
        if (child.collapsible)
        {
            lengths.push([child.collapsed_size, ['min-width', 'max-width']]);
        }
        for (const [value, properties] of lengths)
        {
            if (typeof value !== 'string')
            {
                continue;
            }
            if (!properties.every(property => doc.defaultView!.CSS.supports(property, value)))
            {
                throw new Error(`Invalid CSS length "${value}".`);
            }
            if (value.includes('%') && !/^\s*[\d.]+%\s*$/.test(value))
            {
                throw new Error(`CSS length "${value}" mixes a percentage into an expression, which a drag cannot resolve to px.`);
            }
        }
    }

    function apply(): void
    {
        children.forEach((child, i) =>
        {
            const slot = slots[i];
            if (collapsed[i] && child.collapsible)
            {
                const pinned = to_css(child.collapsed_size);
                slot.style.flex = `0 0 ${pinned}`;
                slot.style[min_length] = pinned;
                slot.style[max_length] = pinned;
            }
            else
            {
                slot.style.flex = `${weights[i]} 1 0px`;
                slot.style[min_length] = to_css(child.min);
                slot.style[max_length] = to_css(child.max);
            }
            slot.dataset.panel_collapsed = String(collapsed[i]);
        });
        separators.forEach((separator, i) =>
        {
            separator.hidden = collapsed[i] || collapsed[i + 1];
        });
    }

    /**
     * 把 slot 計算後的 min/max 換成 px：'none' 為 Infinity，百分比相對於 group 沿軸的長度。
     */
    function computed_px(slot: HTMLElement, property: 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight'): number
    {
        const value = doc.defaultView!.getComputedStyle(slot)[property];
        if (value === 'none')
        {
            return Infinity;
        }
        if (value.endsWith('px'))
        {
            return parseFloat(value);
        }
        if (value.endsWith('%'))
        {
            return parseFloat(value) / 100 * element.getBoundingClientRect()[length];
        }
        throw new Error(`Cannot resolve ${property} "${value}" to px.`);
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
        delete separators[index].dataset.panel_dragging;
        if (separators[index].hasPointerCapture(pointer_id))
        {
            separators[index].releasePointerCapture(pointer_id);
        }
    }

    /**
     * 拖曳第 index 條分割線：只動兩側，各自夾在上下限內；展開中子區塊的 weights 改為與目前 px 成比例
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
        const { start, limits } = drag;
        const lo = Math.max(limits[0][0] - start[a], start[b] - limits[1][1]);
        const hi = Math.min(limits[0][1] - start[a], start[b] - limits[1][0]);
        const d = Math.min(hi, Math.max(lo, event[main] - drag.start_at));
        // 還沒真正改變尺寸（原地按下、溢出時兩側都卡在上下限）就不動 weights，保留原比例
        if (!drag.changed && d === 0)
        {
            return;
        }
        drag.changed = true;
        const next = [...start];
        next[a] = Math.min(limits[0][1], Math.max(limits[0][0], start[a] + d));
        next[b] = Math.min(limits[1][1], Math.max(limits[1][0], start[b] - d));

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
        separator.dataset.panel_separator = String(index);
        separator.setAttribute('role', 'separator');
        // x group 的分割線是直線，y group 的是橫線
        separator.setAttribute('aria-orientation', group_axis === 'x' ? 'vertical' : 'horizontal');
        separator.style.flex = `0 0 ${separator_size}px`;
        separator.style.cursor = group_axis === 'x' ? 'col-resize' : 'row-resize';
        separator.style.touchAction = 'none';

        separator.addEventListener('pointerdown', event =>
        {
            if (!event.isPrimary || event.button !== 0 || drag !== null || collapsed[index] || collapsed[index + 1])
            {
                return;
            }
            // 和 CSS 一樣，min 大於 max 時以 min 為準
            const limits: [number, number][] = [index, index + 1].map(i =>
            {
                const min = computed_px(slots[i], min_length);
                return [min, Math.max(min, computed_px(slots[i], max_length))] as [number, number];
            });
            event.preventDefault();
            separator.setPointerCapture(event.pointerId);
            separator.dataset.panel_dragging = '';
            // 次像素誤差可能略超出上下限
            const start = slots.map(slot => slot.getBoundingClientRect()[length]);
            start[index] = Math.min(limits[0][1], Math.max(limits[0][0], start[index]));
            start[index + 1] = Math.min(limits[1][1], Math.max(limits[1][0], start[index + 1]));
            drag = { pointer_id: event.pointerId, index, start_at: event[main], start, limits, changed: false };
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
        slot.dataset.panel_slot = String(i);
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
