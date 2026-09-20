import './style.css';
import * as core from '@/core';
import * as world from '@/world';

export { create_ui_layout } from './layout';
export { create_info_bar, create_device_creator } from './devices';
export { create_history_tree, create_history_tree as create_cad_timeline } from './history';
export { create_cli_bar, create_viewport_panel } from './cli';
export { create_position_input, type position_input } from './position_input';
export * from './extensions';

export function world_init(_target_world?: world.pure_world): void
{
}

export const gpts_ui: core.pack_module = {
    pack_id: 'gpts_ui',
    world_init
};

export function global_init(registry: core.pack_registry): void
{
    registry.set(gpts_ui.pack_id, gpts_ui);
}
