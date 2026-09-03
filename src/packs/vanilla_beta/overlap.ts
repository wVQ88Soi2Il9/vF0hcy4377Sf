import * as core from '@/core';
import type { map_validation_result } from './types';
import { add_vector } from './math';
import { spatial_map } from './spatial_map';

/**
 * 檢查座標是否超出地圖邊界 (N 維通用)
 */
export function is_out_of_bounds(pos: core.vector, map_size: core.vector): boolean
{
    return pos.some((v, i) => v < 0 || v >= map_size[i]);
}

/**
 * 檢查整個地圖上的所有裝置，標記出哪些裝置超出邊界，哪些裝置發生重疊。
 * @param map 當前地圖
 * @param _registry 擴充註冊表（選填）
 * @returns 回傳包含問題裝置 uid 陣列的物件
 */
export function check_map_overlap(map: core.space, _registry?: core.pack_registry): map_validation_result
{
    const occupied_map = new spatial_map<number[]>();
    const out_of_bounds: number[] = [];

    // 第一階段：掃描所有裝置，透過 some 偵測出界並向 spatial_map 註冊佔據格子
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

    // 第二階段：透過 filter 與 flat 收集被多個相異裝置佔用的 uid
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
