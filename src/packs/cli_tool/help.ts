import type { pack_registry } from '@/core';

/**
 * Dynamically generates help text from commands registered in Core Command Registry,
 * displaying describe info from cmd.other_info.cli.describe.
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
                const describe = (factory as any)?.other_info?.cli?.describe;
                const desc_suffix = describe ? ` - ${describe}` : '';
                lines.push(`  ${pack_name}:${cmd_id}${desc_suffix}`);
            }
        }
    }

    lines.push('\nUsage: <pack>:<command> --"<arg1>" --"<arg2>"');
    return lines.join('\n');
}
