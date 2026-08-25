export interface cli_command_spec
{
    name:        string;
    usage:       string;
    description: string;
    execute:     (args: string[]) => string;
}

export const CLI_COMMAND_REGISTRY = new Map<string, cli_command_spec>();

/**
 * Registers a CLI command specification.
 */
export function register_cli_command(spec: cli_command_spec): void
{
    CLI_COMMAND_REGISTRY.set(spec.name.toLowerCase(), spec);
}

/**
 * Retrieves a registered CLI command specification by name.
 */
export function get_cli_command(name: string): cli_command_spec | undefined
{
    return CLI_COMMAND_REGISTRY.get(name.toLowerCase());
}

/**
 * Formats help documentation from all registered CLI commands.
 */
export function format_cli_help(): string
{
    const usages = Array.from(CLI_COMMAND_REGISTRY.values()).map(s => s.usage);
    return `Available commands: ${usages.join(', ')}, help`;
}
