/**
 * cuboid_device Pack 進入點
 */

import { cuboid_to_shape } from './adapter';
import { base_cuboid_device } from './base_device';

// ─── 導出核心類別與適配函式 ───────────────────────────────────────────────────
export
{
    base_cuboid_device,
    cuboid_to_shape,
};

import type { pack_module } from '@/API';

/**
 * cuboid_device Pack 統一導出物件
 */
export const cuboid_device: pack_module =
{
    id: 'cuboid_device',
    base_cuboid_device,
    cuboid_to_shape,
};

/**
 * Pack 初始化生命週期函式（由 loader.ts 自動發現並呼叫）
 */
export function init_pack(): void
{
}
