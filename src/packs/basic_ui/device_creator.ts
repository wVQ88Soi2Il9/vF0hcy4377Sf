import { create_device, get_device_class } from '@/API';
import { get_map, get_registry } from '@/runtime';
import { basic_renderer } from '@/packs/basic_renderer';
import { create_coordinate_stepper_group } from './coordinate_stepper';

export interface device_creator_component
{
    element:             HTMLElement;
    refresh_definitions: () => void;
}

/**
 * Renders the Device Creation panel inside Info Bar, supporting definition selection,
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

    // 1. Definition Selector
    const def_select = document.createElement('select');
    def_select.className = 'basic_ui_select';

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

        const current_map = get_map();
        const registry = get_registry();
        const dev_class = registry ? get_device_class(registry, def_id) : undefined;
        if (!current_map || !registry || !dev_class)
        {
            coords_group.show_error(`Error: Device class "${def_id}" or map not ready.`);
            return;
        }

        coords_group.hide_error();
        const new_dev = create_device(current_map, dev_class, def_id, parsed.position);
        if (on_device_created)
        {
            on_device_created(new_dev.uid);
        }
    });

    coords_group.row.appendChild(create_btn);

    card.appendChild(header);
    card.appendChild(def_select);
    card.appendChild(coords_group.container);

    return {
        element: card,
        refresh_definitions
    };
}
