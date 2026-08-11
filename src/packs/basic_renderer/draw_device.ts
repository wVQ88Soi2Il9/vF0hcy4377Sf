import type { game_map } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import { get_device_definition } from '@/core/pack_manager'
import type { cameratype } from './types'
import { grid_to_screen } from './index'

export function draw_devices
(   
    ctx: CanvasRenderingContext2D,
    map: game_map,
    registry: pack_registry,
    camera: cameratype
): void
{
    const { axis, depth } = camera.plane

    for (const device of map.devices)
    {
        const def = get_device_definition(registry, device.definition_id)
        if (!def) continue

        for (const cell of def.shape)
        {
            const wx = device.position.x + cell.x
            const wy = device.position.y + cell.y
            const wz = device.position.z + cell.z

            // Only draw cells that lie on the current view plane.
            const depth_coord = axis === 'x' ? wx : axis === 'y' ? wy : wz
            if (depth_coord !== depth) continue

            const { sx, sy } = grid_to_screen(wx, wy, wz, camera)

            ctx.fillStyle = '#FF0000'
            // sy is the top-left corner; since Y is flipped, subtract zoom to get top.
            ctx.fillRect(sx, sy - camera.zoom, camera.zoom, camera.zoom)
        }
    }
}