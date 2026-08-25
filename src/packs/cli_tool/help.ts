import type { pack_registry } from '@/core';

/**
 * Dynamically generates help text from commands registered in Core Command Registry,
 * along with built-in runtime navigation commands.
 */
export function format_cli_help(registry: pack_registry): string
{
    const lines: string[] = ['=== Available CLI Commands ===\n'];

    lines.push('[history & navigation]');
    lines.push('  undo                     - Revert previous history step');
    lines.push('  redo                     - Reapply next history step');
    lines.push('  jump <node_uid>          - Jump to specified history node');
    lines.push('  prev-fork                - Jump to previous fork node in history tree');
    lines.push('  next-fork                - Jump to next fork node in current branch');
    lines.push('  jump-root                - Jump to history root (node 0)');
    lines.push('  jump-leaf                - Jump to leaf node of current branch');
    lines.push('  delete-node <node_uid>   - Delete single history node');
    lines.push('  history                  - View current history tree overview');

    for (const [pack_name, mod] of registry.packs)
    {
        if (mod.commands && Object.keys(mod.commands).length > 0)
        {
            lines.push(`\n[${pack_name}]`);
            for (const [cmd_id, factory] of Object.entries(mod.commands))
            {
                const cli_meta = (factory as any)?.other_info?.cli;
                const alias_str = cli_meta?.alias
                    ? ` (${Array.isArray(cli_meta.alias) ? cli_meta.alias.join(', ') : cli_meta.alias})`
                    : '';
                const desc_str = cli_meta?.describe ? ` - ${cli_meta.describe}` : '';
                lines.push(`  ${cmd_id}${alias_str}${desc_str}`);
            }
        }
    }

    lines.push('\nUsage: <command> <arg1> <arg2> ...');
    lines.push('Examples:');
    lines.push('  create test:assembler 4 4 0');
    lines.push('  move 1 6 6 0');
    lines.push('  delete 1');
    lines.push('  info 1');
    lines.push('  recipe 1 vanilla:iron_gear');
    lines.push('  camera d2=0');
    lines.push('  jump 5');

    return lines.join('\n');
}
