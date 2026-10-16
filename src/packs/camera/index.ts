import * as core from '@/core';
import { view_command } from './world_state';
import type { camera_pack_state } from './world_state';

export * from './project';
export * from './state';
export * from './world_state';

export const manifest: core.pack_manifest =
{
    pack_id:      'camera',
    provides:     { commands: { view: view_command } },
    create_state: (): camera_pack_state => ({})
};
