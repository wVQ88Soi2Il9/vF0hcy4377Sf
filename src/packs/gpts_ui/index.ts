import './style.css';
import type { pack_module, pack_registry } from '@/core';

export { create_ui_layout } from './layout';
export { create_info_bar, create_device_creator } from './devices';
export { create_history_tree, create_history_tree as create_cad_timeline } from './history';
export { create_cli_bar, create_viewport_panel } from './cli';
export { create_position_input, type position_input } from './position_input';
export * from './extensions';

export const gpts_ui: pack_module = { pack_id: 'gpts_ui' };

export function global_init(registry: pack_registry): void
{
    registry.set(gpts_ui.pack_id, gpts_ui);
}
