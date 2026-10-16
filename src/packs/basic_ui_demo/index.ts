import * as core from '@/core';
import { panels } from './demo';

export * from './demo';

export const manifest: core.pack_manifest =
{
    pack_id:  'basic_ui_demo',
    provides: { other_info: { basic_ui: { panels } } }
};
