import * as core from '@/core';

/**
 * Converts a cuboid span vector into 2x grid cell local coordinates.
 */
export function cuboid_to_shape(device_size: core.vector): core.vector[]
{
    const dim = device_size.length;
    const shape: core.vector[] = [];
    const current: number[] = new Array(dim).fill(0);

    function generate(dim_index: number): void
    {
        if (dim_index === dim)
        {
            shape.push([...current]);
            return;
        }
        const span = device_size[dim_index];
        for (let offset = 0; offset < span; offset += 2)
        {
            current[dim_index] = offset;
            generate(dim_index + 1);
        }
    }

    generate(0);
    return shape;
}

/**
 * Cuboid device base class.
 * Downstream devices specify device_size: [delta_x, delta_y, delta_z, ...]
 * which automatically generates 2x grid cell shape coordinates.
 */
export abstract class base_cuboid_device extends core.device
{
    /** Span per dimension [delta_x, delta_y, delta_z, ...] */
    public abstract readonly device_size: core.vector;

    constructor
    (
        device_uid:    core.uid,
        definition_id: core.namespaced_id,
        position:      core.vector,
        other_info?:   Record<string, unknown>
    )
    {
        super(device_uid, definition_id, position, other_info);
    }

    public get_shape(): core.vector[]
    {
        return cuboid_to_shape(this.device_size);
    }
}

export function global_init(registry: core.pack_registry): void
{
    registry.set('cuboid_device', {
        pack_id: 'cuboid_device'
    });
}

export function world_init(): void
{

}
