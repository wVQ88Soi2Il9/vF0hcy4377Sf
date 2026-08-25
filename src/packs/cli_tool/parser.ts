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
