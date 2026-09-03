import * as core from '@/core';
import * as vanilla_beta from '@/packs/vanilla_beta';
import { camera } from './camera';
import { set_camera_plane } from './camera_control';
import type { view_plane } from './types';

export function format_camera_equation(plane: view_plane, num_dims?: number): string
{
    const total_dims = num_dims ?? plane.slices.length;
    const eq_parts: string[] = [];
    for (let i = 0; i < total_dims; i++)
    {
        if (i !== plane.dim_h && i !== plane.dim_v)
        {
            const axis_name = vanilla_beta.format_axis_name(i);
            const depth = plane.slices[i] ?? 0;
            eq_parts.push(`${axis_name}=${depth}`);
        }
    }
    return `camera ${eq_parts.join(' ')}`;
}

/**
 * Parses a camera equation (e.g. "z=0" or "w=0, z=2") and applies it to the target camera.
 */
export function apply_camera_equation(cam: camera, equation_arg: string, num_dims: number): boolean
{
    if (!equation_arg || equation_arg.trim() === '')
    {
        return false;
    }

    const fixed_map = new Map<number, number>();
    const parts = equation_arg.split(',').map(s => s.trim()).filter(s => s.length > 0);

    for (const part of parts)
    {
        const kv = part.split('=');
        if (kv.length === 2)
        {
            const axis_idx = vanilla_beta.parse_axis_name(kv[0]);
            const depth_val = parseInt(kv[1].trim(), 10);
            if (axis_idx !== null && !isNaN(depth_val))
            {
                fixed_map.set(axis_idx, depth_val);
            }
        }
    }

    if (fixed_map.size === 0)
    {
        return false;
    }

    const fixed_axes_set = new Set(fixed_map.keys());
    const axes = vanilla_beta.get_right_oriented_axes(num_dims, fixed_axes_set);
    if (axes)
    {
        const new_slices = [...cam.plane.slices];
        fixed_map.forEach((depth, axis_idx) =>
        {
            if (axis_idx < num_dims)
            {
                new_slices[axis_idx] = depth;
            }
        });
        set_camera_plane(cam, axes.dim_h, axes.dim_v, num_dims, new_slices);
        return true;
    }
    return false;
}

/**
 * Camera command matching reversible_operation_factory.
 * Viewport operations do not mutate core.space geometry.
 */
export function camera_command(equation_arg?: string): core.reversible_operation
{
    return {
        namespace: 'basic_renderer',
        id: 'camera',
        other_info: {
            basic_renderer: {
                equation_arg
            }
        },
        execute(_sp: core.space): void
        {
            // Viewport camera command does not mutate core.space geometry
        },
        inverse(_sp: core.space): void
        {
            // Viewport camera command does not mutate core.space geometry
        }
    };
}

(camera_command as any).other_info = {
    cli: {
        alias:    'camera',
        describe: 'Get or set 2D projection camera view plane equation'
    }
};

export const basic_renderer_commands = {
    camera: camera_command
};
