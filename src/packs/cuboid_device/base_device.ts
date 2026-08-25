/**
 * cuboid_device 抽象基底類別
 *
 * 繼承核心 device 並封裝 device_size 屬性、由 game_map 取得 dimension 與自動 Shape 計算。
 */

import { device, type vector, type namespaced_id } from '@/API';
import { cuboid_to_shape } from './adapter';

/**
 * 長方體設備抽象基底類別
 * 下游設備僅需指定 device_size: [delta_x, delta_y, delta_z, ...]，
 * 即自動依據 get_dimension() 由 Adapter 計算產生對應的 2× 網格單元格 shape 座標集合。
 */
export abstract class base_cuboid_device extends device
{
    /** 各維度長度跨度 [delta_x, delta_y, delta_z, ...] */
    public abstract readonly device_size: vector;

    constructor
    (
        uid:           number,
        definition_id: namespaced_id,
        position:      vector,
        other_info?:   Record<string, unknown>
    )
    {
        super(uid, definition_id, position);
        if (other_info)
        {
            this.other_info = other_info;
        }
    }

    /**
     * 取得長方體所有單元格的局部座標列表
     */
    public get_shape(): vector[]
    {
        return cuboid_to_shape(this.device_size);
    }
}
