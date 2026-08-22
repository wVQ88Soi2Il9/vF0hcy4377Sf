/**
 * cuboid_device 抽象基底類別
 *
 * 繼承核心 device 並實作 cuboid_device_interface 能力契約。
 */

import { device, type vector, type dimensions } from '@/API';
import type { cuboid_device_interface } from './types';
import { cuboid_to_shape } from './adapter';

/**
 * 長方體設備抽象基底類別
 * 下游設備僅需指定 dimensions: [delta_x, delta_y, delta_z, ...]，
 * 即自動由 Adapter 計算產生對應的 2× 網格單元格 shape 座標集合。
 */
export abstract class base_cuboid_device extends device implements cuboid_device_interface
{
    /** 各維度長度跨度 [delta_x, delta_y, delta_z, ...] */
    public abstract readonly dimensions: dimensions;

    constructor
    (
        uid:           number,
        definition_id: string,
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
        return cuboid_to_shape(this.dimensions);
    }
}
