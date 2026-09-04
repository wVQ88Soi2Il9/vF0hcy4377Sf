import * as core from '@/core';
import * as world from '@/world';
import { get_world_camera } from './camera';

export * from './types';
export * from './camera';
export * from './camera_control';
export * from './projection';
export * from './commands';

export function global_init(registry: core.pack_registry): void
{
    registry.set('camera', {
        pack_id: 'camera',
        hooks: new Map([
            ['camera_change', []]
        ]),
        world_init
    });
}

export function world_init(target_world: world.pure_world): void
{
    // 確保世界專屬相機已建立並直連 target_world.trigger({ namespace: 'camera', id: 'camera_change' }, c)
    get_world_camera(target_world);
}
