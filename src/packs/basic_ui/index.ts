import './style.css';
import * as layout from './layout';
import * as panel from './panel';
import * as splitter from './splitter';
import * as ui_state from './ui_state';
import * as extensions from './extensions';

export * from './layout';
export * from './panel';
export * from './splitter';
export * from './ui_state';
export * from './extensions';

/**
 * Object export for basic_ui framework interface.
 */
export const basic_ui = {
    pack_id: 'basic_ui',
    ...layout,
    ...panel,
    ...splitter,
    ...ui_state,
    ...extensions
};

/**
 * basic_ui framework entry point.
 */
export function init_pack(): void
{
    layout.get_ui_root();
}
