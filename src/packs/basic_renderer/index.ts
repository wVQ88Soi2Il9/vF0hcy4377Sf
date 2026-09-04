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
    // 確保世界專屬的相機實例已建立並直連 target_world.trigger('camera_change')
    get_world_camera(target_world);

    // 當 target_world 發生空間或歷史異動時，通知該世界所有渲染器重繪
    const trigger_redraw = () =>
    {
        redraw_world(target_world);
    };

    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'device_change' }, trigger_redraw);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_change' }, trigger_redraw);
}