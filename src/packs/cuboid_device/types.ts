/**
 * cuboid_device 型別定義
 *
 * 規範長方體設備能力契約。
 */

import type { device, dimensions, vector } from '@/API';

/**
 * 長方體設備能力介面契約 (Capability Interface)
 */
export interface cuboid_device_interface extends device
{
    /** 各維度長度跨度 [delta_x, delta_y, delta_z, ...] */
    readonly dimensions: dimensions;

    /** 取得長方體所有單元格的局部座標列表 */
    get_shape(): vector[];
}
