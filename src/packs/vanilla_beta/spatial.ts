import * as core from '@/core';

export function add_vector(a: core.vector, b: core.vector): core.vector
{
    return a.map((v, i) => v + b[i]);
}

export function vectors_equal(a: core.vector, b: core.vector): boolean
{
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

export function vector_to_string(vec: core.vector): string
{
    return vec.join(',');
}

/**
 * Verifies device anchor position invariant: all coordinates must be even.
 */
export function is_valid_device_position(pos: core.vector): boolean
{
    return pos.every(c => c % 2 === 0);
}

/**
 * Verifies boundary port position invariant: exactly 1 coordinate is even, remaining n - 1 coordinates are odd.
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
 * Resolves the normal axis index the port lies on (0 for X, 1 for Y, 2 for Z, etc.).
 * Returns null if the coordinate does not satisfy the port invariant.
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

export class spatial_map<T>
{
    private map = new Map<string, T>();

    public set(pos: core.vector, value: T): void
    {
        this.map.set(vector_to_string(pos), value);
    }

    public get(pos: core.vector): T | undefined
    {
        return this.map.get(vector_to_string(pos));
    }

    public has(pos: core.vector): boolean
    {
        return this.map.has(vector_to_string(pos));
    }

    public get_or_insert(pos: core.vector, default_factory: () => T): T
    {
        const key = vector_to_string(pos);
        if (!this.map.has(key))
        {
            this.map.set(key, default_factory());
        }
        return this.map.get(key)!;
    }

    public values(): IterableIterator<T>
    {
        return this.map.values();
    }

    public keys(): IterableIterator<string>
    {
        return this.map.keys();
    }
}

export interface map_validation_result
{
    out_of_bounds: core.uid[];
    overlapped:    core.uid[];
}

export function is_out_of_bounds(pos: core.vector, map_size: core.vector): boolean
{
    return pos.some((v, i) => v < 0 || v >= map_size[i]);
}

/**
 * Scans all devices in space, detecting and reporting out-of-bounds and overlapping device UIDs.
 */
export function check_map_overlap(map: core.space, _registry?: core.pack_registry): map_validation_result
{
    const occupied_map = new spatial_map<core.uid[]>();
    const out_of_bounds: core.uid[] = [];

    for (const dev of map.devices)
    {
        const cells = dev.get_shape().map(local_cell => add_vector(dev.position, local_cell));

        if (cells.some(cell => is_out_of_bounds(cell, map.size)))
        {
            out_of_bounds.push(dev.device_uid);
        }

        for (const cell of cells)
        {
            occupied_map.get_or_insert(cell, () => []).push(dev.device_uid);
        }
    }

    const overlapped = Array.from(new Set(
        Array.from(occupied_map.values())
            .filter(device_ids => new Set(device_ids).size > 1)
            .flat()
    ));

    return {
        out_of_bounds,
        overlapped
    };
}
