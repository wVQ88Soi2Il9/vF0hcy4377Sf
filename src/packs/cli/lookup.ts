import * as core from '@/core';
import { upstream_descriptions } from './descriptions';

/**
 * commands 與 op_templates 都是 CLI 可呼叫的項目，以 kind 區分。
 */
export type command_entry =
    | { kind: 'cmd';         pack_id: string; name: string; command: core.cmd }
    | { kind: 'op_template'; pack_id: string; name: string; command: core.op_template };

export function list_commands(registry: core.pack_registry): command_entry[]
{
    const entries: command_entry[] = [];
    for (const [pack_id, pack] of registry)
    {
        for (const [name, command] of Object.entries(pack.commands ?? {}))
        {
            entries.push({ kind: 'cmd', pack_id, name, command });
        }
        for (const [name, command] of Object.entries(pack.op_templates ?? {}))
        {
            entries.push({ kind: 'op_template', pack_id, name, command });
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
        if (command)
        {
            return { kind: 'cmd', pack_id, name, command };
        }
        const template = pack.op_templates?.[name];
        if (template)
        {
            return { kind: 'op_template', pack_id, name, command: template };
        }
        throw new Error(`Command "${identifier}" not found.`);
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
 * 上游項目查 upstream_descriptions，下游項目讀 other_info.cli.description；兩者皆有或皆無時報錯。
 */
export function get_description(entry: command_entry): string
{
    const key = `${entry.pack_id}:${entry.name}`;
    const upstream = upstream_descriptions[key];
    const cli_info = entry.command.other_info?.cli as Record<string, unknown> | undefined;
    const downstream = cli_info?.description;

    if (upstream !== undefined && downstream !== undefined)
    {
        throw new Error(`Command "${key}" has a description both in cli and in other_info.cli.description.`);
    }
    if (upstream !== undefined)
    {
        return upstream;
    }
    if (typeof downstream !== 'string')
    {
        throw new Error(`Command "${key}" has no description.`);
    }
    return downstream;
}
