/**
 * The axis perpendicular to the viewed slice and its depth.
 * e.g. { axis: 'z', depth: 0 } → view the XY plane at z = 0.
 *      { axis: 'x', depth: 1 } → view the YZ plane at x = 1.
 *      { axis: 'y', depth: 0 } → view the XZ plane at y = 0.
 */
export type view_axis = 'x' | 'y' | 'z'

export interface view_plane
{
    axis:  view_axis
    depth: number
}

export interface cameratype
{
    pan_x:  number
    pan_y:  number
    zoom:   number
    /** Which 2-D slice of the 3-D world to render. */
    plane:  view_plane
}