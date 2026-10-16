/**
 * basic_ui 內部的驗證工具，不由 index.ts 匯出。
 */

/**
 * value 必須是物件（非 null、非陣列），且只含 allowed 列出的鍵；allowed 為 null 時不限制鍵。
 */
export function check_keys(value: unknown, allowed: string[] | null, label: string): Record<string, unknown>
{
    if (typeof value !== 'object' || value === null || Array.isArray(value))
    {
        throw new Error(`${label} must be an object.`);
    }
    if (allowed !== null)
    {
        for (const key of Object.keys(value))
        {
            if (!allowed.includes(key))
            {
                throw new Error(`${label} has unknown key "${key}".`);
            }
        }
    }
    return value as Record<string, unknown>;
}

/**
 * 錯誤訊息中標示一個 panel；分開列出 pack 與名稱，避免含冒號的名稱產生歧義。
 */
export function panel_label(pack_id: string, name: string): string
{
    return `panel ${JSON.stringify(name)} of pack ${JSON.stringify(pack_id)}`;
}
