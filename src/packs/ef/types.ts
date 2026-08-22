/**
 * EF (Endfield) Pack 核心型別定義
 *
 * 涵蓋環境、機器、連接埠、配方與建造計畫之所有型別。
 */

// ─── 1. 環境型別 ─────────────────────────────────────────────────────────────

/** 單一環境標籤 */
export interface environment
{
    /** 唯一 id；配方 environment 引用 */
    id:       string;
    /** 顯示名稱 */
    label:    string;
    /** true＝內建不可刪（如 none） */
    builtin?: boolean;
}

// ─── 2. 機器與連接埠型別 ───────────────────────────────────────────────────────

/** Port 所在方位（機器正面朝上、0° 旋轉時的絕對方位） */
export type port_side = 'top' | 'right' | 'bottom' | 'left';

/**
 * Port 傳輸媒質
 * - `'belt'` — 輸送帶（固體）
 * - `'pipe'` — 管線（液體／氣體）
 */
export type port_media = 'belt' | 'pipe';
export type port_type = port_media;

/** 機器分類標籤 */
export type machine_category = '物流設備' | '倉庫存取' | '基礎生產' | '合成製造' | '電力';

/**
 * 連接埠定義（正面朝上的靜態座標）
 */
export interface port_def
{
    side:   port_side;
    offset: number;
    media:  port_media;
}

/** 機器運轉損耗 */
export interface machine_loss
{
    item:         string;
    rate_per_min: number;
}

/** 機器型態 */
export interface machine_mode
{
    id:           string;
    label:        string;
    input_ports:  readonly port_def[];
    output_ports: readonly port_def[];
    loss:         machine_loss | null;
}

/** 行為函式相關型別 */
export type machine_context = unknown;
export type machine_tick_fn = (context: machine_context) => void;
export type machine_input_fn = (item_id: string, amount: number, port_index: number) => boolean;
export type machine_output_fn = (port_index: number) => { item_id: string; amount: number } | null;
export type machine_efficiency_fn = (inputs: Map<string, number>) => number;

/** 機器定義物件 */
export interface machine
{
    readonly id:                 string;
    readonly name:               string;
    readonly width:              number;
    readonly height:             number;
    readonly power:              number;
    readonly tags:               readonly machine_category[];
    readonly is_source:          boolean;
    readonly is_sink:            boolean;
    readonly config_signed_off?: boolean;
    readonly modes:              readonly machine_mode[];
    other_info?:                 Record<string, unknown>;
}

export function get_machine_mode(m: machine, mode_id?: string): machine_mode
{
    if (mode_id)
    {
        const found = m.modes.find((mode) => mode.id === mode_id);
        if (found)
        {
            return found;
        }
    }
    return m.modes[0];
}

// ─── 3. 配方與物料型別 ─────────────────────────────────────────────────────────

export const belt_rate_limit = 30;
export const pipe_rate_limit = 60;

export type item_form = 'solid' | 'liquid' | 'gas';

export interface recipe_item
{
    item_id:  string;
    quantity: number;
}

export interface recipe_def
{
    id:            string;
    inputs:        recipe_item[];
    outputs:       recipe_item[];
    machine:       string;
    machine_mode?: string;
    environment?:  string;
    time_seconds:  number;
}

export interface product_def
{
    id:      string;
    name:    string;
    form:    item_form;
    recipes: recipe_def[];
}

export interface material_def
{
    id:   string;
    name: string;
    form: item_form;
}

export function form_to_port_media(form: item_form): port_media
{
    return form === 'solid' ? 'belt' : 'pipe';
}

export function rate_limit_for_media(media: port_media | null | undefined): number
{
    return media === 'pipe' ? pipe_rate_limit : belt_rate_limit;
}


