import * as core from '@/core';

export * from './parser';
export * from './executor';
export * from './help';

export const manifest: core.pack_manifest =
{
    pack_id: 'cli',
    on:      {}
};
