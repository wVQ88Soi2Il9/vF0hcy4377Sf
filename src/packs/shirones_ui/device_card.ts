import { type device, move_device_command, delete_device_command, select_recipe_command, execute_command, format_namespaced_id, parse_namespaced_id } from '@/API';
import { get_registry } from '@/runtime';
import { basic_ui } from '@/packs/basic_ui';
import { create_coordinate_stepper_group } from './coordinate_stepper';

/**
 * Parses and formats port names, direction, and dimensions.
 */
function format_ports_summary(dev: device): string
{
    const inputs = dev.get_port('input');
    const outputs = dev.get_port('output');
    if (inputs.length === 0 && outputs.length === 0)
    {
        return 'None';
    }

    const parts: string[] = [];
    if (inputs.length > 0)
    {
        parts.push(`In: ${inputs.map(p => `(${p.join(', ')})`).join(', ')}`);
    }
    if (outputs.length > 0)
    {
        parts.push(`Out: ${outputs.map(p => `(${p.join(', ')})`).join(', ')}`);
    }
    return parts.join('; ');
}

/**
 * Extracts available recipes matching the device definition ID.
 */
function get_available_recipes(_def_id: string): Array<{ id: string; label: string }>
{
    const registry = get_registry();
    if (!registry)
    {
        return [];
    }

    const matched: Array<{ id: string; label: string }> = [];
    for (const [pack_name, mod] of registry.packs)
    {
        if (mod.recipes)
        {
            for (const [rec_id] of Object.entries(mod.recipes))
            {
                matched.push({
                    id:    `${pack_name}:${rec_id}`,
                    label: rec_id
                });
            }
        }
    }

    return matched;
}

/**
 * Renders the comprehensive Device Inspector card inside Info Bar.
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
    def_span.textContent = format_namespaced_id(dev.definition_id);

    header.appendChild(uid_span);
    header.appendChild(def_span);

    // 2. Position & Move + Delete controls
    const coords_group = create_coordinate_stepper_group(dev.position, undefined, false);

    const move_btn = document.createElement('button');
    move_btn.type = 'button';
    move_btn.textContent = '🔄';
    move_btn.className = 'basic_ui_btn_primary';
    move_btn.title = `Move Device #${dev.uid} to coordinates`;

    move_btn.addEventListener('click', () =>
    {
        const parsed = coords_group.get_values();
        if (!parsed.success)
        {
            coords_group.show_error(parsed.error);
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

    const delete_btn = document.createElement('button');
    delete_btn.type = 'button';
    delete_btn.textContent = '🗑️';
    delete_btn.className = 'basic_ui_btn_danger';
    delete_btn.title = `Delete Device #${dev.uid}`;

    delete_btn.addEventListener('click', () =>
    {
        const cmd = delete_device_command(dev.uid);
        execute_command(cmd);
        delete_callback();
    });

    coords_group.row.appendChild(move_btn);
    coords_group.row.appendChild(delete_btn);

    // 3. Recipe Selector
    const recipe_container = document.createElement('div');
    recipe_container.className = 'basic_ui_form_group';

    const recipe_title = document.createElement('div');
    recipe_title.className = 'basic_ui_section_title';
    recipe_title.textContent = 'Selected Recipe:';

    const recipe_select = document.createElement('select');
    recipe_select.className = 'basic_ui_select';

    const current_recipe_id = dev.selected_recipe_id ? format_namespaced_id(dev.selected_recipe_id) : '';
    const available_recipes = get_available_recipes(format_namespaced_id(dev.definition_id));

    recipe_select.innerHTML = '<option value="">(None / Pass-through)</option>';
    for (const r of available_recipes)
    {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.label;
        if (r.id === current_recipe_id)
        {
            opt.selected = true;
        }
        recipe_select.appendChild(opt);
    }

    recipe_select.addEventListener('change', () =>
    {
        const new_rec_str = recipe_select.value.trim();
        const new_rec_id = new_rec_str ? parse_namespaced_id(new_rec_str) : undefined;
        try
        {
            const cmd = select_recipe_command(dev.uid, new_rec_id);
            execute_command(cmd);
            refresh_callback();
        }
        catch (err: unknown)
        {
            console.error('Failed to select recipe:', err);
        }
    });

    recipe_container.appendChild(recipe_title);
    recipe_container.appendChild(recipe_select);

    // 4. Ports Specification List
    const ports_container = document.createElement('div');
    ports_container.className = 'basic_ui_form_group';

    const ports_title = document.createElement('div');
    ports_title.className = 'basic_ui_section_title';
    ports_title.textContent = 'Ports Specification:';

    const ports_text = document.createElement('div');
    ports_text.className = 'basic_ui_label_sub';
    ports_text.style.wordBreak = 'break-word';
    ports_text.textContent = format_ports_summary(dev);

    ports_container.appendChild(ports_title);
    ports_container.appendChild(ports_text);

    // 5. Dynamic Evaluation Status Card
    const eval_card = document.createElement('div');
    eval_card.className = 'basic_ui_eval_card';

    const status_row = document.createElement('div');
    status_row.className = 'basic_ui_eval_row';

    const status_label = document.createElement('span');
    status_label.className = 'basic_ui_label_key';
    status_label.textContent = 'Evaluation Status:';

    const is_valid = typeof (dev as any).validate === 'function' ? (dev as any).validate() : true;
    const badge = document.createElement('span');
    badge.className = is_valid ? 'basic_ui_badge basic_ui_badge_valid' : 'basic_ui_badge basic_ui_badge_invalid';
    badge.textContent = is_valid ? 'VALID' : 'INVALID';

    status_row.appendChild(status_label);
    status_row.appendChild(badge);
    eval_card.appendChild(status_row);

    // Extract dynamic keys
    const extra_keys = Object.keys(dev).filter(k =>
        !['uid', 'definition_id', 'position', 'selected_recipe_id', 'other_info'].includes(k)
    );

    if (extra_keys.length > 0)
    {
        const kv_list = document.createElement('div');
        kv_list.className = 'basic_ui_kv_list';
        for (const k of extra_keys)
        {
            const row = document.createElement('div');
            row.className = 'basic_ui_eval_row';
            const key_span = document.createElement('span');
            key_span.className = 'basic_ui_label_key';
            key_span.textContent = `${k}:`;
            const val_span = document.createElement('span');
            val_span.className = 'basic_ui_label_eval';
            val_span.textContent = JSON.stringify((dev as any)[k]);
            row.appendChild(key_span);
            row.appendChild(val_span);
            kv_list.appendChild(row);
        }
        eval_card.appendChild(kv_list);
    }

    card.appendChild(header);
    card.appendChild(coords_group.container);
    card.appendChild(recipe_container);
    card.appendChild(ports_container);

    if (typeof (dev as any).validate === 'function' || extra_keys.length > 0)
    {
        card.appendChild(eval_card);
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

    // 7. Custom Actions Row (if any)
    const custom_actions = basic_ui.get_device_actions();
    if (custom_actions.length > 0)
    {
        const actions_container = document.createElement('div');
        actions_container.className = 'basic_ui_actions_row';

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

        card.appendChild(actions_container);
    }

    container.appendChild(card);
}
