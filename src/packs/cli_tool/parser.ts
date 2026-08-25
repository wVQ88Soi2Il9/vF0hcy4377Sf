/**
 * Strips leading '--' and outer double quotes from strict flag arguments.
 * Strict format: --"<value>"
 */
export function clean_flag_arg(arg: string): string
{
    const trimmed = arg.trim();
    if (trimmed.startsWith('--"') && trimmed.endsWith('"') && trimmed.length >= 4)
    {
        return trimmed.substring(3, trimmed.length - 1);
    }
    return trimmed;
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
 * Translation Layer: Human (1-indexed d[n]) → Internal Code (0-indexed).
 * Strict input format: "d1", "d2", "d3", ...
 */
export function parse_axis_name(name: string): number | null
{
    const lower = name.trim().toLowerCase();
    if (lower.startsWith('d'))
    {
        const human_idx = parseInt(lower.substring(1), 10);
        if (!isNaN(human_idx) && human_idx >= 1)
        {
            return human_idx - 1;
        }
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
 */
export function get_axis_label(internal_idx: number): string
{
    return `d${internal_idx + 1}`;
}

/**
 * Calculates (dim_h, dim_v) for 2D view projection in N dimensions
 * guaranteeing a Right-Oriented (正定向/右手性, det > 0) coordinate system.
 * Returns null if remaining free dimensions count is not exactly 2.
 */
export function get_right_oriented_axes(num_dims: number, fixed_axes: Set<number>): { dim_h: number; dim_v: number } | null
{
    const all_axes = Array.from({ length: num_dims }, (_, i) => i);
    const remaining = all_axes.filter(a => !fixed_axes.has(a));

    if (remaining.length !== 2)
    {
        return null;
    }

    const a = remaining[0];
    const b = remaining[1];

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
