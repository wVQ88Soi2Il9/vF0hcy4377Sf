import * as vanilla_alpha from '@/packs/vanilla_alpha';
import { type combination, ordered, unordered, check_combination } from './combination';

const punctuation = new Set(['[', ']', '{', '}', ',']);

function tokenize(text: string): string[]
{
    const tokens: string[] = [];
    let i = 0;
    while (i < text.length)
    {
        const ch = text[i];
        if (/\s/.test(ch))
        {
            i++;
        }
        else if (punctuation.has(ch))
        {
            tokens.push(ch);
            i++;
        }
        else
        {
            let j = i;
            while (j < text.length && !/\s/.test(text[j]) && !punctuation.has(text[j]))
            {
                j++;
            }
            tokens.push(text.slice(i, j));
            i = j;
        }
    }
    return tokens;
}

/**
 * 葉：[係數*]pack:id，係數省略時為 1；一律寫 pack:id。
 */
function parse_leaf(token: string): combination
{
    const star = token.indexOf('*');
    const quantity_text = star === -1 ? '1' : token.slice(0, star);
    const id_text = star === -1 ? token : token.slice(star + 1);
    const quantity = Number(quantity_text);
    if (quantity_text.trim() === '' || Number.isNaN(quantity))
    {
        throw new Error(`parse_combination: invalid coefficient in "${token}".`);
    }
    const colon = id_text.indexOf(':');
    if (colon <= 0 || colon === id_text.length - 1)
    {
        throw new Error(`parse_combination: item must be written as pack:id, got "${id_text}".`);
    }
    return { item_id: vanilla_alpha.parse_namespaced_id(id_text), quantity };
}

/**
 * 將 "[{pack:a, 2*pack:b}, pack:c]" 解析為 combination：[ ] 為 ordered，{ } 為 unordered，可任意巢狀、可為空。
 */
export function parse_combination(text: string): combination
{
    const tokens = tokenize(text);
    let pos = 0;

    function parse_node(): combination
    {
        const token = tokens[pos];
        if (token === undefined)
        {
            throw new Error(`parse_combination: unexpected end of "${text}".`);
        }
        pos++;
        if (token === '[' || token === '{')
        {
            const close = token === '[' ? ']' : '}';
            const items: combination[] = [];
            if (tokens[pos] === close)
            {
                pos++;
            }
            else
            {
                while (true)
                {
                    items.push(parse_node());
                    const sep = tokens[pos++];
                    if (sep === close)
                    {
                        break;
                    }
                    if (sep !== ',')
                    {
                        throw new Error(`parse_combination: expected "," or "${close}" in "${text}", got ${sep === undefined ? 'end' : `"${sep}"`}.`);
                    }
                }
            }
            return token === '[' ? ordered(...items) : unordered(...items);
        }
        if (punctuation.has(token))
        {
            throw new Error(`parse_combination: unexpected "${token}" in "${text}".`);
        }
        return parse_leaf(token);
    }

    const result = parse_node();
    if (pos !== tokens.length)
    {
        throw new Error(`parse_combination: unexpected "${tokens[pos]}" after the end in "${text}".`);
    }
    check_combination(result, 'parse_combination');
    return result;
}
