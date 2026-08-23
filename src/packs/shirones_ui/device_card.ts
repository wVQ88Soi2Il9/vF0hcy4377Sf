import type { device, item_stack } from '@/API';
import
{
    evaluate_recipe,
    delete_device_command,
    move_device_command,
    select_recipe_command,
    execute_command
} from '@/API';
import { get_registry } from '@/runtime';
import { basic_ui } from '@/packs/basic_ui';
import { create_coordinate_stepper_group } from './coordinate_stepper';

function render_item_stacks(container: HTMLElement, label_text: string, stacks: item_stack[]): void
{
    const row = document.createElement('div');
    row.className = 'basic_ui_eval_row';

    const label = document.createElement('span');
    label.className = 'basic_ui_label_io';
    label.textContent = `${label_text}:`;
    row.appendChild(label);

    if (stacks.length === 0)
    {
        const empty_span = document.createElement('span');
        empty_span.className = 'basic_ui_label_sub';
        empty_span.textContent = ' (None)';
        row.appendChild(empty_span);
        container.appendChild(row);
        return;
    }

    const list = document.createElement('div');
    list.className = 'basic_ui_kv_list';
    for (const st of stacks)
    {
        const item_el = document.createElement('div');
        item_el.textContent = `${st.item_id} × ${st.quantity}`;
        list.appendChild(item_el);
    }
    row.appendChild(list);
    container.appendChild(row);
}

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
    def_span.className = 'basic_ui_card_def_id';
    def_span.textContent = dev.definition_id;

    header.appendChild(uid_span);
    header.appendChild(def_span);

    // 2. Position & Move controls
    const coords_group = create_coordinate_stepper_group(dev.position, undefined, false);

    const move_btn = document.createElement('button');
    move_btn.type = 'button';
    move_btn.textContent = 'Move';
    move_btn.className = 'basic_ui_btn_primary';

    move_btn.addEventListener('click', () =>
    {
        const parsed = coords_group.get_values();
        if (!parsed.success)
        {
            coords_group.show_error(parsed.error ?? 'Error: Invalid coordinates.');
            return;
        }

        try
        {
            const cmd = move_device_command(dev.uid, parsed.position);
            execute_command(cmd);
            coords_group.hide_error();
            refresh_callback();
        }
        catch (err: unknown)
        {
            coords_group.show_error(`Error: ${(err as Error).message}`);
        }
    });

    coords_group.row.appendChild(move_btn);

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
    none_opt.textContent = 'None';
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
        const new_rec = recipe_select.value === '' ? undefined : recipe_select.value;
        const cmd = select_recipe_command(dev.uid, new_rec);
        execute_command(cmd);
        refresh_callback();
    });

    recipe_container.appendChild(recipe_title);
    recipe_container.appendChild(recipe_select);

    // 4. Geometry and Ports Info
    const shape_row = document.createElement('div');
    const shape_label = document.createElement('span');
    shape_label.className = 'basic_ui_label_key';
    shape_label.textContent = 'Shape: ';
    shape_row.appendChild(shape_label);
    shape_row.appendChild(document.createTextNode(JSON.stringify(dev.get_shape())));

    const in_ports_row = document.createElement('div');
    const in_label = document.createElement('span');
    in_label.className = 'basic_ui_label_key';
    in_label.textContent = 'Input Ports: ';
    in_ports_row.appendChild(in_label);
    in_ports_row.appendChild(document.createTextNode(JSON.stringify(dev.get_port('input'))));

    const out_ports_row = document.createElement('div');
    const out_label = document.createElement('span');
    out_label.className = 'basic_ui_label_key';
    out_label.textContent = 'Output Ports: ';
    out_ports_row.appendChild(out_label);
    out_ports_row.appendChild(document.createTextNode(JSON.stringify(dev.get_port('output'))));

    card.appendChild(header);
    card.appendChild(coords_group.container);
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
            eval_status_row.className = 'basic_ui_eval_row';

            const eval_label = document.createElement('span');
            eval_label.className = 'basic_ui_label_eval';
            eval_label.textContent = 'Evaluation: ';

            const eval_badge = document.createElement('span');
            eval_badge.className = evaluation.valid
                ? 'basic_ui_badge basic_ui_badge_valid'
                : 'basic_ui_badge basic_ui_badge_invalid';
            eval_badge.textContent = evaluation.valid ? 'VALID' : 'INVALID';

            eval_status_row.appendChild(eval_label);
            eval_status_row.appendChild(eval_badge);

            const duration_row = document.createElement('div');
            duration_row.className = 'basic_ui_eval_row';

            const dur_label = document.createElement('span');
            dur_label.className = 'basic_ui_label_dur';
            dur_label.textContent = 'Duration: ';
            duration_row.appendChild(dur_label);
            duration_row.appendChild(document.createTextNode(`${evaluation.duration}s`));

            eval_card.appendChild(eval_status_row);
            eval_card.appendChild(duration_row);

            render_item_stacks(eval_card, 'Inputs', evaluation.inputs);
            render_item_stacks(eval_card, 'Outputs', evaluation.outputs);

            if (evaluation.other_info && Object.keys(evaluation.other_info).length > 0)
            {
                const extra_row = document.createElement('div');
                extra_row.className = 'basic_ui_eval_row';

                const extra_label = document.createElement('span');
                extra_label.className = 'basic_ui_label_extra';
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
        other_label.className = 'basic_ui_label_extra';
        other_label.textContent = 'Other Info: ';
        other_row.appendChild(other_label);
        other_row.appendChild(document.createTextNode(JSON.stringify(dev.other_info)));
        card.appendChild(other_row);
    }

    // 6. Downstream Custom Inspectors Slot
    const inspectors = basic_ui.get_device_inspectors(dev);
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

    const custom_actions = basic_ui.get_device_actions();
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
        const cmd = delete_device_command(dev.uid);
        execute_command(cmd);
        delete_callback();
    });

    actions_container.appendChild(delete_btn);
    card.appendChild(actions_container);

    container.appendChild(card);
}
