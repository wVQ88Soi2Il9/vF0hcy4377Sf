/**
 * 機器型別定義
 *
 * 機器物理特性（靜態）與連接埠定義。
 * 行為函式與擴充屬性統一收納於 other_info。
 */

// ─── 基礎型別 ─────────────────────────────────────────────────────────────────

/** Port 所在方位（機器正面朝上、0° 旋轉時的絕對方位） */
export type port_side = 'top' | 'right' | 'bottom' | 'left';

/**
 * Port 傳輸媒質
 *
 * - `'belt'` — 輸送帶（固體）
 * - `'pipe'` — 管線（液體／氣體）
 */
export type port_media = 'belt' | 'pipe';

/**
 * 相容別名
 */
export type port_type = port_media;

/** 機器分類標籤 */
export type machine_category = '物流設備' | '倉庫存取' | '基礎生產' | '合成製造' | '電力';

/**
 * 連接埠定義（正面朝上的靜態座標，不含旋轉資訊）
 *
 * offset 語意：沿該方位邊緣的格子偏移，0-indexed。
 *   - left / right 側：從頂端往下計算（0 = 最上方格）
 *   - top / bottom 側：從左端往右計算（0 = 最左方格）
 */
export interface port_def
{
    /** 0° 旋轉時的方位 */
    side:   port_side;
    /** 沿該方位邊緣的格子偏移 */
    offset: number;
    /** 傳輸媒質：belt（固體）／pipe（液體／氣體） */
    media:  port_media;
}

/**
 * 機器運轉損耗
 */
export interface machine_loss
{
    /** 損耗物品名（材料或產品名） */
    item:         string;
    /** 每台機器每分鐘消耗量 */
    rate_per_min: number;
}

/**
 * 機器型態（modes[] 為埠／損耗的權威來源）
 */
export interface machine_mode
{
    /** 型態 id，機器內唯一；配方 machine_mode 引用 */
    id:           string;
    /** 顯示名稱 */
    label:        string;
    /** 此型態的輸入埠 */
    input_ports:  readonly port_def[];
    /** 此型態的輸出埠 */
    output_ports: readonly port_def[];
    /** 無損耗時為 null */
    loss:         machine_loss | null;
}

// ─── 行為函式型別 ─────────────────────────────────────────────────────────────

export type machine_context = unknown;
export type machine_tick_fn = (context: machine_context) => void;
export type machine_input_fn = (item_id: string, amount: number, port_index: number) => boolean;
export type machine_output_fn = (port_index: number) => { item_id: string; amount: number } | null;
export type machine_efficiency_fn = (inputs: Map<string, number>) => number;

// ─── Machine 介面 ─────────────────────────────────────────────────────────────

/**
 * 機器定義物件
 *
 * 靜態屬性（readonly）描述機器的固有物理特性。
 * 擴充資料與自訂邏輯收納於 other_info。
 */
export interface machine
{
    /** 機器唯一識別碼，英文 snake_case，例如 `shaping_machine`、`crusher` */
    readonly id:                 string;
    /** 機器顯示名稱 */
    readonly name:               string;
    /** 機器佔用格數（寬），0° 旋轉時的靜態尺寸 */
    readonly width:              number;
    /** 機器佔用格數（高），0° 旋轉時的靜態尺寸 */
    readonly height:             number;
    /**
     * 耗電量（kW）。
     * 正值 = 耗電，0 = 無電力需求，負值 = 產電，-1 = 資料尚未定義
     */
    readonly power:              number;
    /** 機器分類標籤，供工具列 / 篩選使用 */
    readonly tags:               readonly machine_category[];
    /** 是否為地區資源輸出口（產線起點，不需輸入即可產出） */
    readonly is_source:          boolean;
    /** 是否為物品輸入口（產線終點，產值計算的 sink） */
    readonly is_sink:            boolean;
    /** 設定是否已簽核 */
    readonly config_signed_off?: boolean;
    /** 多型態定義（非空）；埠與 loss 的唯一權威來源；預設＝modes[0] */
    readonly modes:              readonly machine_mode[];
    /** 擴充資訊（行為函式等收納於此） */
    other_info?:                 Record<string, unknown>;
}

/**
 * 取得機器指定型態；mode_id 缺省或找不到時回退 modes[0]。
 *
 * @param m 機器定義
 * @param mode_id 型態 id
 * @returns 對應 machine_mode
 */
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
