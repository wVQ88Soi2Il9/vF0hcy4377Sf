import * as core from '@/core';

/**
 * Resolves which axis index (0 for X, 1 for Y, 2 for Z, etc.) a port is oriented along.
 * Returns the dimension index where the coordinate is even (the boundary plane), or null if invalid.
 */
export function get_port_axis(port_pos: core.vector): number | null
{
    const even_indices: number[] = [];
    for (let i = 0; i < port_pos.length; i++)
    {
        if (port_pos[i] % 2 === 0)
        {
            even_indices.push(i);
        }
    }
    return even_indices.length === 1 ? even_indices[0] : null;
}

/**
 * Validates whether a coordinate satisfies the grid port invariant:
 * port ∈ {x ∈ Z^n : exactly one coordinate is even and n - 1 are odd}.
 */
export function is_valid_port_position(port_pos: core.vector): boolean
{
    let even_count = 0;
    for (let i = 0; i < port_pos.length; i++)
    {
        if (port_pos[i] % 2 === 0)
        {
            even_count++;
        }
    }
    return even_count === 1;
}

/**
 * Validates whether a coordinate satisfies the device anchor invariant:
 * all coordinates must be even integers.
 */
export function is_valid_device_position(pos: core.vector): boolean
{
    return pos.every(c => c % 2 === 0);
}
