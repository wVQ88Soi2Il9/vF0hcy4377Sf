import { get_map } from '@/runtime';
import { register_cli_command, clean_flag_arg } from '@/packs/cli_tool';
import { parse_axis_name, get_axis_label, get_right_oriented_axes } from '@/packs/vanilla';
import { basic_renderer, type view_plane } from './index';

function format_camera_equation(plane: view_plane): string
{
    const map = get_map();
    const num_dims = map ? map.dimension : plane.slices.length;
    const eq_parts: string[] = [];
    for (let i = 0; i < num_dims; i++)
    {
        if (i !== plane.dim_h && i !== plane.dim_v)
        {
            const axis_name = get_axis_label(i);
            const depth = plane.slices[i];
            eq_parts.push(`${axis_name}=${depth}`);
        }
    }
    const eq_str = eq_parts.join(', ');
    return `camera --"${eq_str}"`;
}

export function register_renderer_cli_commands(): void
{
    register_cli_command({
        name:        'camera',
        usage:       'camera --"<axis>=<depth>"',
        description: 'Get or set camera 2D view plane equation.',
        execute(args)
        {
            const map = get_map();
            if (!map) return 'Error: Global map instance not found.';
            const current = basic_renderer.get_camera();
            if (args.length === 0)
            {
                return format_camera_equation(current);
            }

            const clean = clean_flag_arg(args.join(' '));
            const fixed_map = new Map<number, number>();
            const parts = clean.split(',').map(s => s.trim()).filter(s => s.length > 0);

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
                return 'Error: Invalid camera format. Usage: camera --"d3=0"';
            }

            const num_dims = map.dimension;
            const fixed_axes_set = new Set(fixed_map.keys());
            const free_dim_count = num_dims - fixed_axes_set.size;

            if (free_dim_count !== 2)
            {
                return `Error: Camera requires exactly 2 free dimensions (currently ${free_dim_count}). Expected ${num_dims - 2} fixed axes.`;
            }

            const axes = get_right_oriented_axes(num_dims, fixed_axes_set);
            if (!axes)
            {
                return 'Error: Unable to resolve 2D view plane.';
            }

            const new_slices = [...current.slices];
            fixed_map.forEach((depth, axis_idx) =>
            {
                if (axis_idx < num_dims)
                {
                    new_slices[axis_idx] = depth;
                }
            });

            basic_renderer.set_camera(axes.dim_h, axes.dim_v, new_slices);
            return format_camera_equation(basic_renderer.get_camera());
        }
    });
}
