import * as core from '@/core';
import { mark_template, on_committed, panels } from './ui';
import type { test_ui_state } from './ui';
import { demo_box } from './demo_device';

export * from './ui';
export * from './demo_device';

export const manifest: core.pack_manifest =
{
    pack_id:      'test_ui',
    provides:     { devices: { box: demo_box }, op_templates: { mark: mark_template }, other_info: { panel: { panels } } },
    create_state: (): test_ui_state => ({ listeners: [] }),
    on:           { 'core:committed': on_committed }
};
