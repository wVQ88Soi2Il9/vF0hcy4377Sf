import type { panel, panel_direction } from './definition';

export interface resize_handle
{
    readonly element: HTMLElement;
    cancel(): void;
}

function get_size(target: HTMLElement, direction: panel_direction): number
{
    const bounds = target.getBoundingClientRect();
    return direction === 'row' ? bounds.width : bounds.height;
}

function get_min_size(target: HTMLElement, direction: panel_direction): number
{
    const style = getComputedStyle(target);
    const value = parseFloat(direction === 'row' ? style.minWidth : style.minHeight);
    return Number.isFinite(value) ? value : 0;
}

function get_max_size(target: HTMLElement, direction: panel_direction): number
{
    const style = getComputedStyle(target);
    const value = parseFloat(direction === 'row' ? style.maxWidth : style.maxHeight);
    return Number.isFinite(value) ? value : Infinity;
}

function freeze_size(target: panel, size: number): void
{
    target.element.classList.add('panel_pack_runtime_size');
    target.element.classList.remove('panel_pack_resizable_size');
    target.element.style.setProperty('--panel-pack-runtime-size', `${size}px`);
}

function set_resizable_size(target: panel, size: number): void
{
    freeze_size(target, size);
    target.element.classList.add('panel_pack_resizable_size');
}

export function clear_resize_size(target: panel): void
{
    target.element.classList.remove('panel_pack_runtime_size');
    target.element.classList.remove('panel_pack_resizable_size');
    target.element.style.removeProperty('--panel-pack-runtime-size');
}

export function create_resize_handle
(
    panels:    readonly panel[],
    index:     number,
    direction: panel_direction
): resize_handle
{
    const handle = document.createElement('div');
    handle.className = `panel_pack_resize_handle ${direction}`;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', direction === 'row' ? 'vertical' : 'horizontal');

    let pointer_id: number | null = null;
    let start_coordinate = 0;
    let start_previous_size = 0;
    let start_next_size = 0;
    let minimum_previous_size = 0;
    let maximum_previous_size = 0;

    const previous = panels[index];
    const next = panels[index + 1];

    function finish_drag(event: PointerEvent): void
    {
        if (event.pointerId !== pointer_id)
        {
            return;
        }

        set_resizable_size(previous, get_size(previous.element, direction));
        set_resizable_size(next, get_size(next.element, direction));
        pointer_id = null;
        handle.classList.remove('is_dragging');
    }

    function cancel(): void
    {
        if (pointer_id === null)
        {
            return;
        }

        if (handle.hasPointerCapture(pointer_id))
        {
            handle.releasePointerCapture(pointer_id);
        }

        pointer_id = null;
        handle.classList.remove('is_dragging');
    }

    handle.addEventListener('pointerdown', (event: PointerEvent) =>
    {
        if (!event.isPrimary || event.button !== 0)
        {
            return;
        }

        const sizes = panels.map(panel => get_size(panel.element, direction));
        panels.forEach((panel, panel_index) => freeze_size(panel, sizes[panel_index]));

        pointer_id = event.pointerId;
        start_coordinate = direction === 'row' ? event.clientX : event.clientY;
        start_previous_size = sizes[index];
        start_next_size = sizes[index + 1];
        const available_size = start_previous_size + start_next_size;
        minimum_previous_size = Math.max
        (
            0,
            get_min_size(previous.element, direction),
            available_size - get_max_size(next.element, direction)
        );
        maximum_previous_size = Math.min
        (
            available_size,
            get_max_size(previous.element, direction),
            available_size - get_min_size(next.element, direction)
        );
        if (minimum_previous_size > maximum_previous_size)
        {
            minimum_previous_size = start_previous_size;
            maximum_previous_size = start_previous_size;
        }

        handle.classList.add('is_dragging');
        handle.setPointerCapture(event.pointerId);
        event.preventDefault();
    });

    handle.addEventListener('pointermove', (event: PointerEvent) =>
    {
        if (event.pointerId !== pointer_id)
        {
            return;
        }

        const coordinate = direction === 'row' ? event.clientX : event.clientY;
        const available_size = start_previous_size + start_next_size;
        const desired_size = start_previous_size + coordinate - start_coordinate;
        const previous_size = Math.max(minimum_previous_size, Math.min(maximum_previous_size, desired_size));

        freeze_size(previous, previous_size);
        freeze_size(next, available_size - previous_size);
        event.preventDefault();
    });

    handle.addEventListener('pointerup', finish_drag);
    handle.addEventListener('pointercancel', finish_drag);

    return { element: handle, cancel };
}
