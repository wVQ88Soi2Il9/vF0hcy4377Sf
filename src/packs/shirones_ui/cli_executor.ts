import { get_map, get_registry } from '@/runtime';
import { tokenize_input } from '@/packs/cli_tool';
import { CLI_COMMAND_REGISTRY, format_cli_help } from './cli_registry';

/**
 * Parses and executes a command string dynamically via Command Registry.
 */
export function execute_command(input: string): string
{
    const trimmed = input.trim();
    if (trimmed === '')
    {
        return '';
    }

    const tokens = tokenize_input(trimmed);
    const cmd    = tokens[0].toLowerCase();
    const args   = tokens.slice(1);

    const map = get_map();
    if (!map)
    {
        return 'Error: Global map instance not found.';
    }

    const registry = get_registry();
    if (!registry)
    {
        return 'Error: Global pack registry not found.';
    }

    if (cmd === 'help')
    {
        return format_cli_help();
    }

    const handler = CLI_COMMAND_REGISTRY.get(cmd);
    if (handler)
    {
        return handler.execute(args, { map, registry });
    }

    return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
}
