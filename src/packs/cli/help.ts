import * as core from '@/core';
import { find_cmd_op } from './lookup';

export function get_command_describe(command?: core.cmd | core.rev_op): string
{
    const cli_info = command?.other_info?.cli as { describe?: unknown } | undefined;
    if (typeof cli_info?.describe === 'string')
    {
        return cli_info.describe;
    }
    return '';
}

function format_entry(label: string, target: core.cmd | core.rev_op): string
{
    const desc = get_command_describe(target);
    if (desc)
    {
        return `${label} - ${desc}`;
    }
    return label;
}

function list_all(registry: core.pack_registry): string
{
    const lines: string[] = [];

    for (const pack of registry.values())
    {
        const items: { id: string; desc: string }[] = [];

        if (pack.commands)
        {
            for (const [id, cmd] of Object.entries(pack.commands))
            {
                items.push({ id, desc: get_command_describe(cmd) });
            }
        }

        if (pack.operations)
        {
            for (const [id, op] of Object.entries(pack.operations))
            {
                if (!items.some(it => it.id === id))
                {
                    items.push({ id, desc: get_command_describe(op) });
                }
            }
        }

        if (items.length === 0)
        {
            continue;
        }

        lines.push(`[${pack.pack_id}]`);
        for (const item of items)
        {
            if (item.desc)
            {
                lines.push(`  ${item.id} - ${item.desc}`);
            }
            else
            {
                lines.push(`  ${item.id}`);
            }
        }
    }

    return lines.join('\n');
}

export function generate_help(registry: core.pack_registry, target_cmd?: string): string
{
    if (!target_cmd)
    {
        return list_all(registry);
    }
    else
    {
        const target = find_cmd_op(registry, target_cmd);
        if (!target.namespace || !target.id)
        {
            throw new Error(`Command "${target_cmd}" is missing namespace or id.`);
        }
        return format_entry(`${target.namespace}:${target.id}`, target);
    }
}
