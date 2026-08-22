/**
 * cuboid_device Pack 進入點
 */

import { cuboid_to_shape, validate_cuboid_dimensions } from './adapter';
import { base_cuboid_device } from './base_device';

// ─── 導出型別 ─────────────────────────────────────────────────────────────────
export type * from './types';

// ─── 導出核心類別與適配函式 ───────────────────────────────────────────────────
export
{
    base_cuboid_device,
    cuboid_to_shape,
    validate_cuboid_dimensions
};

/**
 * cuboid_device Pack 統一導出物件
 */
export const cuboid_device =
{
    base_cuboid_device,
    cuboid_to_shape,
    validate_cuboid_dimensions
};

/**
 * Pack 初始化生命週期函式（由 loader.ts 自動發現並呼叫）
 */
export function init_pack(): void
{
}
