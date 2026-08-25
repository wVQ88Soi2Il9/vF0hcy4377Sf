import { tokenize_input } from './parser';
import { CLI_COMMAND_REGISTRY, format_cli_help } from './registry';

/**
 * Parses and executes a command string via registered CLI commands.
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

    if (cmd === 'help')
    {
        return format_cli_help();
    }

    const handler = CLI_COMMAND_REGISTRY.get(cmd);
    if (handler)
    {
        return handler.execute(args);
    }

    return `Unknown command: "${cmd}". Type "help" for a list of available commands.`;
}

// Auto-bind to DevTools Console if in browser environment
if (typeof window !== 'undefined')
{
    (window as any).cli = execute_command;
}
