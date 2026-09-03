import type { camera_type, view_plane } from './types';
import { get_map } from '@/world';
import type { unsubscribe_function } from '@/core';

export const camera: camera_type =
{
    pan_x: 0,
    pan_y: 0,
    zoom:  40,
    plane: { dim_h: 0, dim_v: 1, slices: [0, 0, 0] }
};

const camera_listeners = new Set<(cam: camera_type) => void>();

export function notify_camera_change(): void
{
    const snapshot = get_camera_state();
    for (const listener of camera_listeners)
    {
        listener(snapshot);
    }
}

/**
 * Adapts camera plane slices and axes to match the N-dimensional map.
 */
export function adapt_camera_plane(cam: camera_type, target_dim: number): void
{
    if (target_dim <= 0)
    {
        return;
    }

    if (cam.plane.dim_h < 0 || cam.plane.dim_h >= target_dim)
    {
        cam.plane.dim_h = 0;
    }
    if (cam.plane.dim_v < 0 || cam.plane.dim_v >= target_dim || cam.plane.dim_v === cam.plane.dim_h)
    {
        cam.plane.dim_v = target_dim > 1 ? (cam.plane.dim_h === 0 ? 1 : 0) : 0;
    }

    const current_slices = cam.plane.slices || [];
    const new_slices = new Array(target_dim).fill(0);
    for (let i = 0; i < target_dim; i++)
    {
        if (i < current_slices.length && typeof current_slices[i] === 'number')
        {
            new_slices[i] = current_slices[i];
        }
    }
    cam.plane.slices = new_slices;
}

/**
 * Returns a shallow copy of the current camera view plane.
 */
export function get_camera_plane(): view_plane
{
    const map = get_map();
    if (map)
    {
        adapt_camera_plane(camera, map.dimension);
    }
    return {
        dim_h:  camera.plane.dim_h,
        dim_v:  camera.plane.dim_v,
        slices: [...camera.plane.slices]
    };
}

/**
 * Returns a snapshot of the current camera state.
 */
export function get_camera_state(): camera_type
{
    const map = get_map();
    if (map)
    {
        adapt_camera_plane(camera, map.dimension);
    }
    return {
        pan_x: camera.pan_x,
        pan_y: camera.pan_y,
        zoom:  camera.zoom,
        plane: {
            dim_h:  camera.plane.dim_h,
            dim_v:  camera.plane.dim_v,
            slices: [...camera.plane.slices]
        }
    };
}

/**
 * Subscribes to camera pan/zoom/plane state changes.
 */
export function on_camera_change(listener: (cam: camera_type) => void): unsubscribe_function
{
    camera_listeners.add(listener);
    return () =>
    {
        camera_listeners.delete(listener);
    };
}
