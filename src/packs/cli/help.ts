import * as core from '@/core';

export function get_command_describe(target?: core.cmd | core.rev_op): string
{
    return target?.other_info?.cli?.describe ?? '';
}

export function find_target(registry: core.pack_registry, name: string): { target: core.cmd | core.rev_op; namespace: string; id: string } | null
{
    if (name.includes(':'))
    {
        const [namespace, id] = name.split(':');
        const pack = registry.get(namespace);
        const target = pack?.commands?.[id] ?? pack?.operations?.[id];
        return target ? { target, namespace, id } : null;
    }

    for (const [pack_name, pack] of registry.entries())
    {
        const target = pack.commands?.[name] ?? pack.operations?.[name];
        if (target)
        {
            const namespace = target.namespace ?? pack.pack_id ?? pack_name;
            const id = target.id ?? name;
            return { target, namespace, id };
        }
    }

    return null;
}

function format_item(id: string, target: core.cmd | core.rev_op, indent: string = ''): string
{
    const desc = get_command_describe(target);
    return desc ? `${indent}${id} - ${desc}` : `${indent}${id}`;
}

export function generate_help(registry: core.pack_registry, target_name?: string): string
{
    if (target_name)
    {
        const entry = find_target(registry, target_name);
        if (!entry)
        {
            throw new Error(`Command "${target_name}" not found in registry.`);
        }
        return format_item(`${entry.namespace}:${entry.id}`, entry.target);
    }

    const lines: string[] = [];

    for (const [pack_name, pack] of registry.entries())
    {
        const pack_id = pack.pack_id || pack_name;
        const all_cmds = { ...pack.operations, ...pack.commands };
        const entries = Object.entries(all_cmds);

        if (entries.length === 0)
        {
            continue;
        }

        lines.push(`[${pack_id}]`);
        for (const [id, target] of entries)
        {
            lines.push(format_item(id, target, '  '));
        }
    }

    return lines.join('\n');
}
