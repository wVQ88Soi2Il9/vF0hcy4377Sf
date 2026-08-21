import type { vector } from '@/core/types';

/**
 * Checks if a port coordinate is a vertical port (Z-axis direction).
 * Uses port_pos[2] % 2 !== 0 to properly support both positive and negative coordinates.
 */
export function is_vertical_port(port_pos: vector): boolean
{
    return port_pos.length >= 3 && port_pos[2] % 2 !== 0;
}

/**
 * Resolves which axis index (0 for X, 1 for Y, 2 for Z, etc.) a port is oriented along.
 * Returns the dimension index where the coordinate is odd, or null if invalid.
 */
export function get_port_axis(port_pos: vector): number | null
{
    const odd_indices: number[] = [];
    for (let i = 0; i < port_pos.length; i++)
    {
        if (port_pos[i] % 2 !== 0)
        {
            odd_indices.push(i);
        }
    }
    return odd_indices.length === 1 ? odd_indices[0] : null;
}

/**
 * Validates whether a coordinate satisfies the 2x grid port invariant:
 * exactly ONE coordinate must be an odd integer, and all other coordinates must be even integers.
 */
export function is_valid_port_position(port_pos: vector): boolean
{
    let odd_count = 0;
    for (let i = 0; i < port_pos.length; i++)
    {
        if (port_pos[i] % 2 !== 0)
        {
            odd_count++;
        }
    }
    return odd_count === 1;
}

/**
 * Validates whether a coordinate satisfies the 2x grid device center invariant:
 * all coordinates must be even integers.
 */
export function is_valid_device_position(pos: vector): boolean
{
    return pos.every(c => c % 2 === 0);
}
