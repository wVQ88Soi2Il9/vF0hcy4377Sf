import * as world from '@/world';
import { tokenize } from './tokenize';
import { coerce } from './coerce';
import { find_command } from './lookup';

/**
 * 解析一行文字並呼叫對應指令：execute(target_world, ...args)，回傳指令結果。
 */
export function run(target_world: world.pure_world, line: string): unknown
{
    const tokens = tokenize(line);
    if (tokens.length === 0)
    {
        throw new Error('Empty command line.');
    }
    if (tokens[0].quoted)
    {
        throw new Error('Command name must not be quoted.');
    }

    const entry = find_command(target_world.catalog.registry, tokens[0].text);
    const args = tokens.slice(1).map(coerce);
    return entry.command.execute(target_world, ...args);
}
