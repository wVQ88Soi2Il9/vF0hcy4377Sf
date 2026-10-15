import * as core from '@/core';
import * as layout from './layout';

export * from './style.css'
export * from './layout';
export * from './panel';
export * from './splitter';
export * from './ui_state';
export * from './extensions';

export function init_pack(host: HTMLElement): void
{
    layout.get_ui_root(host);
}

export const manifest: core.pack_manifest =
{
    pack_id: 'basic_ui'
};
