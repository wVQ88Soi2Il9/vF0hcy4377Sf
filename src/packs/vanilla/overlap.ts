import type { game_map, vector, map_validation_result } from '../../core/types'
import type { pack_registry } from '../../core/pack_manager'
import { get_world_cells } from '../../utils/device_utils'
import { spatial_map } from '../../utils/spatial_map'

/**
 * 檢查座標是否超出地圖邊界
 */
export function is_out_of_bounds(pos: vector, map_size: vector): boolean
{
    return pos.x < 0 || pos.x >= map_size.x ||
           pos.y < 0 || pos.y >= map_size.y ||
           pos.z < 0 || pos.z >= map_size.z
}


/**
 * 檢查整個地圖上的所有裝置，標記出哪些裝置超出邊界，哪些裝置發生重疊。
 * @param map 當前地圖
 * @param registry 取得定義用的 registry
 * @returns 回傳包含問題裝置 unique_id 陣列的物件
 */
export function check_map_overlap(map: game_map, registry: pack_registry): map_validation_result
{
    const result: map_validation_result = {
        out_of_bounds: [],
        overlapped: []
    }

    // 紀錄每個座標對應了哪些裝置 (unique_id)
    const occupied_map = new spatial_map<number[]>()

    // 第一階段：掃描所有裝置，記錄出界狀況並註冊佔據的格子
    for (const dev of map.devices)
    {
        const def = registry.device_definitions.get(dev.definition_id)
        if (!def)
        {
            continue
        }

        const cells = get_world_cells(dev, def)
        let is_oob = false

        for (const cell of cells)
        {
            // 檢查出界
            if (is_out_of_bounds(cell, map.size))
            {
                is_oob = true
            }

            // 記錄佔據
            occupied_map.get_or_insert(cell, () => []).push(dev.unique_id)
        }

        if (is_oob)
        {
            result.out_of_bounds.push(dev.unique_id)
        }
    }

    // 第二階段：尋找被 2 個以上裝置佔用的格子，收集其 unique_id
    const overlapped_set = new Set<number>()
    for (const device_ids of occupied_map.values())
    {
        if (device_ids.length > 1)
        {
            for (const id of device_ids)
            {
                overlapped_set.add(id)
            }
        }
    }

    result.overlapped = Array.from(overlapped_set)

    return result
}

