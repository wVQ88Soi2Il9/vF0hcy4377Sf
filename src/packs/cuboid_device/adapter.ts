/**
 * cuboid_device Adapter
 *
 * 將 [delta_x, delta_y, delta_z, ...] 長方體維度跨度轉換為核心引擎的 2× 網格單元格座標集合。
 */

import type { vector } from '@/API';

/**
 * 驗證長方體維度向量是否合法（必須為非空且每個元素皆為正整數）
 */
export function validate_cuboid_dimensions(dimensions: vector): void
{
    const dim = dimensions ? dimensions.length : 0;
    if (!Array.isArray(dimensions) || dim === 0)
    {
        throw new Error(`[cuboid_device] Invalid cuboid dimensions: expected non-empty vector, got ${JSON.stringify(dimensions)}`);
    }

    for (let i = 0; i < dim; i++)
    {
        const val = dimensions[i];
        if (!Number.isInteger(val) || val <= 0)
        {
            throw new Error(`[cuboid_device] Invalid dimension at index ${i}: expected positive integer, got ${val}`);
        }
    }
}

/**
 * 將 N 維長方體跨度 [delta_x, delta_y, delta_z, ...]
 * 轉換為核心引擎 2× 網格單元格錨點集合：[2*i_0, 2*i_1, ..., 2*i_{dim-1}]。
 *
 * @param dimensions 長方體跨度向量 [d_0, d_1, ..., d_{dim-1}]
 * @returns 單元格局部座標陣列
 */
export function cuboid_to_shape(dimensions: vector): vector[]
{
    validate_cuboid_dimensions(dimensions);

    const dim = dimensions.length;
    const shape: vector[] = [];
    const current: number[] = new Array(dim).fill(0);

    function generate(dim_index: number): void
    {
        if (dim_index === dim)
        {
            shape.push([...current]);
            return;
        }

        const count = dimensions[dim_index];
        for (let i = 0; i < count; i++)
        {
            current[dim_index] = i * 2;
            generate(dim_index + 1);
        }
    }

    generate(0);
    return shape;
}
