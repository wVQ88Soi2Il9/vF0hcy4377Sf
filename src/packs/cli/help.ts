import * as core from '@/core';

export function get_command_describe(command: core.cmd | core.rev_op): string
{
    return command.other_info?.cli?.describe ?? ''
}

export function generate_help(registry: core.pack_registry, target_cmd?: string): string
{
    if (target_cmd)
    {
        if (target_cmd.includes(':'))
        {
            const [namespace, id] = target_cmd.split(':');
            const pack = registry.get(namespace);
            const target = pack?.commands?.[id] ?? pack?.operations?.[id];
            if (!pack || !target)
            {
                throw new Error(`Command "${target_cmd}" not found in registry.`);
            }

            const desc = get_command_describe(target);
            if (desc)
            {
                return `${namespace}:${id} - ${desc}`;
            }
            return `${namespace}:${id}`;
        }

        for (const [pack_name, pack] of registry.entries())
        {
            const target = pack.commands?.[target_cmd] ?? pack.operations?.[target_cmd];
            if (target)
            {
                const namespace = target.namespace ?? pack.pack_id ?? pack_name;
                const id = target.id ?? target_cmd;
                const desc = get_command_describe(target);
                if (desc)
                {
                    return `${namespace}:${id} - ${desc}`;
                }
                return `${namespace}:${id}`;
            }
        }

        throw new Error(`Command "${target_cmd}" not found in registry.`);
    }

    const lines: string[] = [];

    for (const [pack_name, pack] of registry.entries())
    {
        const pack_id = pack.pack_id || pack_name;
        const items: { id: string; desc: string }[] = [];

        if (pack.commands)
        {
            for (const [id, cmd] of Object.entries(pack.commands))
            {
                const desc = get_command_describe(cmd);
                items.push({ id, desc });
            }
        }

        if (pack.operations)
        {
            for (const [id, op] of Object.entries(pack.operations))
            {
                if (!items.some(it => it.id === id))
                {
                    const desc = get_command_describe(op);
                    items.push({ id, desc });
                }
            }
        }

        if (items.length === 0)
        {
            continue;
        }

        lines.push(`[${pack_id}]`);
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
