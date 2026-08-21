import type { device } from '@/API';
import { evaluate_recipe, delete_device, move_device, select_recipe } from '@/API';
import { get_map, get_registry } from '@/runtime';
import { get_device_inspectors, get_device_actions } from './extensions';

/**
 * Renders the device inspection card, including position editor, recipe selector,
 * geometry metadata, downstream extension inspectors, and action buttons.
 */
export function render_device_card
(
    container:        HTMLElement,
    dev:              device,
    refresh_callback: () => void,
    delete_callback:  () => void
): void
{
    container.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'basic_ui_card';

    // 1. Header with UID and Definition ID
    const header = document.createElement('div');
    header.className = 'basic_ui_card_header';

    const uid_span = document.createElement('span');
    uid_span.style.whiteSpace = 'nowrap';
    uid_span.textContent = `Device #${dev.uid}`;

    const def_span = document.createElement('span');
    def_span.style.cssText = 'color:#89b4fa; font-weight:normal; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;';
    def_span.textContent = dev.definition_id;

    header.appendChild(uid_span);
    header.appendChild(def_span);

    // 2. Position & Move controls
    const pos_container = document.createElement('div');
    pos_container.className = 'basic_ui_form_group';

    const pos_title = document.createElement('div');
    pos_title.className = 'basic_ui_section_title';
    pos_title.textContent = 'Position (Even Coords):';

    const pos_row = document.createElement('div');
    pos_row.className = 'basic_ui_pos_row';

    const map = get_map();
    const num_dims = map ? map.size.length : dev.position.length;
    const axis_names = ['X', 'Y', 'Z', 'W', 'V'];
    const pos_inputs: HTMLInputElement[] = [];

    for (let i = 0; i < num_dims; i++)
    {
        const axis_label = i < axis_names.length ? axis_names[i] : `D${i+1}`;
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
        inp.value = String(dev.position[i]);
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

    const move_btn = document.createElement('button');
    move_btn.textContent = 'Move';
    move_btn.className = 'basic_ui_btn';

    const move_error = document.createElement('div');
    move_error.className = 'basic_ui_error_msg';
    move_error.style.display = 'none';

    move_btn.addEventListener('click', () =>
    {
        const target_pos: number[] = [];
        for (const inp of pos_inputs)
        {
            const val = parseInt(inp.value.trim(), 10);
            if (isNaN(val))
            {
                move_error.textContent = 'Error: Invalid number coordinate.';
                move_error.style.display = 'block';
                return;
            }
            if (Math.abs(val) % 2 !== 0)
            {
                move_error.textContent = 'Error: Coordinates must all be even numbers.';
                move_error.style.display = 'block';
                return;
            }
            target_pos.push(val);
        }

        const current_map = get_map();
        if (current_map)
        {
            move_device(current_map, dev.uid, target_pos);
            move_error.style.display = 'none';
            refresh_callback();
        }
    });

    pos_row.appendChild(move_btn);
    pos_container.appendChild(pos_title);
    pos_container.appendChild(pos_row);
    pos_container.appendChild(move_error);

    // 3. Recipe Selector
    const recipe_container = document.createElement('div');
    recipe_container.className = 'basic_ui_form_group';

    const recipe_title = document.createElement('div');
    recipe_title.className = 'basic_ui_section_title';
    recipe_title.textContent = 'Selected Recipe:';

    const recipe_select = document.createElement('select');
    recipe_select.className = 'basic_ui_select';

    const none_opt = document.createElement('option');
    none_opt.value = '';
    none_opt.textContent = '-- None --';
    recipe_select.appendChild(none_opt);

    const registry = get_registry();
    if (registry)
    {
        for (const [rec_id] of registry.recipes)
        {
            const opt = document.createElement('option');
            opt.value = rec_id;
            opt.textContent = rec_id;
            if (dev.selected_recipe_id === rec_id)
            {
                opt.selected = true;
            }
            recipe_select.appendChild(opt);
        }
    }

    recipe_select.addEventListener('change', () =>
    {
        const current_map = get_map();
        if (current_map)
        {
            const new_rec = recipe_select.value === '' ? undefined : recipe_select.value;
            select_recipe(current_map, dev.uid, new_rec);
            refresh_callback();
        }
    });

    recipe_container.appendChild(recipe_title);
    recipe_container.appendChild(recipe_select);

    // 4. Geometry and Ports Info
    const shape_row = document.createElement('div');
    const shape_label = document.createElement('span');
    shape_label.style.color = '#f9e2af';
    shape_label.textContent = 'Shape: ';
    shape_row.appendChild(shape_label);
    shape_row.appendChild(document.createTextNode(JSON.stringify(dev.get_shape())));

    const in_ports_row = document.createElement('div');
    const in_label = document.createElement('span');
    in_label.style.color = '#f9e2af';
    in_label.textContent = 'Input Ports: ';
    in_ports_row.appendChild(in_label);
    in_ports_row.appendChild(document.createTextNode(JSON.stringify(dev.get_port('input'))));

    const out_ports_row = document.createElement('div');
    const out_label = document.createElement('span');
    out_label.style.color = '#f9e2af';
    out_label.textContent = 'Output Ports: ';
    out_ports_row.appendChild(out_label);
    out_ports_row.appendChild(document.createTextNode(JSON.stringify(dev.get_port('output'))));

    card.appendChild(header);
    card.appendChild(pos_container);
    card.appendChild(recipe_container);
    card.appendChild(shape_row);
    card.appendChild(in_ports_row);
    card.appendChild(out_ports_row);

    // 5. Recipe Evaluation Card
    if (dev.selected_recipe_id && registry)
    {
        const evaluation = evaluate_recipe(registry, dev.selected_recipe_id, dev.uid);
        if (evaluation)
        {
            const eval_card = document.createElement('div');
            eval_card.className = 'basic_ui_eval_card';

            const eval_status_row = document.createElement('div');
            const eval_label = document.createElement('span');
            eval_label.style.color = '#cba6f7';
            eval_label.textContent = 'Evaluation: ';
            const eval_status = document.createElement('b');
            eval_status.style.color = evaluation.valid ? '#a6e3a1' : '#f38ba8';
            eval_status.textContent = evaluation.valid ? 'VALID' : 'INVALID / INCOMPATIBLE';
            eval_status_row.appendChild(eval_label);
            eval_status_row.appendChild(eval_status);

            const duration_row = document.createElement('div');
            const dur_label = document.createElement('span');
            dur_label.style.color = '#fab387';
            dur_label.textContent = 'Duration: ';
            duration_row.appendChild(dur_label);
            duration_row.appendChild(document.createTextNode(`${evaluation.duration}s`));

            const inputs_row = document.createElement('div');
            const in_eval_label = document.createElement('span');
            in_eval_label.style.color = '#89dceb';
            in_eval_label.textContent = 'Inputs: ';
            inputs_row.appendChild(in_eval_label);
            inputs_row.appendChild(document.createTextNode(JSON.stringify(evaluation.inputs)));

            const outputs_row = document.createElement('div');
            const out_eval_label = document.createElement('span');
            out_eval_label.style.color = '#a6e3a1';
            out_eval_label.textContent = 'Outputs: ';
            outputs_row.appendChild(out_eval_label);
            outputs_row.appendChild(document.createTextNode(JSON.stringify(evaluation.outputs)));

            eval_card.appendChild(eval_status_row);
            eval_card.appendChild(duration_row);
            eval_card.appendChild(inputs_row);
            eval_card.appendChild(outputs_row);

            if (evaluation.other_info && Object.keys(evaluation.other_info).length > 0)
            {
                const extra_row = document.createElement('div');
                const extra_label = document.createElement('span');
                extra_label.style.color = '#f5c2e7';
                extra_label.textContent = 'Extra: ';
                extra_row.appendChild(extra_label);
                extra_row.appendChild(document.createTextNode(JSON.stringify(evaluation.other_info)));
                eval_card.appendChild(extra_row);
            }

            card.appendChild(eval_card);
        }
    }

    if (dev.other_info && Object.keys(dev.other_info).length > 0)
    {
        const other_row = document.createElement('div');
        const other_label = document.createElement('span');
        other_label.style.color = '#cba6f7';
        other_label.textContent = 'Other Info: ';
        other_row.appendChild(other_label);
        other_row.appendChild(document.createTextNode(JSON.stringify(dev.other_info)));
        card.appendChild(other_row);
    }

    // 6. Downstream Custom Inspectors Slot
    const inspectors = get_device_inspectors(dev);
    if (inspectors.length > 0)
    {
        const inspectors_slot = document.createElement('div');
        inspectors_slot.className = 'basic_ui_form_group';
        for (const render_inspector of inspectors)
        {
            render_inspector(inspectors_slot, dev);
        }
        card.appendChild(inspectors_slot);
    }

    // 7. Actions Row (Custom downstream actions + Delete Button)
    const actions_container = document.createElement('div');
    actions_container.className = 'basic_ui_actions_row';

    const custom_actions = get_device_actions();
    for (const act of custom_actions)
    {
        const act_btn = document.createElement('button');
        act_btn.textContent = act.label;
        act_btn.className = act.is_danger ? 'basic_ui_btn_danger' : 'basic_ui_btn';
        act_btn.addEventListener('click', () =>
        {
            act.on_click(dev);
            refresh_callback();
        });
        actions_container.appendChild(act_btn);
    }

    const delete_btn = document.createElement('button');
    delete_btn.textContent = '🗑️ Delete Device';
    delete_btn.className = 'basic_ui_btn_danger';

    delete_btn.addEventListener('click', () =>
    {
        const current_map = get_map();
        if (current_map)
        {
            delete_device(current_map, dev.uid);
            delete_callback();
        }
    });

    actions_container.appendChild(delete_btn);
    card.appendChild(actions_container);

    container.appendChild(card);
}
