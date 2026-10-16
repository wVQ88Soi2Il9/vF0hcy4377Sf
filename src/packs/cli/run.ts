import * as world from '@/world';
import { tokenize } from './tokenize';
import { coerce } from './coerce';
import { find_command } from './lookup';

/**
 * 解析一行文字並呼叫對應項目：
 * - cmd：execute(context, ...args)，context 由呼叫端決定、原樣傳下去，回傳指令結果；
 * - op_template：create(target_world, ...args) 產生 rev_op，經 submit 寫入歷史，回傳該 rev_op。
 */
export function run(target_world: world.pure_world, context: unknown, line: string): unknown
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
    if (entry.kind === 'cmd')
    {
        return entry.command.execute(context, ...args);
    }
    const op = entry.command.create(target_world, ...args);
    target_world.submit([op]);
    return op;
}
