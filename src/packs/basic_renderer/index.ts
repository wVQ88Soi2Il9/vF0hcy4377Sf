import * as core from '@/core';
import * as world from '@/world';
import { get_world_camera, redraw_world } from './renderer';

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
        world_init
    });
}

export function world_init(target_world: world.pure_world): void
{
    const cam = get_world_camera(target_world);

    // 1. 相機本體異動時，向 target_world 廣播 camera_change
    cam.on_change((c) =>
    {
        target_world.trigger({ namespace: 'basic_renderer', id: 'camera_change' }, c);
    });

    // 2. 當 target_world 發生 device_change / history_change / camera_change 時，通知重繪
    const trigger_redraw = () =>
    {
        redraw_world(target_world);
    };

    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'device_change' }, trigger_redraw);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_change' }, trigger_redraw);
    target_world.inject_hook({ namespace: 'basic_renderer', id: 'camera_change' }, trigger_redraw);
}