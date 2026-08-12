/**
 * runtime.ts
 *
 * 應用啟動期的全域狀態容器。
 * 由 main.ts 在 call_all_pack_inits() 之前寫入，
 * 供需要讀取地圖或 registry 的 pack（如 basic_renderer）在 init_pack() 中取用。
 *
 * 這不是引擎的公開事件 API，不屬於 API.ts。
 */

import type { game_map } from '@/core/types';
import type { pack_registry } from '@/core/pack_manager';

let _map:      game_map      | undefined = undefined;
let _registry: pack_registry | undefined = undefined;

export function set_map(map: game_map): void
{
    _map = map;
}

export function get_map(): game_map | undefined
{
    return _map;
}

export function set_registry(registry: pack_registry): void
{
    _registry = registry;
}

export function get_registry(): pack_registry | undefined
{
    return _registry;
}

