/**
 * Draw Registry
 *
 * Pack developers register a draw function for each device_definition they own.
 * The renderer calls the registered function when drawing that device on screen.
 *
 * Usage (from inside a pack):
 *
 *   import { register_device_draw } from '@/packs/basic_renderer/draw_registry'
 *
 *   register_device_draw('my_pack:my_device', (ctx, sx, sy, sw, sh, zoom) =>
 *   {
 *       ctx.drawImage(my_sprite, sx, sy, sw, sh)
 *   })
 *
 * Parameters passed to the draw function:
 *   ctx   — Canvas 2D context
 *   sx    — Screen X of the bounding box top-left corner
 *   sy    — Screen Y of the bounding box top-left corner
 *   sw    — Screen width  of the bounding box (spans all visible cells)
 *   sh    — Screen height of the bounding box (spans all visible cells)
 *   zoom  — Pixels per one world-coordinate unit (useful for relative sizing)
 *
 * The bounding box is computed from the visible cells of the device on the
 * current view plane. Cells that do not lie on the current cross-section slice
 * are excluded before the bounding box is calculated.
 *
 * If no draw function is registered for a device, the renderer falls back to
 * drawing a solid red rectangle over the bounding box.
 */

import type { device, device_definition } from '@/core/types';
import type { camera_type } from './types';

export type device_draw_fn = (
    ctx:     CanvasRenderingContext2D,
    sx:      number,
    sy:      number,
    sw:      number,
    sh:      number,
    zoom:    number,
    device?: device,
    def?:    device_definition,
    camera?: camera_type
) => void;

export interface color_block_info
{
    color?:  string;
    border?: string;
    label?:  string;
}

const registry = new Map<string, device_draw_fn>();

/**
 * Creates a standalone draw function that renders a solid color block with optional border and label.
 */
export function create_color_block_draw_fn(info?: color_block_info): device_draw_fn
{
    return function draw_color_block
    (
        ctx:  CanvasRenderingContext2D,
        sx:   number,
        sy:   number,
        sw:   number,
        sh:   number,
        zoom: number
    ): void
    {
        if (info)
        {
            ctx.fillStyle = info.color || '#FF0000';
            ctx.fillRect(sx, sy, sw, sh);

            if (info.border)
            {
                ctx.strokeStyle = info.border;
                ctx.lineWidth = Math.max(1, zoom * 0.04);
                ctx.strokeRect(sx, sy, sw, sh);
            }

            if (info.label)
            {
                ctx.fillStyle = info.border || '#FFFFFF';
                ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(info.label, sx + sw / 2, sy + sh / 2);
            }
        }
        else
        {
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(sx, sy, sw, sh);
        }
    };
}

/**
 * Register a draw function for a device definition.
 * Calling this again with the same id overwrites the previous registration.
 */
export function register_device_draw(definition_id: string, fn: device_draw_fn): void
{
    registry.set(definition_id, fn);
}

/**
 * Helper to register a color block draw function for a device definition.
 */
export function register_color_block_draw(definition_id: string, info?: color_block_info): void
{
    registry.set(definition_id, create_color_block_draw_fn(info));
}

/**
 * Retrieve the registered draw function for a device definition.
 * Returns undefined if none is registered.
 */
export function get_device_draw(definition_id: string): device_draw_fn | undefined
{
    return registry.get(definition_id);
}


