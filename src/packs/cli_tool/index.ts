import * as parser from './parser';

export * from './parser';

export const cli_tool = {
    pack_id: 'cli_tool',
    ...parser
};

export function init_pack(): void
{
}
