/**
 * cuboid_device Adapter
 *
 * 依據目標世界空間維度 dim，將長方體跨度向量轉換為核心引擎的 2× 網格單元格座標集合。
 */

import { type vector, get_dimension } from '@/core';

export function cuboid_to_shape(device_size: vector): vector[]
{
    const dim = get_dimension() ?? device_size.length;
    const shape: vector[] = [];
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
