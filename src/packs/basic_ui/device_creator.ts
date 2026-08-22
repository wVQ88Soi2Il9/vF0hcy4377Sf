import { create_device_command, execute_command } from '@/API';
import { get_map, get_registry } from '@/runtime';
import { basic_renderer } from '@/packs/basic_renderer';
import { create_coordinate_stepper_group } from './coordinate_stepper';
import { get_device_creation_options } from './extensions';

export interface device_creator_component
{
    element:             HTMLElement;
    refresh_definitions: () => void;
}

/**
 * Renders the Device Creation panel inside Info Bar, supporting definition selection,
 * downstream custom creation option slots, even coordinate steppers, validation, and instantaneous creation callback.
 */
export function create_device_creator
(
    on_device_created?: (uid: number) => void
): device_creator_component
{
    const card = document.createElement('div');
    card.className = 'basic_ui_card';

    const header = document.createElement('div');
    header.className = 'basic_ui_section_title';
    header.textContent = 'Create Device:';

    // 1. Definition Selector
    const def_select = document.createElement('select');
    def_select.className = 'basic_ui_select';

    // Downstream custom creation options container
    const custom_options_container = document.createElement('div');
    custom_options_container.className = 'basic_ui_form_group';

    let current_option_getters: (() => Record<string, unknown>)[] = [];

    function update_creation_options(): void
    {
        custom_options_container.innerHTML = '';
        current_option_getters = [];

        const def_id = def_select.value.trim();
        if (!def_id)
        {
            return;
        }

        const option_renderers = get_device_creation_options(def_id);
        for (const render of option_renderers)
        {
            const handle = render(custom_options_container, def_id);
            if (handle && typeof handle.get_other_info === 'function')
            {
                current_option_getters.push(handle.get_other_info);
            }
        }
    }

    def_select.addEventListener('change', update_creation_options);

    function refresh_definitions(): void
    {
        const current_val = def_select.value;
        def_select.innerHTML = '<option value="">-- Select Device Type --</option>';

        const registry = get_registry();
        if (registry)
        {
            for (const [def_id] of registry.device_classes)
            {
                const opt = document.createElement('option');
                opt.value = def_id;
                opt.textContent = def_id;
                if (def_id === current_val)
                {
                    opt.selected = true;
                }
                def_select.appendChild(opt);
            }
        }

        update_creation_options();
    }

    refresh_definitions();

    // 2. Position Inputs & Steppers
    const map = get_map();
    const num_dims = map ? map.size.length : 3;
    const cam_slices = basic_renderer.get_camera().slices;
    const initial_coords: number[] = [];

    for (let i = 0; i < num_dims; i++)
    {
        const initial_val = (i < cam_slices.length && i >= 2) ? (cam_slices[i] % 2 === 0 ? cam_slices[i] : 0) : 0;
        initial_coords.push(initial_val);
    }

    const coords_group = create_coordinate_stepper_group(initial_coords, 'Position (Even Coords):');

    const create_btn = document.createElement('button');
    create_btn.type = 'button';
    create_btn.textContent = '➕ Create';
    create_btn.className = 'basic_ui_btn_primary';

    create_btn.addEventListener('click', () =>
    {
        const def_id = def_select.value.trim();
        if (!def_id)
        {
            coords_group.show_error('Error: Please select a device type.');
            return;
        }

        const parsed = coords_group.get_values();
        if (!parsed.success)
        {
            coords_group.show_error(parsed.error);
            return;
        }

        // Collect other_info from custom creation options
        let merged_other_info: Record<string, unknown> = {};
        for (const getter of current_option_getters)
        {
            try
            {
                const info = getter();
                merged_other_info = { ...merged_other_info, ...info };
            }
            catch (err: unknown)
            {
                coords_group.show_error(`Error in creation options: ${(err as Error).message}`);
                return;
            }
        }

        try
        {
            const cmd = create_device_command(def_id, parsed.position, merged_other_info);
            execute_command(cmd);
            coords_group.hide_error();

            const current_map = get_map();
            if (current_map && on_device_created)
            {
                const latest_dev = current_map.devices[current_map.devices.length - 1];
                if (latest_dev)
                {
                    on_device_created(latest_dev.uid);
                }
            }
        }
        catch (err: unknown)
        {
            coords_group.show_error(`Error: ${(err as Error).message}`);
        }
    });

    coords_group.row.appendChild(create_btn);

    card.appendChild(header);
    card.appendChild(def_select);
    card.appendChild(custom_options_container);
    card.appendChild(coords_group.container);

    return {
        element: card,
        refresh_definitions
    };
}
