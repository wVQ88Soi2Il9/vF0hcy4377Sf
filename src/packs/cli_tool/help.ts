import type { pack_registry } from '@/core';

/**
 * Dynamically generates help text from commands registered in Core Command Registry,
 * displaying alias and describe info from cmd.other_info.cli.
 */
export function format_cli_help(registry: pack_registry): string
{
    const lines: string[] = ['Available Pack Commands:'];

    for (const [pack_name, mod] of registry.packs)
    {
        if (mod.commands && Object.keys(mod.commands).length > 0)
        {
            lines.push(`\n[${pack_name}]`);
            for (const [cmd_id, factory] of Object.entries(mod.commands))
            {
                const cli_meta = (factory as any)?.other_info?.cli;
                const alias_str = cli_meta?.alias
                    ? ` (alias: ${Array.isArray(cli_meta.alias) ? cli_meta.alias.join(', ') : cli_meta.alias})`
                    : '';
                const desc_str = cli_meta?.describe ? ` - ${cli_meta.describe}` : '';
                lines.push(`  ${pack_name}:${cmd_id}${alias_str}${desc_str}`);
            }
        }
    }

    lines.push('\nUsage: <command|alias> --"<arg1>" --"<arg2>"');
    return lines.join('\n');
}
