import * as core from '@/core';

export interface command_entry
{
    pack_id: string;
    name:    string;
    command: core.cmd;
}

export function list_commands(registry: core.pack_registry): command_entry[]
{
    const entries: command_entry[] = [];
    for (const [pack_id, pack] of registry)
    {
        for (const [name, command] of Object.entries(pack.commands ?? {}))
        {
            entries.push({ pack_id, name, command });
        }
    }
    return entries;
}

/**
 * 以「pack:指令」指定來源，或只寫指令名稱。找不到或名稱同時屬於多個 pack 時報錯。
 */
export function find_command(registry: core.pack_registry, identifier: string): command_entry
{
    const idx = identifier.indexOf(':');
    if (idx !== -1)
    {
        const pack_id = identifier.slice(0, idx);
        const name = identifier.slice(idx + 1);
        const pack = registry.get(pack_id);
        if (!pack)
        {
            throw new Error(`Pack "${pack_id}" not found.`);
        }
        const command = pack.commands?.[name];
        if (!command)
        {
            throw new Error(`Command "${identifier}" not found.`);
        }
        return { pack_id, name, command };
    }

    const matches = list_commands(registry).filter(entry => entry.name === identifier);
    if (matches.length === 0)
    {
        throw new Error(`Command "${identifier}" not found.`);
    }
    if (matches.length > 1)
    {
        const candidates = matches.map(entry => `${entry.pack_id}:${entry.name}`).join(', ');
        throw new Error(`Command "${identifier}" is ambiguous: ${candidates}.`);
    }
    return matches[0];
}

/**
 * 指令描述放在 other_info.cli.description；缺少或不是文字時報錯。
 */
export function get_description(entry: command_entry): string
{
    const cli_info = entry.command.other_info?.cli as Record<string, unknown> | undefined;
    const description = cli_info?.description;
    if (typeof description !== 'string')
    {
        throw new Error(`Command "${entry.pack_id}:${entry.name}" has no other_info.cli.description.`);
    }
    return description;
}
