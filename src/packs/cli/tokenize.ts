export interface token
{
    text:   string;
    quoted: boolean;
}

/**
 * 以空白分隔指令與參數；引號（' 或 "）內的空白不分隔。引號未閉合時報錯。
 */
export function tokenize(line: string): token[]
{
    const tokens: token[] = [];
    let i = 0;

    while (i < line.length)
    {
        const ch = line[i];
        if (/\s/.test(ch))
        {
            i++;
            continue;
        }

        if (ch === '"' || ch === "'")
        {
            const end = line.indexOf(ch, i + 1);
            if (end === -1)
            {
                throw new Error(`Unclosed quote ${ch} at column ${i}.`);
            }
            tokens.push({ text: line.slice(i + 1, end), quoted: true });
            i = end + 1;
            continue;
        }

        let end = i;
        while (end < line.length && !/\s/.test(line[end]))
        {
            if (line[end] === '"' || line[end] === "'")
            {
                throw new Error(`Unexpected quote ${line[end]} at column ${end}.`);
            }
            end++;
        }
        tokens.push({ text: line.slice(i, end), quoted: false });
        i = end;
    }

    return tokens;
}
