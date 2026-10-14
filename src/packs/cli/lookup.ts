import * as core from '@/core';

/**
 * 在 registry 中查找指定指令名稱/ID 的目標 (core.cmd 或 core.rev_op)；找不到即 throw。
 * 支援:
 * 1. 帶 namespace 查找: "namespace:cmd" -> pack.commands / pack.operations
 * 2. 不帶 namespace 查找: 遍歷所有 pack 查找 commands 或 operations
 */
export function find_cmd_op(registry: core.pack_registry, cmd: string): core.cmd | core.rev_op
{
    if (cmd.includes(':'))
    {
        const [namespace, id] = cmd.split(':');
        const pack = registry.get(namespace);
        const target = pack?.commands?.[id] ?? pack?.operations?.[id];
        if (!target)
        {
            throw new Error(`Command "${cmd}" not found in registry.`);
        }
        return target;
    }

    for (const pack of registry.values())
    {
        const target = pack.commands?.[cmd] ?? pack.operations?.[cmd];
        if (target)
        {
            return target;
        }
    }

    throw new Error(`Command "${cmd}" not found in registry.`);
}
