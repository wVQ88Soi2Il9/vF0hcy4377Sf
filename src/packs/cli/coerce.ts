import type { token } from './tokenize';

export type arg_value = boolean | null | number | string;

const number_pattern = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;
const uid_pattern = /^[0-9a-f]{16}$/;

/**
 * 布林值、null、數字自動轉型，其他保留為文字；引號內的參數與 16 位 hex（uid）一律保留為文字。
 */
export function coerce(tok: token): arg_value
{
    if (tok.quoted || uid_pattern.test(tok.text))
    {
        return tok.text;
    }
    if (tok.text === 'true')
    {
        return true;
    }
    if (tok.text === 'false')
    {
        return false;
    }
    if (tok.text === 'null')
    {
        return null;
    }
    if (number_pattern.test(tok.text))
    {
        return Number(tok.text);
    }
    return tok.text;
}
