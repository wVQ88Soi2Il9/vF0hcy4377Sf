/**
 * Human 1-indexed string → Internal Code (0-indexed).
 * Strict input format: "d1", "d2", "d3", ... (e.g. "d1" -> 0, "d2" -> 1)
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
 * Internal Code (0-indexed) → Human 1-indexed string (e.g. 0 -> "d1", 1 -> "d2").
 * Mathematical inverse of parse_axis_name.
 */
export function format_axis_name(internal_idx: number): string
{
    if (!Number.isInteger(internal_idx) || internal_idx < 0)
    {
        throw new Error(`Invalid internal axis index: ${internal_idx}. Must be non-negative integer.`);
    }
    return `d${internal_idx + 1}`;
}
