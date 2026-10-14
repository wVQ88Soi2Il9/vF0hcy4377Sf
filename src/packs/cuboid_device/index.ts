import * as core from '@/core';

/**
 * 將長方體跨度向量轉換為 2× 網格單元格座標集合。
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
 * 下游設備指定 device_size: [delta_x, delta_y, delta_z, ...]，
 * 即自動依據維度產生對應的 2× 網格單元格 shape 座標集合。
 */
export abstract class base_cuboid_device extends core.device
{
    /** 各維度長度跨度 [delta_x, delta_y, delta_z, ...] */
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

export const manifest: core.pack_manifest =
{
    pack_id: 'cuboid_device',
    on:      {}
};
