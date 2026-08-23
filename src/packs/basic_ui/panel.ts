import './style.css';

export interface resize_config
{
    left?:       boolean;
    right?:      boolean;
    top?:        boolean;
    bottom?:     boolean;
    min_width?:  number;
    max_width?:  number | (() => number);
    min_height?: number;
    max_height?: number | (() => number);
}

export interface panel_options
{
    id:                 string;
    tag?:               string;
    position_css?:      string;
    default_width?:     string;
    default_height?:    string;
    title?:             string | HTMLElement;
    collapsible?:       boolean;
    default_collapsed?: boolean;
    resize?:            resize_config;
    extra_css?:         string;
}

export interface panel_component
{
    element:         HTMLElement;
    header_element:  HTMLElement;
    title_container: HTMLElement;
    content_element: HTMLElement;
    is_collapsed:    () => boolean;
    set_collapsed:   (collapsed: boolean) => void;
}

function attach_resize_handle
(
    parent:    HTMLElement,
    direction: 'left' | 'right' | 'top' | 'bottom',
    get_min:   () => number,
    get_max:   () => number
): HTMLElement
{
    const handle = document.createElement('div');
    handle.className = `basic_ui_resize_handle ${direction}`;
    const is_horizontal = direction === 'left' || direction === 'right';

    let start_coord = 0;
    let start_size  = 0;

    function on_mouse_move(e: MouseEvent): void
    {
        const current_coord = is_horizontal ? e.clientX : e.clientY;
        const delta = (direction === 'left' || direction === 'top')
            ? start_coord - current_coord
            : current_coord - start_coord;
        const clamped = Math.max(get_min(), Math.min(get_max(), start_size + delta));
        if (is_horizontal)
        {
            parent.style.width = `${clamped}px`;
        }
        else
        {
            parent.style.height = `${clamped}px`;
        }
    }

    function on_mouse_up(): void
    {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', on_mouse_move);
        window.removeEventListener('mouseup', on_mouse_up);
    }

    handle.addEventListener('mousedown', (e) =>
    {
        start_coord = is_horizontal ? e.clientX : e.clientY;
        start_size  = is_horizontal ? parent.offsetWidth : parent.offsetHeight;
        document.body.style.cursor = is_horizontal ? 'ew-resize' : 'ns-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', on_mouse_move);
        window.addEventListener('mouseup', on_mouse_up);
        e.preventDefault();
    });

    parent.appendChild(handle);
    return handle;
}

/**
 * Creates a floating panel component styled with style.css and interactive resize/collapse capabilities.
 */
export function create_floating_panel(options: panel_options): panel_component
{
    const element = document.createElement(options.tag ?? 'aside');
    element.id = options.id;
    element.className = 'basic_ui_panel';

    let inline_css = '';
    if (options.position_css)
    {
        inline_css += `${options.position_css} `;
    }
    if (options.default_width)
    {
        inline_css += `width: ${options.default_width}; `;
    }
    if (options.default_height)
    {
        inline_css += `height: ${options.default_height}; `;
    }
    if (options.extra_css)
    {
        inline_css += `${options.extra_css} `;
    }
    if (inline_css)
    {
        element.style.cssText = inline_css;
    }

    if (options.resize?.min_width !== undefined)
    {
        element.style.minWidth = `${options.resize.min_width}px`;
    }
    if (options.resize?.min_height !== undefined)
    {
        element.style.minHeight = `${options.resize.min_height}px`;
    }

    const header_element = document.createElement('header');
    header_element.className = 'basic_ui_header';

    const title_container = document.createElement('div');
    title_container.className = 'basic_ui_title';

    if (typeof options.title === 'string')
    {
        const title_el = document.createElement('h3');
        title_el.textContent = options.title;
        title_container.appendChild(title_el);
    }
    else if (options.title instanceof HTMLElement)
    {
        title_container.appendChild(options.title);
    }

    header_element.appendChild(title_container);

    const content_element = document.createElement('div');
    content_element.className = 'basic_ui_content';

    element.appendChild(header_element);
    element.appendChild(content_element);

    let collapse_btn: HTMLButtonElement | null = null;

    function set_collapsed(collapsed: boolean): void
    {
        element.classList.toggle('is_collapsed', collapsed);
        if (collapse_btn)
        {
            collapse_btn.textContent = collapsed ? '+' : '−';
        }
    }

    if (options.collapsible)
    {
        collapse_btn = document.createElement('button');
        collapse_btn.className = 'basic_ui_collapse_btn';
        collapse_btn.title = 'Collapse / Expand panel';
        collapse_btn.textContent = options.default_collapsed ? '+' : '−';
        collapse_btn.addEventListener('click', () =>
        {
            set_collapsed(!element.classList.contains('is_collapsed'));
        });
        header_element.appendChild(collapse_btn);

        if (options.default_collapsed)
        {
            set_collapsed(true);
        }
    }

    if (options.resize)
    {
        const r = options.resize;
        const resolve = (val: number | (() => number) | undefined, fallback: number) =>
            typeof val === 'function' ? val() : typeof val === 'number' ? val : fallback;

        const get_min_w = () => r.min_width ?? 200;
        const get_max_w = () => resolve(r.max_width, window.innerWidth - 32);
        const get_min_h = () => r.min_height ?? 60;
        const get_max_h = () => resolve(r.max_height, window.innerHeight - 32);

        if (r.left)
        {
            attach_resize_handle(element, 'left', get_min_w, get_max_w);
        }
        if (r.right)
        {
            attach_resize_handle(element, 'right', get_min_w, get_max_w);
        }
        if (r.top)
        {
            attach_resize_handle(element, 'top', get_min_h, get_max_h);
        }
        if (r.bottom)
        {
            attach_resize_handle(element, 'bottom', get_min_h, get_max_h);
        }
    }

    return {
        element,
        header_element,
        title_container,
        content_element,
        is_collapsed: () => element.classList.contains('is_collapsed'),
        set_collapsed
    };
}
