import type { map_command } from '@/core';
import { get_map } from '@/runtime';
import { parse_axis_name, get_right_oriented_axes } from '@/packs/vanilla';
import { basic_renderer, type view_plane } from './index';

export function set_camera_command(equation?: string): map_command
{
    let prev_plane: view_plane | null = null;

    return {
        pack: 'basic_renderer',
        id:   'set_camera',
        other_info:
        {
            basic_renderer: { equation }
        },
        execute(): void
        {
            const current = basic_renderer.get_camera();
            prev_plane = { ...current, slices: [...current.slices] };

            if (equation && equation.trim() !== '')
            {
                const map = get_map();
                const fixed_map = new Map<number, number>();
                const parts = equation.split(',').map(s => s.trim()).filter(s => s.length > 0);

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

                const num_dims = map ? map.dimension : current.slices.length;
                const axes = get_right_oriented_axes(num_dims, new Set(fixed_map.keys()));
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
                    basic_renderer.set_camera(axes.dim_h, axes.dim_v, new_slices);
                }
            }
        },
        inverse(): void
        {
            if (prev_plane)
            {
                basic_renderer.set_camera(prev_plane.dim_h, prev_plane.dim_v, prev_plane.slices);
            }
        }
    };
}

(set_camera_command as any).other_info = {
    cli: {
        alias:    'camera',
        describe: 'Get or set 2D projection camera view plane equation'
    }
};

export const basic_renderer_commands = {
    set_camera: set_camera_command
};
