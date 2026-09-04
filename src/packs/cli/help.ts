/**
 * src/packs/cli/help.ts — CLI 幫助清單與指令描述格式化
 */

import * as core from '@/core';

/**
 * 自 cmd.other_info 或 reversible_operation.other_info 取得特定指令的描述文字。
 */
export function get_command_describe(command?: core.cmd | core.reversible_operation): string
{
    if (!command || !command.other_info)
    {
        return '';
    }

    const cli_meta = command.other_info['cli'] as Record<string, any> | string | undefined;
    if (typeof cli_meta === 'string')
    {
        return cli_meta;
    }
    if (typeof cli_meta === 'object' && cli_meta !== null && typeof cli_meta.describe === 'string')
    {
        return cli_meta.describe;
    }
    if (typeof command.other_info['describe'] === 'string')
    {
        return command.other_info['describe'] as string;
    }
    return '';
}

/**
 * 依據註冊表生成全域指令清單或單一指令的說明文字。
 */
export function generate_help(registry: core.pack_registry, target_cmd?: string): string
{
    if (target_cmd)
    {
        let found_pack_id: string | null = null;
        let found_id: string | null = null;
        let found_cmd: core.cmd | core.reversible_operation | undefined = undefined;

        if (target_cmd.includes(':'))
        {
            const [namespace, id] = target_cmd.split(':');
            const pack = registry.get(namespace);
            const cmd = pack?.commands?.[id] ?? (pack?.operations?.[id] as unknown as core.reversible_operation | undefined);
            if (cmd)
            {
                found_pack_id = namespace;
                found_id = id;
                found_cmd = cmd;
            }
        }
        else
        {
            for (const [pack_id, pack] of registry.entries())
            {
                const cmd = pack.commands?.[target_cmd] ?? (pack.operations?.[target_cmd] as unknown as core.reversible_operation | undefined);
                if (cmd)
                {
                    found_pack_id = pack_id;
                    found_id = target_cmd;
                    found_cmd = cmd;
                    break;
                }
            }
        }

        if (!found_pack_id || !found_id)
        {
            throw new Error(`Command "${target_cmd}" not found in registry.`);
        }

        const describe = get_command_describe(found_cmd);
        return describe ? `${found_pack_id}:${found_id} - ${describe}` : `${found_pack_id}:${found_id}`;
    }

    const lines: string[] = [];
    for (const [pack_id, pack] of registry.entries())
    {
        const cmd_keys = Object.keys(pack.commands ?? {});
        const op_keys = Object.keys(pack.operations ?? {});
        const all_cmds = new Set<string>([...cmd_keys, ...op_keys]);

        if (all_cmds.size === 0)
        {
            continue;
        }

        lines.push(`[${pack_id}]`);
        for (const cmd_id of all_cmds)
        {
            const cmd_obj = pack.commands?.[cmd_id] ?? (pack.operations?.[cmd_id] as unknown as core.reversible_operation | undefined);
            const describe = get_command_describe(cmd_obj);
            lines.push(describe ? `  ${cmd_id} - ${describe}` : `  ${cmd_id}`);
        }
    }

    return lines.join('\n');
}
