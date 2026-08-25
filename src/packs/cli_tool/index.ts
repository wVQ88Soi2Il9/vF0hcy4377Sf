import * as parser from './parser';
import * as registry from './registry';
import * as executor from './executor';

export * from './parser';
export * from './registry';
export * from './executor';

export const cli_tool = {
    pack_id: 'cli_tool',
    ...parser,
    ...registry,
    ...executor
};

export function init_pack(): void
{
    if (typeof window !== 'undefined')
    {
        (window as any).cli = executor.execute_command;
    }
}
