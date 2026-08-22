/**
 * 計畫（Plan）型別定義
 */

/**
 * 該計畫某項原料的供給速率上限
 */
export interface material_rate
{
    /** 原料中文名稱 */
    name: string;
    /** 供給速率（個/min）；`null` 代表無上限 */
    rate: number | null;
}

/**
 * 該計畫某類機器的部署數量上限
 */
export interface machine_limit
{
    /** 機器中文名稱 */
    name:  string;
    /** 數量上限；`null` 代表無上限 */
    limit: number | null;
}

/**
 * 該計畫對某產品的兌換價值
 */
export interface product_value
{
    /** 產品中文名稱 */
    name:  string;
    /** 該品項在本計畫下的兌換單價 */
    price: number;
}

/**
 * 計畫外超傳輸流入品項
 */
export interface transport_item
{
    /** 物品名 */
    name:          string;
    /** 流入速率（個／小時） */
    rate_per_hour: number;
}

/**
 * 建造計畫（基地配置 + 資源 / 機器限制 + 產品價值）
 */
export interface plan
{
    /** 計畫唯一識別碼（UUID） */
    id:                string;
    /** 計畫中文名稱（顯示用） */
    name:              string;
    /** 該計畫各原料的供給速率 */
    material_rates:    material_rate[];
    /** 該計畫各類機器的部署數量限制 */
    machine_limits:    machine_limit[];
    /** 該計畫產品的兌換價值表 */
    product_values:    product_value[];
    /**
     * 優先生產的產品清單
     */
    priority_products: { name: string; max_rate: number | null }[];
    /**
     * 計畫外額外流入
     */
    transport_items?:  transport_item[];
}
