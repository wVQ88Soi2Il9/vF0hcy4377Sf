/**
 * basic_ui 內部的驗證工具，不由 index.ts 匯出。
 */

/**
 * value 必須是純物件（原型為 Object.prototype 或 null），只含 allowed 列出的自身資料屬性
 * （不接受 getter、不可列舉或 symbol 鍵）。回傳只含這些鍵的新物件，之後讀取不會再碰到原物件。
 */
export function own_fields(value: unknown, allowed: string[] | null, label: string): Record<string, unknown>
{
    if (typeof value !== 'object' || value === null || Array.isArray(value))
    {
        throw new Error(`${label} must be a plain object.`);
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null)
    {
        throw new Error(`${label} must be a plain object.`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0)
    {
        throw new Error(`${label} must not have symbol keys.`);
    }

    const result: Record<string, unknown> = Object.create(null);
    for (const key of Object.getOwnPropertyNames(value))
    {
        if (allowed !== null && !allowed.includes(key))
        {
            throw new Error(`${label} has unknown key "${key}".`);
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, key)!;
        if (!('value' in descriptor) || !descriptor.enumerable)
        {
            throw new Error(`${label}: key "${key}" must be a plain enumerable data property.`);
        }
        result[key] = descriptor.value;
    }
    return result;
}

/**
 * value 必須是陣列，沒有空洞、getter 或索引以外的鍵；回傳淺拷貝。
 */
export function dense_array(value: unknown, label: string): unknown[]
{
    if (!Array.isArray(value))
    {
        throw new Error(`${label} must be an array.`);
    }
    if (Object.getOwnPropertySymbols(value).length > 0)
    {
        throw new Error(`${label} must not have symbol keys.`);
    }
    const length = value.length;
    for (const key of Object.getOwnPropertyNames(value))
    {
        if (key !== 'length' && !(String(Number(key)) === key && Number(key) < length))
        {
            throw new Error(`${label} has unknown key "${key}".`);
        }
    }
    const result: unknown[] = [];
    for (let i = 0; i < length; i++)
    {
        const descriptor = Object.getOwnPropertyDescriptor(value, i);
        if (descriptor === undefined)
        {
            throw new Error(`${label}[${i}] is missing.`);
        }
        if (!('value' in descriptor) || !descriptor.enumerable)
        {
            throw new Error(`${label}[${i}] must be a plain enumerable data property.`);
        }
        result.push(descriptor.value);
    }
    return result;
}

/**
 * 錯誤訊息中標示一個 panel；分開列出 pack 與名稱，避免含冒號的名稱產生歧義。
 */
export function panel_label(pack_id: string, name: string): string
{
    return `panel ${JSON.stringify(name)} of pack ${JSON.stringify(pack_id)}`;
}

/**
 * 錯誤訊息中顯示任意值；String() 失敗（例如無原型的物件）時改用型別標籤。
 */
export function show(value: unknown): string
{
    try
    {
        return String(value);
    }
    catch
    {
        return Object.prototype.toString.call(value);
    }
}
