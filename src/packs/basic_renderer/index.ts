import * as core from '@/core';
import * as world from '@/world';
import { redraw_world } from './renderer';

export * from './types';
export * from './draw_grid';
export * from './draw_device';
export * from './renderer';

export function global_init(registry: core.pack_registry): void
{
    registry.set('basic_renderer', {
        pack_id: 'basic_renderer',
        world_init
    });
}

export function world_init(target_world: world.pure_world): void
{
    // 當 target_world 發生空間、歷史或相機異動時，通知該世界所有渲染器重繪
    const trigger_redraw = () =>
    {
        redraw_world(target_world);
    };

    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'device_change' }, trigger_redraw);
    target_world.inject_hook({ namespace: 'vanilla_alpha', id: 'history_change' }, trigger_redraw);
}