/**
 * src/packs/cli/parser.ts — CLI 字串分詞與座標向量解析工具
 */

import * as core from '@/core';

/**
 * 分詞命令列輸入，保留雙引號字串完整性。
 */
export function tokenize_input(input: string): string[]
{
    const tokens: string[] = [];
    let current = '';
    let in_quotes = false;

    for (let i = 0; i < input.length; i++)
    {
        const char = input[i];
        if (char === '"')
        {
            in_quotes = !in_quotes;
        }
        else if (/\s/.test(char) && !in_quotes)
        {
            if (current.length > 0)
            {
                tokens.push(current);
                current = '';
            }
        }
        else
        {
            current += char;
        }
    }

    if (current.length > 0)
    {
        tokens.push(current);
    }

    return tokens;
}

/**
 * 解析連續字串 tokens 為數值座標向量。
 * 嚴格校驗每個分量皆為合法數字，並比對預期維度。
 */
export function parse_vector(tokens: string[], expected_dim?: number): core.vector
{
    if (tokens.length === 0)
    {
        throw new Error('Missing coordinates.');
    }

    const vec: core.vector = [];
    for (const t of tokens)
    {
        const n = Number(t);
        if (isNaN(n))
        {
            throw new Error(`Invalid coordinate "${t}": must be a valid number.`);
        }
        vec.push(n);
    }

    if (expected_dim !== undefined && vec.length !== expected_dim)
    {
        throw new Error(`Dimension mismatch: expected ${expected_dim}D coordinate (${expected_dim} numbers), but got ${vec.length} (${tokens.join(' ')}).`);
    }

    return vec;
}

/**
 * 解析整數 token（例如 UID、步數），若非整數則立即拋出例外。
 */
export function parse_integer(token: string, field_name: string = 'Value'): number
{
    const val = Number(token);
    if (isNaN(val) || !Number.isInteger(val))
    {
        throw new Error(`${field_name} must be an integer, got "${token}".`);
    }
    return val;
}
