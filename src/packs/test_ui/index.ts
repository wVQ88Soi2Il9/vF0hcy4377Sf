import * as core from '@/core';
import * as world from '@/world';
import { mark_template, on_committed, panels } from './ui';
import type { test_ui_state } from './ui';

export * from './ui';

export const manifest: core.pack_manifest =
{
    pack_id:      'test_ui',
    provides:     { op_templates: { mark: mark_template }, other_info: { panel: { panels } } },
    create_state: (): test_ui_state => ({ listeners: [] }),
    on:           { 'core:committed': (target_world: world.pure_world) => on_committed(target_world) }
};
