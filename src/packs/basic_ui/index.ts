import { get_renderer_canvas, resize_renderer_canvas } from '@/packs/basic_renderer';
import { create_ui_layout } from './layout';

/**
 * basic_ui entry point.
 * Initializes the main UI layout, attaches it to the DOM host (#app),
 * embeds the canvas element into the viewport container, and sets up ResizeObserver
 * to sync viewport dimensions with the renderer.
 */
export function init_pack(): void
{
    const host = document.getElementById('app') ?? document.body;
    const { root, viewport } = create_ui_layout();

    host.appendChild(root);

    const canvas = get_renderer_canvas();
    if (canvas)
    {
        viewport.appendChild(canvas);
    }

    const observer = new ResizeObserver((entries) =>
    {
        for (const entry of entries)
        {
            const { width, height } = entry.contentRect;
            resize_renderer_canvas(Math.floor(width), Math.floor(height));
        }
    });

    observer.observe(viewport);
}



