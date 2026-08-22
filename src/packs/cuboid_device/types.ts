/**
 * cuboid_device 型別定義
 *
 * 規範 N 維長方體跨度與長方體設備能力契約。
 */

import type { device, vector } from '@/API';

/**
 * 長方體各維度長度（格數）向量：[delta_x, delta_y, delta_z, ...]
 * 每個元素必須為大於 0 的正整數。
 */
export type cuboid_dimensions = vector;

/**
 * 長方體設備能力介面契約 (Capability Interface)
 */
export interface cuboid_device_interface extends device
{
    /** 各維度長度跨度 [delta_x, delta_y, delta_z, ...] */
    readonly dimensions: cuboid_dimensions;

    /** 取得長方體所有單元格的局部座標列表 */
    get_shape(): vector[];
}
