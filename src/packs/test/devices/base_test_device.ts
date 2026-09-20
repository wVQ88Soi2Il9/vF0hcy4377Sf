import * as core from '@/core';
import type { drawable_device, render_options } from '@/packs/basic_renderer';

export interface device_color_theme
{
    fill: string;
    border: string;
}

export abstract class base_test_device extends core.device implements drawable_device
{
    protected abstract readonly shape: core.vector[];
    protected abstract readonly input_ports: core.vector[];
    protected abstract readonly output_ports: core.vector[];
    protected abstract readonly color: device_color_theme;

    public get_shape(): core.vector[]
    {
        return this.shape.map(cell => [...cell]);
    }

    public get_port(): core.port[]
    {
        return [
            ...this.input_ports.map((offset, port_uid) => ({ port_uid, offset: [...offset], direction: 'input' as const })),
            ...this.output_ports.map((offset, index) => ({
                port_uid: this.input_ports.length + index,
                offset: [...offset],
                direction: 'output' as const
            }))
        ];
    }

    public draw(options?: render_options): HTMLElement
    {
        const cell_size = options?.cell_size ?? 32;
        const unit = cell_size / 2;
        const shape = this.get_shape();
        const width = Math.max(...shape.map(cell => cell[0] ?? 0)) + 2;
        const height = Math.max(...shape.map(cell => cell[1] ?? 0)) + 2;
        const root = document.createElement('div');
        root.title = `${this.definition_id.namespace}:${this.definition_id.id} #${this.device_uid}`;
        root.style.width = `${width * unit}px`;
        root.style.height = `${height * unit}px`;

        for (const cell of shape)
        {
            const element = document.createElement('span');
            element.style.position = 'absolute';
            element.style.left = `${(cell[0] ?? 0) * unit}px`;
            element.style.top = `${(cell[1] ?? 0) * unit}px`;
            element.style.width = `${cell_size}px`;
            element.style.height = `${cell_size}px`;
            element.style.boxSizing = 'border-box';
            element.style.background = this.color.fill;
            element.style.border = `2px solid ${this.color.border}`;
            root.append(element);
        }

        if (options?.show_labels ?? true)
        {
            const label = document.createElement('strong');
            label.textContent = `#${this.device_uid}`;
            label.style.position = 'absolute';
            label.style.inset = '0';
            label.style.display = 'grid';
            label.style.placeItems = 'center';
            label.style.color = '#ffffff';
            root.append(label);
        }
        return root;
    }
}
