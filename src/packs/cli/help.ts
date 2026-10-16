import * as core from '@/core';
import * as world from '@/world';
import { find_command, get_description, list_commands } from './lookup';

/**
 * 不帶參數時列出所有指令；帶指令名稱時只顯示該指令。每行為「pack:指令 — 描述」。
 */
export const help_command: core.cmd<world.pure_world> =
{
    namespace: 'cli',
    id:        'help',
    execute(target_world: world.pure_world, name?: unknown): string
    {
        const registry = target_world.catalog.registry;
        if (name === undefined)
        {
            return list_commands(registry)
                .map(entry => `${entry.pack_id}:${entry.name} — ${get_description(entry)}`)
                .join('\n');
        }
        if (typeof name !== 'string')
        {
            throw new Error(`help expects a command name, got ${JSON.stringify(name)}.`);
        }
        const entry = find_command(registry, name);
        return `${entry.pack_id}:${entry.name} — ${get_description(entry)}`;
    }
};
