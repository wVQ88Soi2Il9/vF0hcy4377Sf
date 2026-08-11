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

export type device_draw_fn = (
    ctx:   CanvasRenderingContext2D,
    sx:    number,
    sy:    number,
    sw:    number,
    sh:    number,
    zoom:  number
) => void

const registry = new Map<string, device_draw_fn>()

/**
 * Register a draw function for a device definition.
 * Calling this again with the same id overwrites the previous registration.
 */
export function register_device_draw(definition_id: string, fn: device_draw_fn): void
{
    registry.set(definition_id, fn)
}

/**
 * Retrieve the registered draw function for a device definition.
 * Returns undefined if none is registered.
 */
export function get_device_draw(definition_id: string): device_draw_fn | undefined
{
    return registry.get(definition_id)
}
