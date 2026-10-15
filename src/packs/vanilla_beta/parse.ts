import * as core from '@/core';

/**
 * 驗證整數參數；不是整數時報錯。
 */
export function parse_int(value: unknown, name: string): number
{
    if (typeof value !== 'number' || !Number.isInteger(value))
    {
        throw new Error(`Argument "${name}" must be an integer, got ${JSON.stringify(value)}.`);
    }
    return value;
}

/**
 * 從 args[start] 起取 dim 個整數作為座標；數量不足或不是整數時報錯。
 */
export function parse_vector(args: unknown[], start: number, dim: number, name: string): core.vector
{
    if (args.length < start + dim)
    {
        throw new Error(`Argument "${name}" needs ${dim} integers, got ${Math.max(0, args.length - start)}.`);
    }
    const vec: core.vector = [];
    for (let i = 0; i < dim; i++)
    {
        vec.push(parse_int(args[start + i], `${name}[${i}]`));
    }
    return vec;
}
