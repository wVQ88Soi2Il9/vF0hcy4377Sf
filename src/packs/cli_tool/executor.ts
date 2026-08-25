import { get_map, get_registry } from '@/runtime';
import { tokenize_input } from './parser';
import { CORE_BUILTIN_COMMANDS, execute_pack_command, format_cli_help } from './registry';

/**
 * Parses and executes a command string dynamically from Core Command Registry.
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

    // 1. Built-in Core History / State Navigation Commands
    const builtin_handler = CORE_BUILTIN_COMMANDS.get(cmd);
    if (builtin_handler)
    {
        return builtin_handler.execute(args, { map, registry });
    }

    // 2. Generic Core Command Registry Execution
    const pack_res = execute_pack_command(cmd, args, { map, registry });
    if (pack_res !== null)
    {
        return pack_res;
    }

    return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
}

// Auto-bind to DevTools Console if in browser environment
if (typeof window !== 'undefined')
{
    (window as any).cli = execute_command;
}
