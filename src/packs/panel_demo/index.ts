import * as core from '@/core';
import { panels } from './demo';

export * from './demo';

export const manifest: core.pack_manifest =
{
    pack_id:  'panel_demo',
    provides: { other_info: { panel: { panels } } }
};
