/**
 * src/core_v3/domain.ts — 世界實體與物質契約（世界本身「是什麼」）
 */

import type { vector, namespaced_id, uid } from './primitives';

// ── Items ────────────────────────────────────────────────────────────────────

export interface item_definition extends namespaced_id
{
    other_info?: Record<string, unknown>;
}

export interface item_stack
{
    item_id:   namespaced_id;
    quantity:  number;
}

// ── Recipes ──────────────────────────────────────────────────────────────────

export interface recipe_evaluation
{
    /** 此配方在當前上下文是否可用 */
    valid:       boolean;

    /** 處理耗時 */
    duration:    number;

    /** 動態所需輸入物品 */
    inputs:      item_stack[];

    /** 動態產出物品 */
    outputs:     item_stack[];

    /** Mod 擴充評估中繼資料 */
    other_info?: Record<string, unknown>;
}

/**
 * 動態配方評估函式。
 */
export type recipe_fn = (device_uid?: uid) => recipe_evaluation;

export interface recipe extends namespaced_id
{
    evaluate:    recipe_fn;
    other_info?: Record<string, unknown>;
}

// ── Devices ──────────────────────────────────────────────────────────────────

/**
 * 裝置抽象基類：提供座標錨點、局部形狀 (Shape) 與連接埠 (Port) 的多型介面。
 */
export abstract class device
{
    public readonly device_uid:          uid;
    public          definition_id:       namespaced_id;
    public          position:            vector;
    public          selected_recipe_id?: namespaced_id;
    public          other_info?:         Record<string, unknown>;

    constructor(device_uid: uid, definition_id: namespaced_id, position: vector, other_info: Record<string, unknown> = {})
    {
        this.device_uid = device_uid;
        this.definition_id = definition_id;
        this.position = position;
        this.other_info = other_info;
    }

    /** 取得局部形狀格點 (Local Coordinates) */
    public abstract get_shape(): vector[];

    /** 取得局部連接埠 (Local Coordinates) */
    public abstract get_port(type: 'input' | 'output'): vector[];
}

export type device_constructor = new
(
    device_uid:    uid,
    definition_id: namespaced_id,
    position:      vector,
    other_info?:   Record<string, unknown>
) => device;

// ── Space ────────────────────────────────────────────────────────────────────

/**
 * 空間實體類別：封裝 N 維幾何維度、網格大小、UID 計數器與裝置實體集合。
 */
export class space
{
    public readonly dimension:       number;
    public          size:            vector;
    public          next_device_uid: uid;
    public          devices:         device[];

    constructor(size: vector)
    {
        this.dimension = size.length;
        this.size = size;
        this.next_device_uid = 1;
        this.devices = [];
    }
}

export interface reversible_operation extends namespaced_id
{
    /** 對目標空間施加異動 */
    execute(sp: space): void;

    /** 還原對空間的異動（必須為 execute 的精確邏輯反操作） */
    inverse(sp: space): void;

    /** 指令實例可擴充中繼資料 */
    other_info?: Record<string, unknown>;
}

export type reversible_operation_factory = (...args: any[]) => reversible_operation;