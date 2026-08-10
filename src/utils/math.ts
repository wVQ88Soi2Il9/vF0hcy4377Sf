import type { vector, rotation } from '@/core/types'

/**
 * Adds two vectors together.
 */
export function add_vector(a: vector, b: vector): vector
{
    return {
        x: a.x + b.x,
        y: a.y + b.y,
        z: a.z + b.z
    }
}

/**
 * Applies 3D rotation to a local offset vector.
 * Order of rotation: X-axis, then Y-axis, then Z-axis.
 * Each rotation step is 90 degrees CCW looking down the positive axis.
 */
export function rotate_vector_3d(vec: vector, rot: rotation): vector
{
    let { x, y, z } = vec

    // Rotate around X axis (90 deg CCW: y' = -z, z' = y)
    for (let i = 0; i < rot.x; i++)
    {
        const temp_y = y
        y = -z
        z = temp_y
    }

    // Rotate around Y axis (90 deg CCW: x' = z, z' = -x)
    for (let i = 0; i < rot.y; i++)
    {
        const temp_x = x
        x = z
        z = -temp_x
    }

    // Rotate around Z axis (90 deg CCW: x' = -y, y' = x)
    for (let i = 0; i < rot.z; i++)
    {
        const temp_x = x
        x = -y
        y = temp_x
    }

    // Convert -0 to 0 (Javascript sometimes leaves -0 which can be annoying in tests)
    return {
        x: x === 0 ? 0 : x,
        y: y === 0 ? 0 : y,
        z: z === 0 ? 0 : z
    }
}

/**
 * Checks if two vectors are exactly equal.
 */
export function vectors_equal(a: vector, b: vector): boolean
{
    return a.x === b.x && a.y === b.y && a.z === b.z
}

/**
 * Converts a vector to a string for use as a Map or Set key.
 */
export function vector_to_string(vec: vector): string
{
    return `${vec.x},${vec.y},${vec.z}`
}
