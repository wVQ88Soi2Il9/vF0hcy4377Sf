/**
 * Tokenizes command input while respecting double-quoted strings.
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
 * Parses consecutive string tokens into a numeric coordinate vector.
 * Strictly verifies all components are valid numbers and matches expected dimension.
 */
export function parse_vector(tokens: string[], expected_dim?: number): number[]
{
    if (tokens.length === 0)
    {
        throw new Error('Missing coordinates.');
    }

    const vec = tokens.map(t =>
    {
        const n = Number(t);
        if (isNaN(n))
        {
            throw new Error(`Invalid coordinate "${t}": must be a valid number.`);
        }
        return n;
    });

    if (expected_dim !== undefined && vec.length !== expected_dim)
    {
        throw new Error(`Dimension mismatch: expected ${expected_dim}D coordinate (${expected_dim} numbers), but got ${vec.length} (${tokens.join(' ')}).`);
    }

    return vec;
}

/**
 * Parses an integer token (e.g. UID, steps), failing fast if non-integer.
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
