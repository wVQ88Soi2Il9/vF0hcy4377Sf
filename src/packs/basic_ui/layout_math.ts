/**
 * 拖曳分割線的計算：一個 group 沿軸切成數個子區塊，sizes[i] 為第 i 個子區塊的 px 長度。
 * 不變量：每個 sizes[i] 落在 [limits[i].min, limits[i].max]。
 * 容器縮放時的等比分配交給瀏覽器的 flexbox，不在這裡。
 * 所有函式都不修改輸入，回傳新的陣列。
 */
export interface limit
{
    min: number;
    max: number;
}

function check_finite(value: number, name: string): void
{
    if (!Number.isFinite(value) || value < 0)
    {
        throw new Error(`${name} must be a non-negative finite number, got ${value}.`);
    }
}

/**
 * min 為有限非負數；max 可為 Infinity（無上限），但不可小於 min 或為 NaN。
 */
export function check_limit(value: limit, name: string): void
{
    check_finite(value.min, `${name}.min`);
    if (Number.isNaN(value.max) || value.max < value.min)
    {
        throw new Error(`${name}.max must be a number not less than min, got ${value.max}.`);
    }
}

/**
 * 檢查 sizes 與 limits 等長、每個 size 為有限非負數且落在自己的上下限內。
 */
export function check_sizes(sizes: number[], limits: limit[]): void
{
    if (sizes.length !== limits.length)
    {
        throw new Error(`sizes has ${sizes.length} entries but limits has ${limits.length}.`);
    }
    for (let i = 0; i < sizes.length; i++)
    {
        check_limit(limits[i], `limits[${i}]`);
        check_finite(sizes[i], `sizes[${i}]`);
        if (sizes[i] < limits[i].min || sizes[i] > limits[i].max)
        {
            throw new Error(`sizes[${i}] = ${sizes[i]} is outside [${limits[i].min}, ${limits[i].max}].`);
        }
    }
}

function check_separator(sizes: number[], index: number): void
{
    if (!Number.isInteger(index) || index < 0 || index >= sizes.length - 1)
    {
        throw new Error(`Separator index ${index} is out of range for ${sizes.length} children.`);
    }
}

/**
 * 第 index 條分割線（位於子區塊 index 與 index + 1 之間）可移動的範圍 [lo, hi]：
 * 正值讓左（上）側變大、右（下）側變小；兩側都不可越過自己的上下限。
 */
export function drag_range(sizes: number[], limits: limit[], index: number): [number, number]
{
    check_sizes(sizes, limits);
    check_separator(sizes, index);
    const a = index;
    const b = index + 1;
    const lo = Math.max(limits[a].min - sizes[a], sizes[b] - limits[b].max);
    const hi = Math.min(limits[a].max - sizes[a], sizes[b] - limits[b].min);
    return [lo, hi];
}

/**
 * 以拖曳開始時的 sizes 為基準，把第 index 條分割線移動 delta（夾在 drag_range 內）。
 * 只改變分割線兩側的兩個子區塊，總長不變；結果再夾回各自的上下限，消除浮點誤差造成的越界。
 */
export function resize_pair(sizes: number[], limits: limit[], index: number, delta: number): number[]
{
    if (!Number.isFinite(delta))
    {
        throw new Error(`delta must be a finite number, got ${delta}.`);
    }
    const [lo, hi] = drag_range(sizes, limits, index);
    const d = Math.min(hi, Math.max(lo, delta));
    const next = [...sizes];
    next[index] = Math.min(limits[index].max, Math.max(limits[index].min, sizes[index] + d));
    next[index + 1] = Math.min(limits[index + 1].max, Math.max(limits[index + 1].min, sizes[index + 1] - d));
    return next;
}
