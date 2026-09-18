import type { fill_panels_options, panel, panel_layout } from './definition';
import { clear_resize_size, create_resize_handle, type resize_handle } from './resize';
import './style.css';

export function fill_panels
(
    target:  HTMLElement,
    panels:  readonly panel[],
    options: fill_panels_options = {}
): panel_layout
{
    const direction = options.direction ?? 'row';
    const children: HTMLElement[] = [];
    const resize_handles: resize_handle[] = [];

    function reset_sizes(): void
    {
        resize_handles.forEach(handle => handle.cancel());
        panels.forEach(clear_resize_size);
    }

    target.style.display = 'flex';
    target.style.flexDirection = direction;

    panels.forEach((panel, index) =>
    {
        children.push(panel.element);

        if (index < panels.length - 1)
        {
            const handle = create_resize_handle(panels, index, direction);
            resize_handles.push(handle);
            children.push(handle.element);
        }
    });

    target.replaceChildren(...children);

    return {
        resize_handles: resize_handles.map(handle => handle.element),
        reset_sizes
    };
}
