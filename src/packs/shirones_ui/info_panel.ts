import { get_map } from '@/world';
import { on_history_change } from '@/core';
import { basic_ui } from '@/packs/basic_ui';
import { render_device_card } from './device_card';
import { create_device_creator } from './device_creator';

export interface info_bar_stats
{
    device_count:   number;
    map_dimensions: string;
}

export interface info_bar_component
{
    element:             HTMLElement;
    update_stats:        (stats: info_bar_stats) => void;
    display_device_info: (uid: number) => boolean;
    clear_device_info:   () => void;
    is_collapsed:        () => boolean;
    set_collapsed:       (collapsed: boolean) => void;
}

/**
 * Creates the right-side Info Bar panel supporting interactive UID lookup via dropdown,
 * device info inspection card, downstream extension slots, and collapsible sidebar.
 */
export function create_info_bar(on_collapse_change?: (collapsed: boolean) => void): info_bar_component
{
    const panel = basic_ui.create_floating_panel({
        id:          'info_bar',
        tag:         'aside',
        title:       'Map Status',
        collapsible: false
    });

    const root_element = panel.element;
    root_element.classList.add('info_bar_root');
    root_element.classList.add('is_sidebar_collapsed');

    // Header Collapse Button (▶ collapses to the right)
    const header_collapse_btn = document.createElement('button');
    header_collapse_btn.type = 'button';
    header_collapse_btn.className = 'history_header_collapse_btn';
    header_collapse_btn.title = 'Collapse Map Status';
    header_collapse_btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';
    header_collapse_btn.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        set_collapsed(true);
    });

    panel.header_element.appendChild(header_collapse_btn);

    // Collapsed Strip (Shown when collapsed)
    const collapsed_strip = document.createElement('div');
    collapsed_strip.className = 'info_collapsed_strip';

    const expand_btn = document.createElement('button');
    expand_btn.type = 'button';
    expand_btn.className = 'info_expand_btn';
    expand_btn.title = 'Expand Map Status';
    expand_btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>';

    const strip_title = document.createElement('div');
    strip_title.className = 'info_strip_title';
    strip_title.textContent = 'Status';

    const strip_badge = document.createElement('span');
    strip_badge.className = 'info_strip_badge';
    strip_badge.textContent = '0 dev';

    expand_btn.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        set_collapsed(false);
    });

    collapsed_strip.addEventListener('click', () =>
    {
        set_collapsed(false);
    });

    collapsed_strip.appendChild(expand_btn);
    collapsed_strip.appendChild(strip_title);
    collapsed_strip.appendChild(strip_badge);

    root_element.appendChild(collapsed_strip);

    const body = panel.content_element;

    // Section 1: Map stats summary
    const map_info_el = document.createElement('div');
    map_info_el.className = 'basic_ui_stats_row';

    let currently_inspected_uid: number | null = null;
    let is_currently_collapsed = true;

    function set_collapsed(collapsed: boolean): void
    {
        is_currently_collapsed = collapsed;
        root_element.classList.toggle('is_sidebar_collapsed', collapsed);
        if (on_collapse_change)
        {
            on_collapse_change(collapsed);
        }
    }

    on_history_change(() =>
    {
        const map = get_map();
        if (map)
        {
            const device_count = map.devices.length;
            const map_dimensions = map.size.join(' × ');
            update_stats({ device_count, map_dimensions });
        }
    });

    // Section 2: Downstream Custom Panel Sections Container
    const custom_sections_el = document.createElement('div');
    custom_sections_el.className = 'basic_ui_form_group';

    // Section 3: Device Creator Section
    const creator = create_device_creator((uid) =>
    {
        display_device_info(uid);
    });

    // Section 4: Dropdown select for UID -> Get & Display Info
    const lookup_container = document.createElement('div');
    lookup_container.className = 'basic_ui_lookup_row';

    const uid_select = document.createElement('select');
    uid_select.id = 'uid_select';
    uid_select.className = 'basic_ui_select';

    function refresh_uid_options(selected_uid?: number): void
    {
        const target_uid = selected_uid !== undefined ? selected_uid : currently_inspected_uid;
        const current_val = target_uid !== null ? String(target_uid) : '';
        uid_select.innerHTML = '<option value="">Select Device (#UID)</option>';

        const map = get_map();
        if (map)
        {
            for (const dev of map.devices)
            {
                const opt = document.createElement('option');
                opt.value = String(dev.uid);
                opt.textContent = `#${dev.uid} · ${dev.definition_id} @ [${dev.position.join(', ')}]`;
                if (String(dev.uid) === current_val)
                {
                    opt.selected = true;
                }
                uid_select.appendChild(opt);
            }
        }
    }

    lookup_container.appendChild(uid_select);

    // Section 5: Device Info Content Container
    const content_container = document.createElement('div');
    content_container.className = 'basic_ui_form_group';

    body.appendChild(map_info_el);
    body.appendChild(custom_sections_el);
    body.appendChild(creator.element);
    body.appendChild(lookup_container);
    body.appendChild(content_container);

    function update_stats(stats: info_bar_stats): void
    {
        map_info_el.innerHTML = `<span>Devices: <b>${stats.device_count}</b></span><span>Size: <b>${stats.map_dimensions}</b></span>`;
        strip_badge.textContent = `${stats.device_count} dev`;
        creator.refresh_definitions();

        if (currently_inspected_uid !== null)
        {
            const map = get_map();
            const dev = map ? map.devices.find(d => d.uid === currently_inspected_uid) : undefined;
            if (dev)
            {
                render_device_card(
                    content_container,
                    dev,
                    () => display_device_info(dev.uid),
                    () => clear_device_info()
                );
                refresh_uid_options(dev.uid);
            }
            else
            {
                clear_device_info();
                refresh_uid_options();
            }
        }
        else
        {
            refresh_uid_options();
        }

        // Render downstream custom sections
        custom_sections_el.innerHTML = '';
        const map = get_map();
        if (map)
        {
            for (const section of basic_ui.get_panel_sections())
            {
                section.render(custom_sections_el, map);
            }
        }
    }

    function display_device_info(uid: number): boolean
    {
        const map = get_map();
        if (!map)
        {
            currently_inspected_uid = null;
            content_container.innerHTML = '<div class="basic_ui_error_msg">Error: Map not found</div>';
            return false;
        }

        const dev = map.devices.find(d => d.uid === uid);
        if (!dev)
        {
            currently_inspected_uid = null;
            content_container.innerHTML = `<div class="basic_ui_card" style="color:#f38ba8;">Device UID ${uid} not found.</div>`;
            return false;
        }

        // If sidebar is collapsed, expand it when inspecting a device
        if (is_currently_collapsed)
        {
            set_collapsed(false);
        }

        currently_inspected_uid = dev.uid;
        render_device_card(
            content_container,
            dev,
            () => display_device_info(dev.uid),
            () => clear_device_info()
        );
        refresh_uid_options(uid);
        return true;
    }

    function clear_device_info(): void
    {
        currently_inspected_uid = null;
        content_container.innerHTML = '';
        uid_select.value = '';
    }

    uid_select.addEventListener('change', () =>
    {
        const val = parseInt(uid_select.value.trim(), 10);
        if (!isNaN(val))
        {
            display_device_info(val);
        }
        else
        {
            clear_device_info();
        }
    });

    return {
        element:             panel.element,
        update_stats,
        display_device_info,
        clear_device_info,
        is_collapsed:        () => is_currently_collapsed,
        set_collapsed
    };
}
