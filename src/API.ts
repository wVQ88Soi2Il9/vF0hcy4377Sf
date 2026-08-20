/**
 * API.ts — 引擎公開事件契約
 *
 * 這是後續開發者（pack 作者）的唯一事件訂閱入口。
 * 每個函式都代表引擎支援的一個擴充點。
 * 新增引擎能力時，在此手動加入對應的訂閱函式。
 */

import
{
    hooks,
    type device_create_hook,
    type device_delete_hook,
    type device_move_hook,
    type device_rotate_hook,
    type device_select_recipe_hook,
    type check_overlap_hook,
    type build_graph_hook
} from '@/core/hooks';

export
{
    game_map_instance,
    create_map,
    create_device,
    delete_device,
    move_device,
    rotate_device,
    select_recipe
} from '@/core/map_manager';

export
{
    pack_registry_instance,
    create_pack_registry,
    load_pack,
    unload_pack,
    get_item,
    get_recipe,
    register_recipe,
    get_device_definition,
    evaluate_recipe,
    type pack_registry
} from '@/core/pack_manager';

export
{
    device_behavior,
    default_device_behavior,
    register_device_behavior,
    get_device_behavior
} from '@/core/device_behavior';

export
{
    get_world_cells,
    get_world_ports
} from '@/utils/device_utils';

export
{
    device_instance,
    device_definition_base
} from '@/core/types';

export type
{
    vector,
    rotation_plane,
    rotation,
    pack,
    item_definition,
    item_stack,
    recipe_evaluation,
    recipe_fn,
    recipe,
    device_definition,
    device,
    game_map
} from '@/core/types';

export type unsubscribe_function = () => void;

// ── 裝置生命週期 ──────────────────────────────────────────────────────────────

/**
 * 訂閱裝置建立事件。
 * 回傳取消訂閱函式。
 */
export function on_device_create(callback: device_create_hook): unsubscribe_function
{
    hooks.on_device_create.push(callback);
    return () =>
    {
        const index = hooks.on_device_create.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_create.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置刪除事件。
 * 回傳取消訂閱函式。
 */
export function on_device_delete(callback: device_delete_hook): unsubscribe_function
{
    hooks.on_device_delete.push(callback);
    return () =>
    {
        const index = hooks.on_device_delete.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_delete.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置移動事件。
 * 回傳取消訂閱函式。
 */
export function on_device_move(callback: device_move_hook): unsubscribe_function
{
    hooks.on_device_move.push(callback);
    return () =>
    {
        const index = hooks.on_device_move.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_move.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置旋轉事件。
 * 回傳取消訂閱函式。
 */
export function on_device_rotate(callback: device_rotate_hook): unsubscribe_function
{
    hooks.on_device_rotate.push(callback);
    return () =>
    {
        const index = hooks.on_device_rotate.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_rotate.splice(index, 1);
        }
    };
}

/**
 * 訂閱裝置選擇食譜變更事件。
 * 回傳取消訂閱函式。
 */
export function on_device_select_recipe(callback: device_select_recipe_hook): unsubscribe_function
{
    hooks.on_device_select_recipe.push(callback);
    return () =>
    {
        const index = hooks.on_device_select_recipe.indexOf(callback);
        if (index !== -1)
        {
            hooks.on_device_select_recipe.splice(index, 1);
        }
    };
}

/**
 * 訂閱任意裝置生命週期變動（create / delete / move / rotate / select_recipe）。
 * 回傳取消訂閱函式。
 */
export function on_device_change(callback: () => void): unsubscribe_function
{
    const unsub_create        = on_device_create(() => callback());
    const unsub_delete        = on_device_delete(() => callback());
    const unsub_move          = on_device_move(() => callback());
    const unsub_rotate        = on_device_rotate(() => callback());
    const unsub_select_recipe = on_device_select_recipe(() => callback());
    return () =>
    {
        unsub_create();
        unsub_delete();
        unsub_move();
        unsub_rotate();
        unsub_select_recipe();
    };
}

// ── 驗證系統 ──────────────────────────────────────────────────────────────────

/**
 * 注冊碰撞 / 越界檢查 Hook。
 * 引擎在需要驗證地圖時呼叫所有已注冊的函式並合併結果。
 */
export function register_overlap_check(fn: check_overlap_hook): unsubscribe_function
{
    hooks.on_check_overlap.push(fn);
    return () =>
    {
        const index = hooks.on_check_overlap.indexOf(fn);
        if (index !== -1)
        {
            hooks.on_check_overlap.splice(index, 1);
        }
    };
}

// ── 連接圖 ────────────────────────────────────────────────────────────────────

/**
 * 注冊連接圖建構 Hook。
 * 引擎在需要重建裝置連接關係時呼叫。
 */
export function register_graph_build(fn: build_graph_hook): unsubscribe_function
{
    hooks.on_build_graph.push(fn);
    return () =>
    {
        const index = hooks.on_build_graph.indexOf(fn);
        if (index !== -1)
        {
            hooks.on_build_graph.splice(index, 1);
        }
    };
}