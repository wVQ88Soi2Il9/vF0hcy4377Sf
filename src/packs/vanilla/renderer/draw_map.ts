import type { game_map, device, vector } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import { get_device_definition } from '@/core/pack_manager'
import { get_world_cells } from '@/utils/device_utils'

/**
 * Camera state controlling pan and zoom of the map view.
 */
export interface camera
{
    /** World-space cell size in pixels before scale is applied. */
    base_cell_size: number

    /** Zoom multiplier applied on top of base_cell_size. */
    scale: number

    /** Screen-space pixel offset for panning (applied after projection). */
    offset_x: number
    offset_y: number
}

export function create_default_camera(): camera
{
    return {
        base_cell_size: 16,
        scale: 1,
        offset_x: 0,
        offset_y: 0
    }
}

/**
 * Projects a world-grid vector to 2D screen coordinates using a top-down
 * (not isometric) view: x -> screen x, y -> screen y, z is ignored for now
 * (layers are drawn back-to-front by caller if needed).
 *
 * Kept simple/top-down intentionally so the initial UI is easy to read;
 * swap this function out later for a true isometric projection if desired.
 */
export function project_to_screen(pos: vector, cam: camera, canvas_width: number, canvas_height: number): { x: number; y: number }
{
    const cell_px = cam.base_cell_size * cam.scale

    return {
        x: canvas_width / 2 + cam.offset_x + pos.x * cell_px,
        y: canvas_height / 2 + cam.offset_y + pos.y * cell_px
    }
}

const device_colors: Record<string, string> =
{
    default: '#7c5cff'
}

function get_device_color(definition_id: string): string
{
    return device_colors[definition_id] ?? device_colors.default
}

/**
 * Draws the grid background lines for the map bounds.
 */
function draw_grid(ctx: CanvasRenderingContext2D, map: game_map, cam: camera, canvas_width: number, canvas_height: number): void
{
    ctx.strokeStyle = '#2e303a'
    ctx.lineWidth = 1

    for (let x = 0; x <= map.size.x; x++)
    {
        const start = project_to_screen({ x, y: 0, z: 0 }, cam, canvas_width, canvas_height)
        const end = project_to_screen({ x, y: map.size.y, z: 0 }, cam, canvas_width, canvas_height)

        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
    }

    for (let y = 0; y <= map.size.y; y++)
    {
        const start = project_to_screen({ x: 0, y, z: 0 }, cam, canvas_width, canvas_height)
        const end = project_to_screen({ x: map.size.x, y, z: 0 }, cam, canvas_width, canvas_height)

        ctx.beginPath()
        ctx.moveTo(start.x, start.y)
        ctx.lineTo(end.x, end.y)
        ctx.stroke()
    }
}

/**
 * Draws a single device as filled cells plus its unique_id label.
 */
function draw_device(ctx: CanvasRenderingContext2D, dev: device, cells: vector[], cam: camera, canvas_width: number, canvas_height: number): void
{
    const cell_px = cam.base_cell_size * cam.scale
    ctx.fillStyle = get_device_color(dev.definition_id)

    for (const cell of cells)
    {
        const screen_pos = project_to_screen(cell, cam, canvas_width, canvas_height)
        ctx.fillRect(screen_pos.x, screen_pos.y, cell_px, cell_px)
        ctx.strokeStyle = '#16171d'
        ctx.strokeRect(screen_pos.x, screen_pos.y, cell_px, cell_px)
    }

    if (cells.length > 0)
    {
        const label_pos = project_to_screen(dev.position, cam, canvas_width, canvas_height)
        ctx.fillStyle = '#f3f4f6'
        ctx.font = `${Math.max(10, cell_px * 0.4)}px monospace`
        ctx.fillText(`#${dev.unique_id}`, label_pos.x + 2, label_pos.y + 12)
    }
}

/**
 * Main entry point: clears the canvas and redraws the entire map state.
 * Pure with respect to game state — never mutates `map`.
 */
export function draw_map(ctx: CanvasRenderingContext2D, map: game_map, registry: pack_registry, cam: camera): void
{
    const canvas_width = ctx.canvas.width
    const canvas_height = ctx.canvas.height

    ctx.fillStyle = '#16171d'
    ctx.fillRect(0, 0, canvas_width, canvas_height)

    draw_grid(ctx, map, cam, canvas_width, canvas_height)

    for (const dev of map.devices)
    {
        const def = get_device_definition(registry, dev.definition_id)
        if (!def)
        {
            continue
        }

        const cells = get_world_cells(dev, def)
        draw_device(ctx, dev, cells, cam, canvas_width, canvas_height)
    }
}