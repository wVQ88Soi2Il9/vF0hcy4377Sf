import type { pack_registry } from '@/core';

/**
 * Dynamically generates help text from commands registered in Core Command Registry.
 */
export function format_cli_help(registry: pack_registry): string
{
    const lines: string[] = ['Available Pack Commands:'];

    for (const [pack_name, mod] of registry.packs)
    {
        if (mod.commands && Object.keys(mod.commands).length > 0)
        {
            const cmd_list = Object.keys(mod.commands).map(id => `${pack_name}:${id}`);
            lines.push(`  [${pack_name}] ${cmd_list.join(', ')}`);
        }
    }

    lines.push('\nUsage: <pack>:<command> --"<arg1>" --"<arg2>"');
    return lines.join('\n');
}
