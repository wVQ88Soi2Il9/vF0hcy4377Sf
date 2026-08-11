import type { game_map } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import { get_device_definition } from '@/core/pack_manager'
import { get_world_cells, get_world_ports } from '@/utils/device_utils'
import type { cameratype } from './types'
import { get_device_draw } from './draw_registry'

export function draw_devices
(
    ctx:      CanvasRenderingContext2D,
    map:      game_map,
    registry: pack_registry,
    camera:   cameratype
): void
{
    const { dim_h, dim_v, slices } = camera.plane

    for (const device of map.devices)
    {
        const def = get_device_definition(registry, device.definition_id)
        if (!def) continue

        const world_cells = get_world_cells(device, def)

        // Keep only cells that lie on the current cross-section.
        // A cell is visible when every non-displayed dimension matches its slice depth.
        const visible_cells = world_cells.filter(cell =>
            cell.every((coord, i) =>
                i === dim_h ||
                i === dim_v ||
                coord === (slices[i] ?? 0)
            )
        )

        if (visible_cells.length === 0) continue

        // Compute bounding box in world coordinates (across visible cells).
        const h_coords = visible_cells.map(c => c[dim_h] ?? 0)
        const v_coords = visible_cells.map(c => c[dim_v] ?? 0)
        const min_h = Math.min(...h_coords)
        const max_h = Math.max(...h_coords)
        const min_v = Math.min(...v_coords)
        const max_v = Math.max(...v_coords)

        // 根據 2x 座標系，裝置中心在偶數 (ex: 0)，格子邊界在奇數 (ex: -1, 1)。
        // 故一個格子的範圍是 h-1 到 h+1，寬度為 2。
        const sx = camera.pan_x + (min_h - 1) * camera.zoom
        const sy = camera.pan_y - (max_v + 1) * camera.zoom
        const sw = (max_h - min_h + 2) * camera.zoom
        const sh = (max_v - min_v + 2) * camera.zoom

        // Look up the pack developer's registered draw function.
        const draw_fn = get_device_draw(device.definition_id)
        if (draw_fn)
        {
            draw_fn(ctx, sx, sy, sw, sh, camera.zoom)
        }
        else
        {
            const draw_info = def.other_info?.basic_renderer as any
            if (draw_info)
            {
                ctx.fillStyle = draw_info.color || '#FF0000'
                ctx.fillRect(sx, sy, sw, sh)

                if (draw_info.border)
                {
                    ctx.strokeStyle = draw_info.border
                    ctx.lineWidth = Math.max(1, camera.zoom * 0.04)
                    ctx.strokeRect(sx, sy, sw, sh)
                }

                if (draw_info.label)
                {
                    ctx.fillStyle = draw_info.border || '#FFFFFF'
                    ctx.font = `bold ${Math.max(8, camera.zoom * 0.3)}px monospace`
                    ctx.textAlign = 'center'
                    ctx.textBaseline = 'middle'
                    ctx.fillText(draw_info.label, sx + sw / 2, sy + sh / 2)
                }
            }
            else
            {
                // Fallback: solid red rectangle.
                ctx.fillStyle = '#FF0000'
                ctx.fillRect(sx, sy, sw, sh)
            }
        }

        // Draw ports
        const draw_port = (type: 'input' | 'output') =>
        {
            const ports = get_world_ports(device, def, type)
            ctx.fillStyle = type === 'input' ? '#00FF00' : '#FFA500' // Input 綠, Output 橘
            for (const port of ports)
            {
                if (!port.every((coord, i) => i === dim_h || i === dim_v || coord === (slices[i] ?? 0))) continue

                const h = port[dim_h] ?? 0
                const v = port[dim_v] ?? 0
                const px = camera.pan_x + h * camera.zoom
                const py = camera.pan_y - v * camera.zoom
                const radius = camera.zoom * 0.3

                ctx.beginPath()
                ctx.arc(px, py, radius, 0, Math.PI * 2)
                ctx.fill()
                ctx.strokeStyle = '#000000'
                ctx.lineWidth = Math.max(1, camera.zoom * 0.05)
                ctx.stroke()
            }
        }
        draw_port('input')
        draw_port('output')
    }
}