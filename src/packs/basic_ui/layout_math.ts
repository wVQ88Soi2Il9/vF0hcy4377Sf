/**
 * 平鋪版面的尺寸計算：一個 group 沿軸切成數個子區塊，sizes[i] 為第 i 個子區塊的 px 長度。
 * 不變量：每個 sizes[i] 落在 [limits[i].min, limits[i].max]。
 * weights[i] 為比例（同 VS Code 的 proportions），與 sizes 分開保存：容器縮放只改 sizes，
 * 使用者拖曳、收合、展開後才由呼叫端以當下的 sizes 更新 weights。
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

function check_child(sizes: number[], index: number): void
{
    if (!Number.isInteger(index) || index < 0 || index >= sizes.length)
    {
        throw new Error(`Child index ${index} is out of range for ${sizes.length} children.`);
    }
}

function sum(values: number[]): number
{
    return values.reduce((a, b) => a + b, 0);
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
    next[index] = clamp(sizes[index] + d, limits[index]);
    next[index + 1] = clamp(sizes[index + 1] - d, limits[index + 1]);
    return next;
}

function clamp(value: number, l: limit): number
{
    return Math.min(l.max, Math.max(l.min, value));
}

/**
 * weights 為有限非負數，且與 limits 等長。
 */
export function check_weights(weights: number[], limits: limit[]): void
{
    if (weights.length !== limits.length)
    {
        throw new Error(`weights has ${weights.length} entries but limits has ${limits.length}.`);
    }
    for (let i = 0; i < weights.length; i++)
    {
        check_limit(limits[i], `limits[${i}]`);
        check_finite(weights[i], `weights[${i}]`);
    }
}

/**
 * 依 weights 的比例把總長 total 分給各子區塊，並遵守上下限：
 * - total 不大於所有 min 的和：全部取 min（溢出，由呼叫端捲動）；
 * - 權重為 0 的子區塊停在 min，只有在權重為正者全部到 max 之後，才平分剩下的長度；
 * - 全部到 max 仍有剩餘：留白。
 * 一般情況下回傳值總和為 total（誤差在浮點精度內）。
 */
export function distribute(weights: number[], limits: limit[], total: number): number[]
{
    check_weights(weights, limits);
    check_finite(total, 'total');

    const n = weights.length;
    if (total <= sum(limits.map(l => l.min)))
    {
        return limits.map(l => l.min);
    }

    const positive = weights.map((_, i) => i).filter(i => weights[i] > 0);
    const zero = weights.map((_, i) => i).filter(i => weights[i] === 0);
    const next = limits.map(l => l.min);

    const saturated = sum(positive.map(i => limits[i].max)) + sum(zero.map(i => limits[i].min));
    if (total >= saturated)
    {
        for (const i of positive)
        {
            next[i] = limits[i].max;
        }
        if (zero.length > 0)
        {
            const rest = distribute(zero.map(() => 1), zero.map(i => limits[i]), total - sum(positive.map(i => limits[i].max)));
            zero.forEach((i, k) =>
            {
                next[i] = rest[k];
            });
        }
        return next;
    }

    // 有上下限的等比分配：依比例試算，越界總量較大的一方先固定在邊界，重算其餘，直到沒有越界。
    const free = new Set(positive);
    for (;;)
    {
        let fixed_sum = 0;
        for (let i = 0; i < n; i++)
        {
            if (!free.has(i))
            {
                fixed_sum += next[i];
            }
        }
        const weight_sum = sum([...free].map(i => weights[i]));
        const scale = (total - fixed_sum) / weight_sum;

        const over: number[] = [];
        const under: number[] = [];
        let excess = 0;
        let deficit = 0;
        for (const i of free)
        {
            next[i] = weights[i] * scale;
            if (next[i] > limits[i].max)
            {
                over.push(i);
                excess += next[i] - limits[i].max;
            }
            else if (next[i] < limits[i].min)
            {
                under.push(i);
                deficit += limits[i].min - next[i];
            }
        }
        if (over.length === 0 && under.length === 0)
        {
            return next;
        }
        if (excess >= deficit)
        {
            for (const i of over)
            {
                next[i] = limits[i].max;
                free.delete(i);
            }
        }
        if (deficit >= excess)
        {
            for (const i of under)
            {
                next[i] = limits[i].min;
                free.delete(i);
            }
        }
        if (free.size === 0)
        {
            return next;
        }
    }
}

/**
 * 把第 index 個子區塊設為 target，其他子區塊依 weights 分配剩下的長度；容器總長為 total。用於收合、展開。
 * target 先夾在自己的上下限，再夾在其他子區塊能讓出或吸收的範圍內（平鋪時子區塊盡量填滿容器）。
 * 其他子區塊的 min 總和放不進剩下的長度時，取 min 並溢出；全部到 max 仍有剩餘時留白。
 * 收合時 limits[index] 為 [collapsed_size, collapsed_size]；weights[index] 不使用。
 */
export function set_child_size(weights: number[], limits: limit[], index: number, target: number, total: number): number[]
{
    check_weights(weights, limits);
    check_child(weights, index);
    check_finite(target, 'target');
    check_finite(total, 'total');

    const others = weights.map((_, i) => i).filter(i => i !== index);
    const others_min = sum(others.map(i => limits[i].min));
    const others_max = sum(others.map(i => limits[i].max));
    const own = limits[index];

    let size = clamp(target, own);
    size = Math.min(size, Math.max(own.min, total - others_min));
    size = Math.max(size, Math.min(own.max, total - others_max));

    const remaining = total - size;
    const rest = remaining <= others_min
        ? others.map(i => limits[i].min)
        : distribute(others.map(i => weights[i]), others.map(i => limits[i]), remaining);
    const next = weights.map(() => 0);
    next[index] = size;
    others.forEach((i, k) =>
    {
        next[i] = rest[k];
    });
    return next;
}
