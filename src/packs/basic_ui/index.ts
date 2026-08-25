import './style.css';
import { get_ui_root, create_ui_container } from './layout';
import {
    create_floating_panel,
    type panel_options,
    type panel_component,
    type resize_config
} from './panel';
import {
    create_splitter,
    type splitter_options,
    type splitter_component
} from './splitter';
import {
    set_device_info_handler,
    get_device_info_handler,
    display_device_info,
    clear_device_info,
    type device_info_handler
} from './ui_state';
import {
    register_device_inspector,
    unregister_device_inspector,
    register_device_action,
    unregister_device_action,
    register_device_creation_option,
    unregister_device_creation_option,
    register_panel_section,
    unregister_panel_section,
    get_device_inspectors,
    get_device_actions,
    get_panel_sections,
    get_device_creation_options,
    clear_all_extensions,
    type device_action,
    type device_inspector_fn,
    type device_inspector_entry,
    type device_creation_option_fn,
    type device_creation_option_entry,
    type panel_section_fn,
    type panel_section_entry
} from './extensions';

export type {
    panel_options,
    panel_component,
    resize_config,
    splitter_options,
    splitter_component,
    device_info_handler,
    device_action,
    device_inspector_fn,
    device_inspector_entry,
    device_creation_option_fn,
    device_creation_option_entry,
    panel_section_fn,
    panel_section_entry
};

export {
    get_ui_root,
    create_ui_container,
    create_floating_panel,
    create_splitter,
    set_device_info_handler,
    get_device_info_handler,
    display_device_info,
    clear_device_info,
    register_device_inspector,
    unregister_device_inspector,
    register_device_action,
    unregister_device_action,
    register_device_creation_option,
    unregister_device_creation_option,
    register_panel_section,
    unregister_panel_section,
    get_device_inspectors,
    get_device_actions,
    get_panel_sections,
    get_device_creation_options,
    clear_all_extensions
};

/**
 * basic_ui framework entry point.
 * Initializes the root UI container if needed.
 */
export function init_pack(): void
{
    // Ensure base root container is ready
    get_ui_root();
}

import type { pack_module } from '@/API';

/**
 * Object export for basic_ui framework interface.
 */
export const basic_ui: pack_module = {
    pack_id: 'basic_ui',
    get_ui_root,
    create_ui_container,
    create_floating_panel,
    create_splitter,
    set_device_info_handler,
    get_device_info_handler,
    display_device_info,
    clear_device_info,
    register_device_inspector,
    unregister_device_inspector,
    register_device_action,
    unregister_device_action,
    register_device_creation_option,
    unregister_device_creation_option,
    register_panel_section,
    unregister_panel_section,
    get_device_inspectors,
    get_device_actions,
    get_panel_sections,
    get_device_creation_options,
    clear_all_extensions
};
