import { get_map, get_registry } from '@/runtime';
import { tokenize_input } from './parser';
import { CLI_COMMAND_REGISTRY, execute_generic_pack_command, format_cli_help } from './registry';

/**
 * Parses and executes a command string dynamically via Command Registry & Generic Reflection.
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
        return format_cli_help(registry);
    }

    // 1. Check built-in CLI command registry
    const handler = CLI_COMMAND_REGISTRY.get(cmd);
    if (handler)
    {
        return handler.execute(args, { map, registry });
    }

    // 2. Generic Reflection Fallback (Option 2): Auto-invoke any pack_module.commands
    const generic_res = execute_generic_pack_command(cmd, args, { map, registry });
    if (generic_res !== null)
    {
        return generic_res;
    }

    return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
}
