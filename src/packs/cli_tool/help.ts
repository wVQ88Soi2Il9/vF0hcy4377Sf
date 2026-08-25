import type { pack_registry } from '@/core';

/**
 * Dynamically generates help text from commands registered in Core Command Registry,
 * along with history navigation commands.
 */
export function format_cli_help(registry: pack_registry): string
{
    const lines: string[] = ['=== Available CLI Commands ===\n'];

    lines.push('[history navigation]');
    lines.push('  undo                       - Revert previous history step');
    lines.push('  redo                       - Reapply next history step');
    lines.push('  jump_to_history <uid>      - Jump to specified history node');
    lines.push('  jump_to_prev_fork          - Jump to previous fork node in history tree');
    lines.push('  jump_to_next_fork          - Jump to next fork node in current branch');
    lines.push('  jump_to_root               - Jump to history root (node 0)');
    lines.push('  jump_to_leaf               - Jump to leaf node of current branch');
    lines.push('  delete_history_node <uid>  - Delete single history node');
    lines.push('  history                    - View current history tree overview');

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
    lines.push('  create_device test:assembler 4 4 0');
    lines.push('  move_device 1 6 6 0');
    lines.push('  delete_device 1');
    lines.push('  select_recipe 1 vanilla:iron_gear');
    lines.push('  info 1');
    lines.push('  camera d2=0');
    lines.push('  jump_to_history 5');

    return lines.join('\n');
}
