import { register_layered_2d_cli_commands } from './cli_commands';
import type { map_validation_result, device_node } from '@/packs/vanilla';
import { basic_renderer } from '@/packs/basic_renderer';
import { apply_d4_point, apply_d4_cell_anchor, apply_d4_transform, compose_d4, invert_d4, normalize_rotation, is_vector_3d, add_vector_3d } from './math';
import { draw_layered_devices, get_render_options, set_render_options } from './renderer';
import type
{
    vector_3d,
    rotation_step,
    d4_transform,
    layered_camera,
    rotatable_device,
    layered_device,
    drawable_layered_device,
    layered_render_options
} from './types';

import {
    is_rotatable_device,
    rotate_device_command,
    flip_device_command,
    set_device_transform_command
} from './commands';

export type { map_validation_result, device_node };
export { base_layered_device } from './base_device';
export {
    is_rotatable_device,
    rotate_device_command,
    flip_device_command,
    set_device_transform_command
} from './commands';
export { apply_d4_point, apply_d4_cell_anchor, apply_d4_transform, compose_d4, invert_d4, normalize_rotation, is_vector_3d, add_vector_3d } from './math';
export { draw_layered_devices, get_render_options, set_render_options } from './renderer';
export type
{
    vector_3d,
    rotation_step,
    d4_transform,
    layered_camera,
    rotatable_device,
    layered_device,
    drawable_layered_device,
    layered_render_options
};

export function init_pack(): void
{
    // Auto-mount layered_devices drawing pipeline into basic_renderer
    basic_renderer.set_device_drawer((ctx, map, camera, canvas) =>
    {
        draw_layered_devices(ctx, map, camera, canvas);
    });

    // Auto-discover and execute all reliant pack extension files under ./$*/*.ts
    import.meta.glob('./$*/*.ts', { eager: true });
    register_layered_2d_cli_commands();
}

export const layered_2d =
{
    pack_id: 'layered_2d',
    commands:
    {
        rotate_device:        rotate_device_command,
        flip_device:          flip_device_command,
        set_device_transform: set_device_transform_command
    },
    draw_layered_devices,
    get_render_options,
    set_render_options,
    apply_d4_point,
    apply_d4_cell_anchor,
    apply_d4_transform,
    compose_d4,
    invert_d4,
    normalize_rotation,
    is_vector_3d,
    add_vector_3d,
    is_rotatable_device,
    rotate_device_command,
    flip_device_command,
    set_device_transform_command
};
