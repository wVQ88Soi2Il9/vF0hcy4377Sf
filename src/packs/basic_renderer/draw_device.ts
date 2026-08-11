import type { game_map } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import { get_device_definition } from '@/core/pack_manager'
import type { cameratype } from './types'

export function draw_devices
(   
    ctx: CanvasRenderingContext2D,
    map: game_map,
    registry: pack_registry,   // ← 需要這個才能查定義
    camera: cameratype
): void
{
    for (const device of map.devices)
    {
        const def = get_device_definition(registry, device.definition_id);
        if (!def) continue;
        
        for (const cell of def.shape)
        {
            const world_x = device.position.x + cell.x;
            const world_y = device.position.y + cell.y;

            ctx.fillStyle = '#FF0000';
            ctx.fillRect(world_x, world_y, camera.zoom, camera.zoom);
        }
    }
}