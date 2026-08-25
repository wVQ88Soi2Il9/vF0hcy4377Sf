import { get_map, get_registry, execute_command } from '@/world';
import { parse_namespaced_id, get_device_class, get_command } from '@/packs/vanilla';
import { basic_renderer } from '@/packs/basic_renderer';
import { basic_ui } from '@/packs/basic_ui';
import { create_coordinate_stepper_group } from './coordinate_stepper';

export interface device_creator_component
{
    element:             HTMLElement;
    refresh_definitions: () => void;
}

/**
 * Renders the Device Creation panel inside Info Bar, supporting cascading two-tier
 * namespace + device ID dropdowns, downstream custom creation option slots,
 * even coordinate steppers, validation, and instantaneous creation callback.
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

    // 1. Two-Tier Cascading Selector: Namespace (Pack) -> Device ID
    const selector_container = document.createElement('div');
    selector_container.className = 'basic_ui_lookup_row';

    const ns_select = document.createElement('select');
    ns_select.className = 'basic_ui_select basic_ui_select_pack';
    ns_select.title = 'Pack Namespace';

    const dev_select = document.createElement('select');
    dev_select.className = 'basic_ui_select basic_ui_select_device';
    dev_select.title = 'Device ID';
    dev_select.disabled = true;

    selector_container.appendChild(ns_select);
    selector_container.appendChild(dev_select);

    // Downstream custom creation options container
    const custom_options_container = document.createElement('div');
    custom_options_container.className = 'basic_ui_form_group';

    let current_option_getters: (() => Record<string, unknown>)[] = [];
    const current_ns_groups = new Map<string, Array<{ def_id: string; local_id: string }>>();

    function get_current_def_id(): string
    {
        const ns = ns_select.value.trim();
        const id = dev_select.value.trim();
        if (!ns || !id)
        {
            return '';
        }
        return ns === 'global' ? id : `${ns}:${id}`;
    }

    function update_creation_options(): void
    {
        custom_options_container.innerHTML = '';
        current_option_getters = [];

        const def_id = get_current_def_id();
        if (!def_id)
        {
            return;
        }

        const option_renderers = basic_ui.get_device_creation_options(def_id);
        for (const render of option_renderers)
        {
            const handle = render(custom_options_container, def_id);
            if (handle && typeof handle.get_other_info === 'function')
            {
                current_option_getters.push(handle.get_other_info);
            }
        }
    }

    function populate_device_select(): void
    {
        const selected_ns = ns_select.value.trim();
        const current_id = dev_select.value.trim();
        dev_select.innerHTML = '<option value="">device</option>';

        if (!selected_ns)
        {
            dev_select.disabled = true;
            update_creation_options();
            return;
        }

        dev_select.disabled = false;
        const list = current_ns_groups.get(selected_ns) || [];
        for (const item of list)
        {
            const opt = document.createElement('option');
            opt.value = item.local_id;
            opt.textContent = item.local_id;
            if (item.local_id === current_id)
            {
                opt.selected = true;
            }
            dev_select.appendChild(opt);
        }

        update_creation_options();
    }

    function refresh_definitions(): void
    {
        const prev_ns = ns_select.value.trim();
        const prev_id = dev_select.value.trim();

        current_ns_groups.clear();
        const registry = get_registry();
        if (registry)
        {
            for (const [pack_name, mod] of registry.packs)
            {
                if (mod.devices)
                {
                    let list = current_ns_groups.get(pack_name);
                    if (!list)
                    {
                        list = [];
                        current_ns_groups.set(pack_name, list);
                    }

                    for (const local_id of Object.keys(mod.devices))
                    {
                        list.push({ def_id: `${pack_name}:${local_id}`, local_id });
                    }
                }
            }
        }

        // Populate Namespace Select
        ns_select.innerHTML = '<option value="">pack</option>';
        const sorted_ns = Array.from(current_ns_groups.keys()).sort();
        for (const ns of sorted_ns)
        {
            const opt = document.createElement('option');
            opt.value = ns;
            opt.textContent = ns;
            if (ns === prev_ns)
            {
                opt.selected = true;
            }
            ns_select.appendChild(opt);
        }

        // Sort items within each namespace
        for (const [, items] of current_ns_groups)
        {
            items.sort((a, b) => a.local_id.localeCompare(b.local_id));
        }

        populate_device_select();
        if (prev_id)
        {
            dev_select.value = prev_id;
        }
        update_creation_options();
    }

    ns_select.addEventListener('change', () =>
    {
        populate_device_select();
    });

    dev_select.addEventListener('change', () =>
    {
        update_creation_options();
    });

    ns_select.addEventListener('pointerdown', () => refresh_definitions());
    ns_select.addEventListener('focus', () => refresh_definitions());
    dev_select.addEventListener('pointerdown', () =>
    {
        if (!ns_select.value.trim())
        {
            refresh_definitions();
        }
    });

    refresh_definitions();

    // 2. Position Inputs & Steppers
    const map = get_map();
    const num_dims = map ? map.dimension : 3;
    const cam_slices = basic_renderer.get_camera().slices;
    const initial_coords: number[] = [];

    for (let i = 0; i < num_dims; i++)
    {
        const initial_val = (i < cam_slices.length && i >= 2) ? (cam_slices[i] % 2 === 0 ? cam_slices[i] : 0) : 0;
        initial_coords.push(initial_val);
    }

    const coords_group = create_coordinate_stepper_group(initial_coords, undefined, false);

    const create_btn = document.createElement('button');
    create_btn.type = 'button';
    create_btn.textContent = '➕';
    create_btn.className = 'basic_ui_btn_primary';

    create_btn.addEventListener('click', () =>
    {
        const def_id = get_current_def_id();
        if (!def_id)
        {
            coords_group.show_error('Error: Please select a pack namespace and device ID.');
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
            const registry = get_registry();
            if (!registry)
            {
                coords_group.show_error('Error: Global pack registry not found.');
                return;
            }
            const ns_id = parse_namespaced_id(def_id);
            const dev_class = get_device_class(registry, ns_id);
            const create_factory = get_command(registry, { pack: 'core', id: 'create_device' });
            const cmd = create_factory(dev_class, ns_id, parsed.position, merged_other_info);
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
    card.appendChild(selector_container);
    card.appendChild(custom_options_container);
    card.appendChild(coords_group.container);

    return {
        element: card,
        refresh_definitions
    };
}
