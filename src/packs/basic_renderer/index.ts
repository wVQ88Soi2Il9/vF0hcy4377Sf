import * as core from '@/core';
import * as world from '@/world';
import { camera_command } from './commands';
import { on_camera_change } from './camera';

export * from './types';
export * from './camera';
export * from './camera_control';
export * from './renderer';
export * from './commands';

export function global_init(registry: core.pack_registry): void
{
    registry.set('basic_renderer', {
        pack_id: 'basic_renderer',
        hooks: new Map([
            ['camera_change', []]
        ]),
        operations: {
            camera: camera_command
        },
        world_init
    });
}

export function world_init(target_world: world.pure_world): void
{
    on_camera_change((cam) =>
    {
        target_world.trigger({ namespace: 'basic_renderer', id: 'camera_change' }, cam);
    });
}