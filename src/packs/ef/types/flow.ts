/**
 * Flow & Recipe 型別定義
 *
 * 流量單位：個 / 分鐘（rate_per_min）
 * 傳送帶上限：belt_rate_limit = 30 個/min；管道：pipe_rate_limit = 60 個/min
 */

import type { port_media } from './machine';

// ─── 常數 ────────────────────────────────────────────────────────────────────

/** 每條傳送帶連接線的最大流量（個/min） */
export const belt_rate_limit = 30;

/** 每條管道連接線的最大流量（個/min） */
export const pipe_rate_limit = 60;

/**
 * 品項物態（對應 materials／products 的 `form`）。
 * solid → belt；liquid／gas → pipe。
 */
export type item_form = 'solid' | 'liquid' | 'gas';

// ─── 基礎型別 ────────────────────────────────────────────────────────────────

/** 單一配方的一個輸入或輸出項目 */
export interface recipe_item
{
    /** 品項名稱（對應 products name 或 materials name） */
    item_id:  string;
    /** 單次加工的數量 */
    quantity: number;
}

/**
 * 配方定義（Recipe Definition）
 */
export interface recipe_def
{
    /** 配方唯一識別碼，格式：`<machine_id>_<product_id>_<recipe_index>` */
    id:            string;
    /** 此配方消耗的輸入品項清單 */
    inputs:        recipe_item[];
    /** 此配方產出的輸出品項清單 */
    outputs:       recipe_item[];
    /** 使用此配方的設備名稱（對應 machine.name） */
    machine:       string;
    /**
     * 機器型態 id（對應 machine.modes[].id）。
     * 缺省時由呼叫端以 modes[0].id 解釋。
     */
    machine_mode?: string;
    /**
     * 環境標籤 id（對應 environment.id）。
     * 缺省視為 `"none"`。
     */
    environment?:  string;
    /** 單次加工時間（秒） */
    time_seconds:  number;
}

/**
 * 產品定義。一個產品可有多個替代配方。
 */
export interface product_def
{
    /** 產品唯一識別碼，英文 slug，例如 `p_357bc568a0` */
    id:      string;
    /** 產品名稱 */
    name:    string;
    /**
     * 物態（對應 `form`）。
     * 缺省時執行期視為 `solid`。
     */
    form:    item_form;
    recipes: recipe_def[];
}

/**
 * 基礎材料定義。
 */
export interface material_def
{
    /** 材料唯一識別碼 */
    id:   string;
    /** 材料名稱 */
    name: string;
    /** 物態 */
    form: item_form;
}

/**
 * 物態 → 應使用的線路媒質。
 * @param form 品項 form
 */
export function form_to_port_media(form: item_form): port_media
{
    return form === 'solid' ? 'belt' : 'pipe';
}

/**
 * 依線路媒質取得速率上限；未知時保守套用 belt 上限。
 * @param media 邊或埠的媒質
 */
export function rate_limit_for_media(media: port_media | null | undefined): number
{
    return media === 'pipe' ? pipe_rate_limit : belt_rate_limit;
}
