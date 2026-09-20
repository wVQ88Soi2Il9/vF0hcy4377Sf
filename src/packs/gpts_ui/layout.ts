import type { pure_world } from '@/world';
import { fill_panels, type panel_layout } from '@/packs/panel';
import { element } from './dom';
import { create_cli_bar, create_viewport_panel } from './cli';
import { create_info_bar } from './devices';
import { create_history_tree } from './history';
import { create_extensions } from './extensions';

export function create_ui_layout(target_world: pure_world, host = document.getElementById('app') ?? document.body, extensions = create_extensions())
{
    const root = element('div', 'gpts_ui');
    const center = element('div', 'gpts_center');
    let horizontal: panel_layout | undefined;
    let vertical: panel_layout | undefined;
    let history_size = 'max(25vw, 450px)';
    let info_size = '360px';
    let cli_size = '100px';
    let history_collapsed = true;
    let info_collapsed = true;
    let cli_collapsed = true;
    function resize_sides(side: 'history' | 'info', collapsed: boolean): void
    {
        if (!history_collapsed) { history_size = `${cad_timeline.element.getBoundingClientRect().width}px`; }
        if (!info_collapsed) { info_size = `${info_bar.element.getBoundingClientRect().width}px`; }
        horizontal?.reset_sizes();
        if (side === 'history') { history_collapsed = collapsed; }
        else { info_collapsed = collapsed; }
        cad_timeline.element.style.flexBasis = history_collapsed ? '38px' : history_size;
        info_bar.element.style.flexBasis = info_collapsed ? '38px' : info_size;
        if (horizontal)
        {
            horizontal.resize_handles[0].hidden = history_collapsed;
            horizontal.resize_handles[1].hidden = info_collapsed;
        }
    }
    const cad_timeline = create_history_tree(target_world, collapsed => resize_sides('history', collapsed));
    const info_bar = create_info_bar(target_world, collapsed => resize_sides('info', collapsed), extensions);
    const viewport_panel = create_viewport_panel();
    const cli_bar = create_cli_bar(target_world, collapsed =>
    {
        if (!cli_collapsed) { cli_size = `${cli_bar.element.getBoundingClientRect().height}px`; }
        vertical?.reset_sizes();
        cli_collapsed = collapsed;
        cli_bar.element.style.flexBasis = collapsed ? '40px' : cli_size;
        if (vertical) { vertical.resize_handles[0].hidden = collapsed; }
    });
    cad_timeline.element.classList.add('gpts_sidebar', 'gpts_history');
    info_bar.element.classList.add('gpts_sidebar', 'gpts_info');
    vertical = fill_panels(center, [viewport_panel.panel, cli_bar], { direction: 'column' });
    horizontal = fill_panels(root, [cad_timeline, { element: center }, info_bar]);
    [...horizontal.resize_handles, ...vertical.resize_handles].forEach(handle => { handle.hidden = true; });
    host.append(root);
    return {
        root, viewport_panel, info_bar, cad_timeline, cli_bar, extensions,
        destroy()
        {
            horizontal.reset_sizes();
            vertical.reset_sizes();
            cad_timeline.destroy();
            info_bar.destroy();
            root.remove();
        }
    };
}
