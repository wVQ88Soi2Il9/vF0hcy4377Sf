/**
 * Defines which 2 dimensions of the N-dimensional world are displayed,
 * and the fixed depths of all other dimensions.
 *
 * Example (3D, viewing the XY plane at z=0):
 *   { dim_h: 0, dim_v: 1, slices: [0, 0, 0] }
 *
 * Example (3D, viewing the YZ plane at x=1):
 *   { dim_h: 1, dim_v: 2, slices: [1, 0, 0] }
 *
 * slices[i] is only consulted when i !== dim_h && i !== dim_v.
 */
export interface view_plane
{
    dim_h:   number    // world dimension index → screen horizontal (right)
    dim_v:   number    // world dimension index → screen vertical   (up, flipped)
    slices:  number[]  // fixed depth for every non-displayed dimension
}

export interface cameratype
{
    pan_x:  number
    pan_y:  number
    zoom:   number
    /** Which 2-D cross-section of the N-D world to render. */
    plane:  view_plane
}