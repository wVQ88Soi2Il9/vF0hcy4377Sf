/**
 * src/packs/basic_renderer/fallback.ts — 裝置預設降級渲染器
 */

import * as core from '@/core';
import type { render_options } from './types';

export function render_fallback_device(dev: core.device, options?: render_options): HTMLElement
{
    const cell_size = options?.cell_size ?? 32;
    const unit_px = cell_size / 2;
    const show_ports = options?.show_ports ?? true;
    const show_labels = options?.show_labels ?? true;

    const container = document.createElement('div');
    container.className = 'device_fallback';
    container.style.position = 'absolute';
    container.style.left = `${dev.position[0] * unit_px}px`;
    container.style.top = `${dev.position[1] * unit_px}px`;
    container.style.pointerEvents = 'auto';

    // 1. 繪製單元格 (Cells)
    const shapes = dev.get_shape();
    for (const cell of shapes)
    {
        const cell_elem = document.createElement('div');
        cell_elem.className = 'device_cell';
        cell_elem.style.position = 'absolute';
        cell_elem.style.left = `${cell[0] * unit_px}px`;
        cell_elem.style.top = `${cell[1] * unit_px}px`;
        cell_elem.style.width = `${cell_size}px`;
        cell_elem.style.height = `${cell_size}px`;
        cell_elem.style.boxSizing = 'border-box';
        cell_elem.style.backgroundColor = '#2c3e50';
        cell_elem.style.border = '1px solid #7f8c8d';
        cell_elem.style.borderRadius = '3px';
        container.appendChild(cell_elem);
    }

    // 2. 繪製裝置標籤 (Label)
    if (show_labels && shapes.length > 0)
    {
        const label_elem = document.createElement('div');
        label_elem.className = 'device_label';
        label_elem.style.position = 'absolute';
        label_elem.style.left = `${shapes[0][0] * unit_px}px`;
        label_elem.style.top = `${shapes[0][1] * unit_px}px`;
        label_elem.style.width = `${cell_size}px`;
        label_elem.style.height = `${cell_size}px`;
        label_elem.style.display = 'flex';
        label_elem.style.alignItems = 'center';
        label_elem.style.justifyContent = 'center';
        label_elem.style.fontSize = '10px';
        label_elem.style.color = '#ecf0f1';
        label_elem.style.overflow = 'hidden';
        label_elem.style.textOverflow = 'ellipsis';
        label_elem.style.whiteSpace = 'nowrap';
        label_elem.style.userSelect = 'none';
        label_elem.title = `${dev.definition_id.namespace}:${dev.definition_id.id} (#${dev.device_uid})`;
        label_elem.textContent = dev.definition_id.id.slice(0, 4);
        container.appendChild(label_elem);
    }

    // 3. 繪製端口 (Ports)
    if (show_ports)
    {
        const ports = dev.get_port();
        for (const port of ports)
        {
            const port_elem = document.createElement('div');
            port_elem.className = `device_port port_${port.direction}`;
            port_elem.style.position = 'absolute';
            const port_radius = 5;
            port_elem.style.left = `${port.offset[0] * unit_px - port_radius}px`;
            port_elem.style.top = `${port.offset[1] * unit_px - port_radius}px`;
            port_elem.style.width = `${port_radius * 2}px`;
            port_elem.style.height = `${port_radius * 2}px`;
            port_elem.style.borderRadius = '50%';
            port_elem.style.boxSizing = 'border-box';
            port_elem.style.zIndex = '2';

            if (port.direction === 'input')
            {
                port_elem.style.backgroundColor = '#3498db';
                port_elem.style.border = '1px solid #ffffff';
                port_elem.title = `Port #${port.port_uid} (Input)`;
            }
            else if (port.direction === 'output')
            {
                port_elem.style.backgroundColor = '#e67e22';
                port_elem.style.border = '1px solid #ffffff';
                port_elem.title = `Port #${port.port_uid} (Output)`;
            }
            else
            {
                port_elem.style.backgroundColor = '#9b59b6';
                port_elem.style.border = '1px solid #ffffff';
                port_elem.title = `Port #${port.port_uid} (Bidirectional)`;
            }

            container.appendChild(port_elem);
        }
    }

    return container;
}
