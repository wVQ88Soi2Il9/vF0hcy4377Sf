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
 * Calculates (dim_h, dim_v) for 2D view projection in N dimensions
 * guaranteeing a Right-Oriented (正定向/右手性, det > 0) coordinate system.
 */
export function get_right_oriented_axes(num_dims: number, fixed_axes: Set<number>): { dim_h: number, dim_v: number }
{
    if (num_dims <= 1)
    {
        return { dim_h: 0, dim_v: 1 };
    }
    if (num_dims === 2)
    {
        return { dim_h: 0, dim_v: 1 };
    }

    const all_axes = Array.from({ length: num_dims }, (_, i) => i);
    const remaining = all_axes.filter(a => !fixed_axes.has(a));

    let a: number;
    let b: number;

    if (remaining.length >= 2)
    {
        a = remaining[0];
        b = remaining[1];
    }
    else if (remaining.length === 1)
    {
        a = remaining[0];
        b = (a + 1) % num_dims;
    }
    else
    {
        a = 0;
        b = 1;
    }

    const other_axes = all_axes.filter(x => x !== a && x !== b);
    const candidate_perm = [a, b, ...other_axes];

    let inversions = 0;
    for (let i = 0; i < candidate_perm.length; i++)
    {
        for (let j = i + 1; j < candidate_perm.length; j++)
        {
            if (candidate_perm[i] > candidate_perm[j])
            {
                inversions++;
            }
        }
    }

    if (inversions % 2 === 0)
    {
        return { dim_h: a, dim_v: b };
    }
    else
    {
        return { dim_h: b, dim_v: a };
    }
}

/**
 * Pack entry point called automatically by pack loader.
 */
export function init_pack(): void
{
    // Pack initialization logic if needed.
}
