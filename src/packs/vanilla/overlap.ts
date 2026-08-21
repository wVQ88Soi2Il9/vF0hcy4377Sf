import type { game_map, vector } from '@/core/types';
import type { map_validation_result } from './types';
import type { pack_registry } from '@/core/pack_manager';
import { get_world_cells } from '@/utils/device_utils';
import { spatial_map } from '@/utils/spatial_map';
import { get_device_definition } from '@/core/pack_manager';

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
 * @param registry 取得定義用的 registry
 * @returns 回傳包含問題裝置 uid 陣列的物件
 */
export function check_map_overlap(map: game_map, registry: pack_registry): map_validation_result
{
    const out_of_bounds: number[] = [];
    const occupied_map = new spatial_map<number[]>();

    // 第一階段：掃描所有裝置，記錄出界狀況並註冊佔據的格子
    for (const dev of map.devices)
    {
        const def = get_device_definition(registry, dev.definition_id);
        if (!def)
        {
            continue;
        }

        const cells = get_world_cells(dev, def);
        if (cells.some(cell => is_out_of_bounds(cell, map.size)))
        {
            out_of_bounds.push(dev.uid);
        }

        for (const cell of cells)
        {
            occupied_map.get_or_insert(cell, () => []).push(dev.uid);
        }
    }

    // 第二階段：尋找被 2 個以上相異裝置佔用的格子，收集其 uid
    const overlapped = Array.from(new Set(
        occupied_map
            .values()
            .filter(ids => new Set(ids).size > 1)
            .flat()
    ));

    return {
        out_of_bounds,
        overlapped
    };
}


