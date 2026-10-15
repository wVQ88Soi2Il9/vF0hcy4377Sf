export type edge = 'left' | 'right' | 'top' | 'bottom';

export interface size
{
    width:  number;
    height: number;
}

export interface panel_options
{
    edges:    edge[];
    min_size: size;
    max_size: size;
}

export interface panel
{
    element:  HTMLElement;
    content:  HTMLElement;
    get_size(): size;
    set_size(next: size): void;
    is_collapsed(): boolean;
    set_collapsed(collapsed: boolean): void;
}

const all_edges: edge[] = ['left', 'right', 'top', 'bottom'];

function check_size(value: size, name: string): void
{
    for (const key of ['width', 'height'] as const)
    {
        if (!Number.isFinite(value[key]) || value[key] < 0)
        {
            throw new Error(`${name}.${key} must be a non-negative finite number, got ${value[key]}.`);
        }
    }
}

/**
 * 檢查 panel 選項：edges 不可重複且只能是四個邊之一；min_size 每一維不大於 max_size。
 */
export function check_panel_options(options: panel_options): void
{
    const seen = new Set<edge>();
    for (const e of options.edges)
    {
        if (!all_edges.includes(e))
        {
            throw new Error(`Unknown edge "${e}".`);
        }
        if (seen.has(e))
        {
            throw new Error(`Duplicate edge "${e}".`);
        }
        seen.add(e);
    }
    check_size(options.min_size, 'min_size');
    check_size(options.max_size, 'max_size');
    if (options.min_size.width > options.max_size.width || options.min_size.height > options.max_size.height)
    {
        throw new Error('min_size must not exceed max_size.');
    }
}

export function clamp_size(value: size, min_size: size, max_size: size): size
{
    return {
        width:  Math.min(max_size.width, Math.max(min_size.width, value.width)),
        height: Math.min(max_size.height, Math.max(min_size.height, value.height))
    };
}

/**
 * 從 edge 拖曳 (dx, dy) 後的尺寸：right / bottom 隨指標增長，left / top 反向。
 */
export function resize_by_edge(start: size, e: edge, dx: number, dy: number, min_size: size, max_size: size): size
{
    const next = { ...start };
    switch (e)
    {
        case 'right':  next.width  = start.width + dx;  break;
        case 'left':   next.width  = start.width - dx;  break;
        case 'bottom': next.height = start.height + dy; break;
        case 'top':    next.height = start.height - dy; break;
    }
    return clamp_size(next, min_size, max_size);
}

function create_handle(e: edge): HTMLElement
{
    const handle = document.createElement('div');
    handle.dataset.basic_ui_handle = e;
    handle.style.position = 'absolute';
    const horizontal = e === 'left' || e === 'right';
    handle.style.cursor = horizontal ? 'ew-resize' : 'ns-resize';
    handle.style[horizontal ? 'top' : 'left'] = '0';
    handle.style[horizontal ? 'bottom' : 'right'] = '0';
    handle.style[horizontal ? 'width' : 'height'] = '6px';
    handle.style[e] = '-3px';
    return handle;
}

/**
 * 以 content（div 或其他元素）建立 panel。初始尺寸為 min_size；
 * 只有 edges 列出的邊可拖曳調整大小，尺寸夾在 [min_size, max_size]；
 * 收合時隱藏 content 與拖曳把手，展開後恢復原尺寸。
 */
export function create_panel(content: HTMLElement, options: panel_options): panel
{
    check_panel_options(options);

    const element = document.createElement('div');
    element.dataset.basic_ui_panel = '';
    element.style.position = 'relative';
    element.appendChild(content);

    let current: size = { ...options.min_size };
    let collapsed = false;

    function apply_size(): void
    {
        element.style.width  = collapsed ? '' : `${current.width}px`;
        element.style.height = collapsed ? '' : `${current.height}px`;
    }

    const handles: HTMLElement[] = [];
    for (const e of options.edges)
    {
        const handle = create_handle(e);
        handle.addEventListener('pointerdown', down =>
        {
            down.preventDefault();
            const start = { ...current };
            const doc = element.ownerDocument;

            function on_move(move: PointerEvent): void
            {
                current = resize_by_edge(start, e, move.clientX - down.clientX, move.clientY - down.clientY,
                    options.min_size, options.max_size);
                apply_size();
            }
            function on_up(): void
            {
                doc.removeEventListener('pointermove', on_move);
                doc.removeEventListener('pointerup', on_up);
            }
            doc.addEventListener('pointermove', on_move);
            doc.addEventListener('pointerup', on_up);
        });
        handles.push(handle);
        element.appendChild(handle);
    }

    apply_size();

    return {
        element,
        content,
        get_size: () => ({ ...current }),
        set_size(next: size): void
        {
            check_size(next, 'size');
            const clamped = clamp_size(next, options.min_size, options.max_size);
            if (clamped.width !== next.width || clamped.height !== next.height)
            {
                throw new Error(`Size ${next.width}x${next.height} is outside [min_size, max_size].`);
            }
            current = { ...next };
            apply_size();
        },
        is_collapsed: () => collapsed,
        set_collapsed(next: boolean): void
        {
            collapsed = next;
            content.hidden = collapsed;
            for (const handle of handles)
            {
                handle.hidden = collapsed;
            }
            element.dataset.basic_ui_collapsed = String(collapsed);
            apply_size();
        }
    };
}
