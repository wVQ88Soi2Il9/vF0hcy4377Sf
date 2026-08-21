import { create_device, get_device_class } from '@/API';
import { get_map, get_registry } from '@/runtime';
import { basic_renderer } from '@/packs/basic_renderer';

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

    // 2. Position Inputs
    const pos_container = document.createElement('div');
    pos_container.className = 'basic_ui_form_group';

    const pos_title = document.createElement('div');
    pos_title.className = 'basic_ui_pos_label';
    pos_title.textContent = 'Position (Even Coords):';

    const pos_row = document.createElement('div');
    pos_row.className = 'basic_ui_pos_row';

    const map = get_map();
    const num_dims = map ? map.size.length : 3;
    const axis_names = ['X', 'Y', 'Z', 'W', 'V'];
    const pos_inputs: HTMLInputElement[] = [];

    const cam_slices = basic_renderer.get_camera().slices;

    for (let i = 0; i < num_dims; i++)
    {
        const axis_label = i < axis_names.length ? axis_names[i] : `D${i + 1}`;
        const wrap = document.createElement('div');
        wrap.className = 'basic_ui_pos_field';

        const name_span = document.createElement('span');
        name_span.className = 'basic_ui_pos_label';
        name_span.textContent = `${axis_label}:`;

        const stepper = document.createElement('div');
        stepper.className = 'basic_ui_stepper';

        const inp = document.createElement('input');
        inp.type = 'number';
        inp.step = '2';
        const initial_val = (i < cam_slices.length && i >= 2) ? (cam_slices[i] % 2 === 0 ? cam_slices[i] : 0) : 0;
        inp.value = String(initial_val);
        inp.className = 'basic_ui_stepper_input';

        const btns_wrap = document.createElement('div');
        btns_wrap.className = 'basic_ui_stepper_btns';

        const btn_up = document.createElement('button');
        btn_up.type = 'button';
        btn_up.className = 'basic_ui_stepper_btn up';
        btn_up.innerHTML = '▲';
        btn_up.title = 'Increase by 2';
        btn_up.addEventListener('click', () =>
        {
            const current = parseInt(inp.value.trim(), 10) || 0;
            inp.value = String(current + 2);
        });

        const btn_down = document.createElement('button');
        btn_down.type = 'button';
        btn_down.className = 'basic_ui_stepper_btn down';
        btn_down.innerHTML = '▼';
        btn_down.title = 'Decrease by 2';
        btn_down.addEventListener('click', () =>
        {
            const current = parseInt(inp.value.trim(), 10) || 0;
            inp.value = String(current - 2);
        });

        btns_wrap.appendChild(btn_up);
        btns_wrap.appendChild(btn_down);

        stepper.appendChild(inp);
        stepper.appendChild(btns_wrap);

        pos_inputs.push(inp);
        wrap.appendChild(name_span);
        wrap.appendChild(stepper);
        pos_row.appendChild(wrap);
    }

    const create_btn = document.createElement('button');
    create_btn.type = 'button';
    create_btn.textContent = '➕ Create';
    create_btn.className = 'basic_ui_btn_primary';

    pos_row.appendChild(create_btn);

    const error_msg = document.createElement('div');
    error_msg.className = 'basic_ui_error_msg';
    error_msg.style.display = 'none';

    create_btn.addEventListener('click', () =>
    {
        const def_id = def_select.value.trim();
        if (!def_id)
        {
            error_msg.textContent = 'Error: Please select a device type.';
            error_msg.style.display = 'block';
            return;
        }

        const target_pos: number[] = [];
        for (const inp of pos_inputs)
        {
            const val = parseInt(inp.value.trim(), 10);
            if (isNaN(val))
            {
                error_msg.textContent = 'Error: Invalid number coordinate.';
                error_msg.style.display = 'block';
                return;
            }
            if (Math.abs(val) % 2 !== 0)
            {
                error_msg.textContent = 'Error: Coordinates must all be even numbers.';
                error_msg.style.display = 'block';
                return;
            }
            target_pos.push(val);
        }

        const current_map = get_map();
        if (!current_map)
        {
            error_msg.textContent = 'Error: Map instance not found.';
            error_msg.style.display = 'block';
            return;
        }

        const registry = get_registry();
        if (!registry)
        {
            error_msg.textContent = 'Error: Pack registry not found.';
            error_msg.style.display = 'block';
            return;
        }

        const dev_class = get_device_class(registry, def_id);
        if (!dev_class)
        {
            error_msg.textContent = `Error: Device class "${def_id}" not found.`;
            error_msg.style.display = 'block';
            return;
        }

        error_msg.style.display = 'none';
        const new_dev = create_device(current_map, dev_class, def_id, target_pos);
        if (on_device_created)
        {
            on_device_created(new_dev.uid);
        }
    });

    pos_container.appendChild(pos_title);
    pos_container.appendChild(pos_row);
    pos_container.appendChild(error_msg);

    card.appendChild(header);
    card.appendChild(def_select);
    card.appendChild(pos_container);

    return {
        element: card,
        refresh_definitions
    };
}
