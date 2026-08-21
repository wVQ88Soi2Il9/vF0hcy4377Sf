import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';
import { draw_test_device_template } from './base_device';

export const device_id = 'test:belt';

export const draw: device_draw_fn = function draw_belt
(
    ctx:     CanvasRenderingContext2D,
    sx:      number,
    sy:      number,
    sw:      number,
    sh:      number,
    zoom:    number,
    device?: device,
    def?:    device_definition,
    camera?: camera_type
): void
{
    draw_test_device_template
    (
        ctx,
        sx,
        sy,
        sw,
        sh,
        zoom,
        { fill: '#3a3a3a', border: '#aaaaaa' },
        device,
        def,
        camera,
        '↑'
    );
};


