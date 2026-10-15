import * as core from '@/core';
import { help_command } from './help';

export * from './tokenize';
export * from './coerce';
export * from './lookup';
export * from './run';
export * from './help';
export * from './descriptions';

export const manifest: core.pack_manifest =
{
    pack_id:  'cli',
    provides: { commands: { help: help_command } }
};
