/**
 * Splitter Component & Controller
 *
 * 建立可拖曳調整相鄰容器尺寸的分割線元件。
 */

export interface splitter_options
{
    direction:  'vertical' | 'horizontal';
    prev_el:    HTMLElement;
    next_el:    HTMLElement;
    min_prev?:  number;
    min_next?:  number;
    on_resize?: () => void;
}

export interface splitter_component
{
    element: HTMLElement;
    destroy: () => void;
}

export function create_splitter(options: splitter_options): splitter_component
{
    const element = document.createElement('div');
    const is_vertical = options.direction === 'vertical';
    element.className = `basic_ui_splitter ${is_vertical ? 'vertical' : 'horizontal'}`;

    let start_coord = 0;
    let start_prev_size = 0;
    let start_next_size = 0;
    let is_dragging = false;

    function on_mouse_move(e: MouseEvent): void
    {
        if (!is_dragging)
        {
            return;
        }

        const current_coord = is_vertical ? e.clientX : e.clientY;
        const delta = current_coord - start_coord;

        const min_prev = options.min_prev ?? (is_vertical ? 200 : 40);
        const min_next = options.min_next ?? (is_vertical ? 200 : 40);

        const total_size = start_prev_size + start_next_size;
        let new_prev_size = start_prev_size + delta;
        let new_next_size = start_next_size - delta;

        if (new_prev_size < min_prev)
        {
            new_prev_size = min_prev;
            new_next_size = total_size - min_prev;
        }
        else if (new_next_size < min_next)
        {
            new_next_size = min_next;
            new_prev_size = total_size - min_next;
        }

        options.prev_el.style.flex = `${new_prev_size}`;
        options.next_el.style.flex = `${new_next_size}`;

        if (options.on_resize)
        {
            options.on_resize();
        }
    }

    function on_mouse_up(): void
    {
        if (!is_dragging)
        {
            return;
        }
        is_dragging = false;
        element.classList.remove('is_dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', on_mouse_move);
        window.removeEventListener('mouseup', on_mouse_up);
    }

    element.addEventListener('mousedown', (e: MouseEvent) =>
    {
        if (e.button !== 0)
        {
            return;
        }
        is_dragging = true;
        element.classList.add('is_dragging');
        start_coord = is_vertical ? e.clientX : e.clientY;
        start_prev_size = is_vertical ? options.prev_el.offsetWidth : options.prev_el.offsetHeight;
        start_next_size = is_vertical ? options.next_el.offsetWidth : options.next_el.offsetHeight;

        document.body.style.cursor = is_vertical ? 'col-resize' : 'row-resize';
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', on_mouse_move);
        window.addEventListener('mouseup', on_mouse_up);
        e.preventDefault();
    });

    return {
        element,
        destroy: () =>
        {
            on_mouse_up();
        }
    };
}
