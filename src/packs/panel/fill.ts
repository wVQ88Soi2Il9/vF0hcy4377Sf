import type { fill_panels_options, panel } from './definition';
import { create_resize_handle } from './resize';
import './style.css';

export function fill_panels
(
    target:  HTMLElement,
    panels:  readonly panel[],
    options: fill_panels_options = {}
): void
{
    const direction = options.direction ?? 'row';
    const children: HTMLElement[] = [];

    target.style.display = 'flex';
    target.style.flexDirection = direction;

    panels.forEach((panel, index) =>
    {
        children.push(panel.element);

        if (index < panels.length - 1)
        {
            children.push(create_resize_handle(panels, index, direction));
        }
    });

    target.replaceChildren(...children);
}
