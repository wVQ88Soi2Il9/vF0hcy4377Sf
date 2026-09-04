/**
 * src/packs/basic_renderer/types.ts — basic_renderer 型別與資料契約
 */

import * as core from '@/core';

export interface render_options
{
    cell_size?:   number;
    show_grid?:   boolean;
    show_ports?:  boolean;
    show_labels?: boolean;
}

export interface drawable_device extends core.device
{
    draw(options?: render_options): HTMLElement;
}

export interface projection
{
    size:        core.vector;
    devices:     core.device[];
    other_info?: Record<string, unknown>;
}
