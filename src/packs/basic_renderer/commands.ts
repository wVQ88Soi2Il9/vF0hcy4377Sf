import type { game_map, map_command } from '@/core';
import { get_map } from '@/world';
import { parse_axis_name, format_axis_name, get_right_oriented_axes } from '@/packs/vanilla';
import { get_camera_plane } from './camera';
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
            const axis_name = format_axis_name(i);
            const depth = plane.slices[i] ?? 0;
            eq_parts.push(`${axis_name}=${depth}`);
        }
    }
    return `camera ${eq_parts.join(' ')}`;
}

export function camera_command(equation_arg?: string): map_command
{
    let previous_plane: { dim_h: number; dim_v: number; slices: number[] } | null = null;

    return {
        pack: 'basic_renderer',
        id:   'camera',
        other_info:
        {
            basic_renderer:
            {
                equation_arg
            }
        },
        execute(_map: game_map): void
        {
            const current = get_camera_plane();
            if (!previous_plane)
            {
                previous_plane = { dim_h: current.dim_h, dim_v: current.dim_v, slices: [...current.slices] };
            }

            if (!equation_arg || equation_arg.trim() === '')
            {
                return;
            }

            const fixed_map = new Map<number, number>();
            const parts = equation_arg.split(',').map(s => s.trim()).filter(s => s.length > 0);

            for (const part of parts)
            {
                const kv = part.split('=');
                if (kv.length === 2)
                {
                    const axis_idx = parse_axis_name(kv[0]);
                    const depth_val = parseInt(kv[1].trim(), 10);
                    if (axis_idx !== null && !isNaN(depth_val))
                    {
                        fixed_map.set(axis_idx, depth_val);
                    }
                }
            }

            if (fixed_map.size === 0)
            {
                return;
            }

            const map = get_map();
            const num_dims = map ? map.dimension : current.slices.length;
            const fixed_axes_set = new Set(fixed_map.keys());
            const axes = get_right_oriented_axes(num_dims, fixed_axes_set);
            if (axes)
            {
                const new_slices = [...current.slices];
                fixed_map.forEach((depth, axis_idx) =>
                {
                    if (axis_idx < num_dims)
                    {
                        new_slices[axis_idx] = depth;
                    }
                });
                set_camera_plane(axes.dim_h, axes.dim_v, new_slices);
            }
        },
        inverse(_map: game_map): void
        {
            if (previous_plane)
            {
                set_camera_plane(previous_plane.dim_h, previous_plane.dim_v, previous_plane.slices);
            }
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
