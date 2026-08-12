/**
 * Strips leading '--' and outer double quotes from flag arguments.
 * Supports: --"value", --"key=value", --key="value", --"val1, val2"
 */
export function clean_flag_arg(arg: string): string
{
    let clean = arg.trim();
    if (clean.startsWith('--'))
    {
        clean = clean.substring(2);
    }
    const eq_match = clean.match(/^[a-zA-Z0-9_]+="(.*)"$/);
    if (eq_match)
    {
        return eq_match[1].trim();
    }
    if (clean.startsWith('"') && clean.endsWith('"') && clean.length >= 2)
    {
        clean = clean.substring(1, clean.length - 1);
    }
    return clean.trim();
}

/**
 * Tokenizes command input while respecting quoted strings.
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
            current += char;
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
 * Translation Layer: Human (1-indexed) → Internal Code (0-indexed).
 *
 * Input examples:
 *   "x" / "1" / "d1" → 0
 *   "y" / "2" / "d2" → 1
 *   "z" / "3" / "d3" → 2
 *   "w" / "4" / "d4" → 3
 *   "5" / "d5"       → 4
 */
export function parse_axis_name(name: string): number | null
{
    const lower = name.trim().toLowerCase();
    if (lower === 'x')
    {
        return 0;
    }
    if (lower === 'y')
    {
        return 1;
    }
    if (lower === 'z')
    {
        return 2;
    }
    if (lower === 'w')
    {
        return 3;
    }
    if (lower.startsWith('d'))
    {
        const human_idx = parseInt(lower.substring(1), 10);
        if (!isNaN(human_idx) && human_idx >= 1)
        {
            return human_idx - 1;
        }
    }
    const direct_human_idx = parseInt(lower, 10);
    if (!isNaN(direct_human_idx) && direct_human_idx >= 1)
    {
        return direct_human_idx - 1;
    }
    return null;
}

/**
 * Translation Layer: Internal Code (0-indexed) → Human Label (1-indexed d[n] format).
 *
 * Output examples:
 *   0 → "d1"
 *   1 → "d2"
 *   2 → "d3"
 *   3 → "d4"
 *   4 → "d5"
 */
export function get_axis_label(internal_idx: number): string
{
    return `d${internal_idx + 1}`;
}

/**
 * Pack entry point called automatically by pack loader.
 */
export function init_pack(): void
{
    // Pack initialization logic if needed.
}
