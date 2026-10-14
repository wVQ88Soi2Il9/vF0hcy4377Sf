import * as core from '@/core';

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

function find_target(pack: core.pack_module, id: string): core.cmd | core.rev_op | undefined
{
    return pack.commands?.[id] ?? pack.operations?.[id];
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
    else if (target_cmd.includes(':'))
    {
        const [namespace, id] = target_cmd.split(':');
        const pack = registry.get(namespace);
        const target = pack ? find_target(pack, id) : undefined;
        if (!target)
        {
            throw new Error(`Command "${target_cmd}" not found in registry.`);
        }
        return format_entry(`${namespace}:${id}`, target);
    }
    else
    {
        for (const pack of registry.values())
        {
            const target = find_target(pack, target_cmd);
            if (!target)
            {
                continue;
            }
            if (!target.namespace || !target.id)
            {
                throw new Error(`Command "${target_cmd}" in pack "${pack.pack_id}" is missing namespace or id.`);
            }
            return format_entry(`${target.namespace}:${target.id}`, target);
        }
        throw new Error(`Command "${target_cmd}" not found in registry.`);
    }
}
