/**
 * src/packs/basic_renderer/renderer.ts — 投影渲染主要入口
 */

import type { projection, render_options } from './types';
import { render_fallback_device } from './fallback';

export function render(proj: projection, options?: render_options): HTMLElement
{
    const cell_size = options?.cell_size ?? 32;
    const unit_px = cell_size / 2;
    const show_grid = options?.show_grid ?? true;

    const width_px = proj.size[0] * unit_px;
    const height_px = proj.size[1] * unit_px;

    const root = document.createElement('div');
    root.className = 'basic_renderer_viewport';
    root.style.position = 'relative';
    root.style.width = `${width_px}px`;
    root.style.height = `${height_px}px`;
    root.style.backgroundColor = '#1e1e1e';
    root.style.overflow = 'hidden';
    root.style.boxSizing = 'border-box';

    // 1. 繪製背景格線 (Grid)
    if (show_grid)
    {
        const grid_svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        grid_svg.setAttribute('width', `${width_px}`);
        grid_svg.setAttribute('height', `${height_px}`);
        grid_svg.style.position = 'absolute';
        grid_svg.style.left = '0';
        grid_svg.style.top = '0';
        grid_svg.style.pointerEvents = 'none';

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        const pattern_id = `grid_${Math.random().toString(36).slice(2, 9)}`;
        pattern.setAttribute('id', pattern_id);
        pattern.setAttribute('width', `${cell_size}`);
        pattern.setAttribute('height', `${cell_size}`);
        pattern.setAttribute('patternUnits', 'userSpaceOnUse');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${cell_size} 0 L 0 0 0 ${cell_size}`);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#333333');
        path.setAttribute('stroke-width', '1');

        pattern.appendChild(path);
        defs.appendChild(pattern);
        grid_svg.appendChild(defs);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', `url(#${pattern_id})`);

        grid_svg.appendChild(rect);
        root.appendChild(grid_svg);
    }

    // 2. 繪製裝置層 (Devices Layer)
    const devices_layer = document.createElement('div');
    devices_layer.className = 'basic_renderer_devices';
    devices_layer.style.position = 'absolute';
    devices_layer.style.left = '0';
    devices_layer.style.top = '0';
    devices_layer.style.width = '100%';
    devices_layer.style.height = '100%';

    for (const dev of proj.devices)
    {
        let dev_elem: HTMLElement | null = null;
        if (typeof (dev as any).draw === 'function')
        {
            const result = (dev as any).draw(options);
            if (result instanceof HTMLElement)
            {
                dev_elem = result;
                if (!dev_elem.style.position)
                {
                    dev_elem.style.position = 'absolute';
                }
                if (!dev_elem.style.left)
                {
                    dev_elem.style.left = `${dev.position[0] * unit_px}px`;
                }
                if (!dev_elem.style.top)
                {
                    dev_elem.style.top = `${dev.position[1] * unit_px}px`;
                }
            }
        }

        if (!dev_elem)
        {
            dev_elem = render_fallback_device(dev, options);
        }

        devices_layer.appendChild(dev_elem);
    }

    root.appendChild(devices_layer);

    return root;
}
