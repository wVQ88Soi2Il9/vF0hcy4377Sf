/**
 * cuboid_device Adapter
 *
 * 依據目標世界空間維度 dim，將長方體跨度向量轉換為核心引擎的 2× 網格單元格座標集合。
 */

import type { vector } from '@/API';

/**
 * 嚴格驗證長方體維度跨度與目標空間維度 dim 是否完全匹配且合法
 */
export function validate_cuboid_dimensions(device_size: vector, dim: number): void
{
    if (!Number.isInteger(dim) || dim <= 0)
    {
        throw new Error(`[cuboid_device] Invalid target dimension dim: expected positive integer, got ${dim}`);
    }

    if (!Array.isArray(device_size) || device_size.length !== dim)
    {
        throw new Error(`[cuboid_device] Dimension mismatch: expected ${dim}-element vector for ${dim}D map, got ${JSON.stringify(device_size)} (length: ${device_size?.length})`);
    }

    for (let i = 0; i < dim; i++)
    {
        const val = device_size[i];
        if (!Number.isInteger(val) || val <= 0)
        {
            throw new Error(`[cuboid_device] Invalid dimension span at index ${i}: expected positive integer, got ${val}`);
        }
    }
}

/**
 * 將長方體跨度 device_size 依據目標維度 dim（由 game_map 決定）
 * 轉換為核心引擎 2× 網格單元格錨點集合：[2*i_0, 2*i_1, ..., 2*i_{dim-1}]。
 *
 * @param device_size 各軸格數跨度向量
 * @param dim 目標世界空間維度數（由 game_map 決定）
 * @returns 單元格局部座標陣列
 */
export function cuboid_to_shape(device_size: vector, dim: number): vector[]
{
    validate_cuboid_dimensions(device_size, dim);

    const shape: vector[] = [];
    const current: number[] = new Array(dim).fill(0);

    function generate(dim_index: number): void
    {
        if (dim_index === dim)
        {
            shape.push([...current]);
            return;
        }

        const count = device_size[dim_index];
        for (let i = 0; i < count; i++)
        {
            current[dim_index] = i * 2;
            generate(dim_index + 1);
        }
    }

    generate(0);
    return shape;
}
