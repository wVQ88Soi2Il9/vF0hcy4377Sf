import './style.css';
import type * as core from '@/core';
import type * as world from '@/world';
import { create_ui_layout, type shirones_ui_layout_nodes } from './layout';
import { create_info_bar, type info_bar_component } from './info_panel';
import { create_cli_bar, type cli_bar_component } from './cli_panel';
import { create_history_tree, type history_tree_component } from './history_tree_panel';
import { create_viewport_panel, type viewport_panel_component } from './viewport_panel';

export type {
    shirones_ui_layout_nodes,
    info_bar_component,
    cli_bar_component,
    history_tree_component as cad_timeline_component,
    viewport_panel_component
};

export {
    create_ui_layout,
    create_info_bar,
    create_cli_bar,
    create_history_tree as create_cad_timeline,
    create_viewport_panel
};

let bound_world: world.pure_world | null = null;

export function global_init(registry: core.pack_registry): void
{
    registry.set('shirones_ui', shirones_ui);
}

export function world_init(target_world: world.pure_world): void
{
    bound_world = target_world;
}

export function get_bound_world(): world.pure_world | null
{
    return bound_world;
}

export const shirones_ui: core.pack_module = {
    pack_id: 'shirones_ui',
    world_init
};
