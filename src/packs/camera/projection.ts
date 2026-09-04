import { camera } from './camera';
import { camera_type } from './types';

/**
 * Maps an N-dimensional world grid position to a 2-D canvas position.
 */
export function grid_to_screen
(
    pos:           number[],
    cam:           camera_type | camera,
    canvas_height: number
): { sx: number; sy: number }
{
    const plane = cam.plane;
    const pan_x = cam.pan_x;
    const pan_y = cam.pan_y;
    const zoom  = cam.zoom;

    const h = pos[plane.dim_h];
    const v = pos[plane.dim_v];

    const sx = pan_x + h * zoom;
    const sy = canvas_height + pan_y - v * zoom;
    return { sx, sy };
}
