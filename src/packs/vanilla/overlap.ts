import type { game_map, vector, pack_registry } from '@/API';
import type { map_validation_result } from './types';
import { add_vector } from '@/utils/math';
import { spatial_map } from '@/utils/spatial_map';

/**
 * 檢查座標是否超出地圖邊界 (N 維通用)
 */
export function is_out_of_bounds(pos: vector, map_size: vector): boolean
{
    return pos.some((v, i) => v < 0 || v >= map_size[i]);
}

/**
 * 檢查整個地圖上的所有裝置，標記出哪些裝置超出邊界，哪些裝置發生重疊。
 * @param map 當前地圖
 * @param _registry 擴充註冊表（選填）
 * @returns 回傳包含問題裝置 uid 陣列的物件
 */
export function check_map_overlap(map: game_map, _registry?: pack_registry): map_validation_result
{
    const result: map_validation_result =
    {
        out_of_bounds: [],
        overlapped:    []
    };

    // 紀錄每個座標對應了哪些裝置 (uid)
    const occupied_map = new spatial_map<number[]>();

    // 第一階段：掃描所有裝置，記錄出界狀況並註冊佔據的格子
    for (const dev of map.devices)
    {
        const cells = dev.get_shape().map(local_cell => add_vector(dev.position, local_cell));
        let is_oob = false;

        for (const cell of cells)
        {
            // 檢查出界
            if (is_out_of_bounds(cell, map.size))
            {
                is_oob = true;
            }

            // 記錄佔據
            occupied_map.get_or_insert(cell, () => []).push(dev.uid);
        }

        if (is_oob)
        {
            result.out_of_bounds.push(dev.uid);
        }
    }

    // 第二階段：尋找被 2 個以上裝置佔用的格子，收集其 uid
    const overlapped_set = new Set<number>();
    for (const device_ids of occupied_map.values())
    {
        if (device_ids.length > 1)
        {
            for (const id of device_ids)
            {
                overlapped_set.add(id);
            }
        }
    }

    result.overlapped = Array.from(overlapped_set);

    return result;
}
