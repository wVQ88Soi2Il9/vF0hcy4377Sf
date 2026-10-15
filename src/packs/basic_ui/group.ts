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
 * - weights：比例，只在使用者拖曳（有實際移動）之後、以及展開結果與現有比例不同時由 sizes 更新；收合不更新。
 *   sizes 受整體上下限強制（溢出、剛好等於 min 總和、容器為 0、全部到 max）時不更新；收合中的子區塊保留原 weight。
 */
export interface group_view
{
    readonly element: HTMLElement;
    readonly slots:   readonly HTMLElement[];
    layout(total: number): void;
    is_collapsed(index: number): boolean;
    collapse(index: number): void;
    expand(index: number): void;
    get_sizes(): number[];
    stop(): void;
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
    if (children.length !== children_elements.length || children.length === 0)
    {
        throw new Error('create_group needs one element per child.');
    }

    const main = group_axis === 'x' ? 'clientX' : 'clientY';
    const n = children.length;
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
    element.style.boxSizing = 'border-box';

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

    /**
     * sizes 是否由整體上下限強制決定，而非反映比例。
     */
    function forced(): boolean
    {
        const current = limits();
        return available <= sum(current.map(l => l.min)) + epsilon || available >= sum(current.map(l => l.max)) - epsilon;
    }

    function save_weights(): void
    {
        if (forced())
        {
            return;
        }
        weights = weights.map((w, i) => (collapsed[i] ? w : sizes[i]));
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

    /**
     * 結束拖曳；有實際移動時才以 sizes 更新 weights（只點一下不改比例）。
     */
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
        const separator = separators[index];
        if (separator.hasPointerCapture(pointer_id))
        {
            separator.releasePointerCapture(pointer_id);
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
            if (!event.isPrimary || event.button !== 0)
            {
                return;
            }
            // 拖曳狀態殘留（例如分割線曾被移出 DOM，lostpointercapture 送到 document）時先清掉
            if (drag !== null && !separators[drag.index].hasPointerCapture(drag.pointer_id))
            {
                end_drag();
            }
            if (drag !== null)
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
        slot.style.boxSizing = 'border-box';
        slot.style.minWidth = '0';
        slot.style.minHeight = '0';
        slot.appendChild(child_element);
        slots.push(slot);
        element.appendChild(slot);
    });

    function check_index(index: number): void
    {
        if (!Number.isInteger(index) || index < 0 || index >= n)
        {
            throw new Error(`Child index ${index} is out of range for ${n} children.`);
        }
    }

    function check_collapsible(index: number): layout_child & { collapsible: true }
    {
        check_index(index);
        const child = children[index];
        if (!child.collapsible)
        {
            throw new Error(`Child ${index} is not collapsible.`);
        }
        return child;
    }

    apply();

    return {
        element,
        slots,
        /**
         * 容器沿軸的長度改變：扣掉分割線後依 weights 分配；長度沒變（例如只有交叉軸變化）時不動。
         * 拖曳中先把目前的 sizes 存成 weights（保留使用者正在拖的結果），再以新尺寸為拖曳起點。
         */
        layout(total: number): void
        {
            if (!Number.isFinite(total) || total < 0)
            {
                throw new Error(`Group length must be a non-negative finite number, got ${total}.`);
            }
            if (total === last_total)
            {
                return;
            }
            last_total = total;
            if (drag !== null && drag.moved)
            {
                save_weights();
            }
            available = Math.max(0, total - separator_size * (n - 1));
            sizes = distribute(weights, limits(), available);
            if (drag !== null)
            {
                drag.start = [...sizes];
                drag.start_at = drag.last_at;
            }
            apply();
        },
        is_collapsed(index: number): boolean
        {
            check_index(index);
            return collapsed[index];
        },
        collapse(index: number): void
        {
            const child = check_collapsible(index);
            if (collapsed[index])
            {
                return;
            }
            end_drag();
            // 強制狀態下 sizes 不代表比例，改記 weight（上次使用者動作時的 px）
            remembered[index] = forced() ? weights[index] : sizes[index];
            collapsed[index] = true;
            // 收合騰出的空間只是暫時分給其他子區塊：不更新 weights，避免把部分夾限存成比例
            sizes = set_child_size(weights, limits(), index, child.collapsed_size, available);
            apply();
        },
        expand(index: number): void
        {
            check_collapsible(index);
            if (!collapsed[index])
            {
                return;
            }
            end_drag();
            collapsed[index] = false;
            sizes = set_child_size(weights, limits(), index, remembered[index], available);
            // 展開結果與現有比例的分配不同時才更新 weights（否則下一次縮放會依舊比例重排而跳動）；
            // 相同時保留 weights，避免把鄰居的夾限存成比例
            const proportional = distribute(weights, limits(), available);
            if (sizes.some((size, i) => Math.abs(size - proportional[i]) > epsilon))
            {
                save_weights();
            }
            apply();
        },
        get_sizes: () => [...sizes],
        /**
         * 卸載時呼叫：結束拖曳且不更新 weights。
         */
        stop(): void
        {
            if (drag !== null)
            {
                const { index, pointer_id } = drag;
                drag = null;
                if (separators[index].hasPointerCapture(pointer_id))
                {
                    separators[index].releasePointerCapture(pointer_id);
                }
            }
        }
    };
}
