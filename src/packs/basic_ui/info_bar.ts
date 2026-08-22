import { get_map } from '@/runtime';
import { create_floating_panel } from './panel';
import { render_device_card } from './device_card';
import { create_device_creator } from './device_creator';
import { get_panel_sections } from './extensions';

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
}

/**
 * Creates the right-side Info Bar panel supporting interactive UID lookup via dropdown,
 * device info inspection card, and downstream extension slots.
 */
export function create_info_bar(): info_bar_component
{
    const panel = create_floating_panel({
        id:            'info_bar',
        tag:           'aside',
        position_css:  'top: 16px; right: 16px;',
        default_width: '20%',
        title:         'Map Status',
        collapsible:   true,
        resize: {
            left:       true,
            min_width:  240,
            max_width:  () => Math.min(window.innerWidth * 0.4, window.innerWidth - 32),
            min_height: 200,
            max_height: () => window.innerHeight - 120
        }
    });

    const body = panel.content_element;

    // Section 1: Map stats summary
    const map_info_el = document.createElement('div');
    map_info_el.className = 'basic_ui_stats_row';

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
        const current_val = selected_uid !== undefined ? String(selected_uid) : uid_select.value;
        uid_select.innerHTML = '<option value="">-- Select Device (#UID) --</option>';

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

    // Section 4: Device Info Content Container
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
        refresh_uid_options();
        creator.refresh_definitions();

        // Render downstream custom sections
        custom_sections_el.innerHTML = '';
        const map = get_map();
        if (map)
        {
            for (const section of get_panel_sections())
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
            content_container.innerHTML = '<div class="basic_ui_error_msg">Error: Map not found</div>';
            return false;
        }

        const dev = map.devices.find(d => d.uid === uid);
        if (!dev)
        {
            content_container.innerHTML = `<div class="basic_ui_card" style="color:#f38ba8;">Device UID ${uid} not found.</div>`;
            return false;
        }

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
        element: panel.element,
        update_stats,
        display_device_info,
        clear_device_info
    };
}
