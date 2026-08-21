import type { device } from '@/API';
import { evaluate_recipe, delete_device, move_device, select_recipe } from '@/API';
import { get_map, get_registry } from '@/runtime';

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
 * device info display, and direct device manipulation (delete, move, recipe selection).
 */
export function create_info_bar(): info_bar_component
{
    const element = document.createElement('aside');
    element.id = 'info_bar';
    element.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        box-sizing: border-box;
        width: 20%;
        min-width: 240px;
        max-width: min(40vw, calc(100vw - 32px));
        max-height: calc(100vh - 120px);
        min-height: 200px;
        background: rgba(24, 24, 37, 0.92);
        backdrop-filter: blur(8px);
        border: 1px solid #313244;
        border-radius: 8px;
        padding: 14px;
        color: #cdd6f4;
        font-family: monospace;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        overflow-y: auto;
        pointer-events: auto;
        z-index: 10;
    `.trim();

    // Resize Handles
    const left_resize_handle = document.createElement('div');
    left_resize_handle.id = 'info_bar_left_resize';
    left_resize_handle.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 6px;
        cursor: ew-resize;
        user-select: none;
        z-index: 20;
        transition: background 0.2s;
    `.trim();

    let is_resizing_x = false;
    let start_mouse_x = 0;
    let start_panel_width = 320;

    left_resize_handle.addEventListener('mouseenter', () =>
    {
        left_resize_handle.style.background = 'rgba(137, 180, 250, 0.4)';
    });

    left_resize_handle.addEventListener('mouseleave', () =>
    {
        if (!is_resizing_x)
        {
            left_resize_handle.style.background = 'transparent';
        }
    });

    left_resize_handle.addEventListener('mousedown', (e) =>
    {
        is_resizing_x = true;
        start_mouse_x = e.clientX;
        start_panel_width = element.offsetWidth;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        left_resize_handle.style.background = 'rgba(137, 180, 250, 0.6)';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) =>
    {
        if (is_resizing_x)
        {
            const dx = start_mouse_x - e.clientX;
            const max_allowed_w = Math.max(240, Math.min(window.innerWidth * 0.4, window.innerWidth - 32));
            const new_w = Math.max(240, Math.min(max_allowed_w, start_panel_width + dx));
            element.style.width = `${new_w}px`;
        }
    });

    window.addEventListener('mouseup', () =>
    {
        if (is_resizing_x)
        {
            is_resizing_x = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            left_resize_handle.style.background = 'transparent';
        }
    });

    element.appendChild(left_resize_handle);

    // Section 1: Header / Map stats
    const stats_container = document.createElement('div');
    stats_container.style.cssText = 'border-bottom: 1px solid #45475a; padding-bottom: 8px; margin-bottom: 2px; width: 100%; min-width: 0; box-sizing: border-box;';

    const header_top = document.createElement('div');
    header_top.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; width: 100%; min-width: 0;';

    const title_el = document.createElement('h3');
    title_el.style.cssText = 'margin: 0; font-size: 14px; color: #89b4fa; font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
    title_el.textContent = 'Map Status';

    const collapse_btn = document.createElement('button');
    collapse_btn.id = 'info_bar_collapse_btn';
    collapse_btn.title = 'Collapse / Expand panel';
    collapse_btn.innerHTML = '−';
    collapse_btn.style.cssText = `
        background: transparent;
        border: 1px solid #45475a;
        border-radius: 4px;
        color: #a6adc8;
        font-size: 12px;
        font-weight: bold;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        flex-shrink: 0;
    `.trim();

    header_top.appendChild(title_el);
    header_top.appendChild(collapse_btn);

    const map_info_el = document.createElement('div');
    map_info_el.style.cssText = 'color: #a6adc8; font-size: 12px; display: flex; justify-content: space-between; width: 100%; min-width: 0;';

    stats_container.appendChild(header_top);
    stats_container.appendChild(map_info_el);

    // Section 2: Dropdown select for UID -> Get & Display Info
    const lookup_container = document.createElement('div');
    lookup_container.style.cssText = 'display: flex; gap: 6px; align-items: center; width: 100%; min-width: 0; box-sizing: border-box;';

    const uid_select = document.createElement('select');
    uid_select.id = 'uid_select';
    uid_select.style.cssText = `
        flex: 1;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        background: #1e1e2e;
        border: 1px solid #45475a;
        border-radius: 4px;
        color: #cdd6f4;
        padding: 4px 8px;
        font-family: monospace;
        font-size: 12px;
        outline: none;
        cursor: pointer;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        box-sizing: border-box;
    `.trim();

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

    // Section 3: Device Info Content Display
    const content_container = document.createElement('div');
    content_container.style.cssText = 'display: flex; flex-direction: column; gap: 8px; width: 100%; min-width: 0; box-sizing: border-box;';

    element.appendChild(stats_container);
    element.appendChild(lookup_container);
    element.appendChild(content_container);

    let is_collapsed = false;
    let saved_expanded_width: string = '20%';

    collapse_btn.addEventListener('click', () =>
    {
        is_collapsed = !is_collapsed;
        if (is_collapsed)
        {
            saved_expanded_width = `${element.offsetWidth}px`;
            collapse_btn.innerHTML = '+';
            map_info_el.style.display = 'none';
            lookup_container.style.display = 'none';
            content_container.style.display = 'none';
            left_resize_handle.style.display = 'none';

            element.style.width = 'auto';
            element.style.minWidth = 'unset';
            element.style.minHeight = 'unset';
            element.style.maxHeight = 'unset';
            element.style.padding = '8px 12px';
            element.style.gap = '0';
            stats_container.style.borderBottom = 'none';
            stats_container.style.paddingBottom = '0';
            stats_container.style.marginBottom = '0';
        }
        else
        {
            collapse_btn.innerHTML = '−';
            map_info_el.style.display = 'flex';
            lookup_container.style.display = 'flex';
            content_container.style.display = 'flex';
            left_resize_handle.style.display = 'block';

            element.style.width = saved_expanded_width;
            element.style.minWidth = '240px';
            element.style.minHeight = '200px';
            element.style.maxHeight = 'calc(100vh - 120px)';
            element.style.padding = '14px';
            element.style.gap = '12px';
            stats_container.style.borderBottom = '1px solid #45475a';
            stats_container.style.paddingBottom = '8px';
            stats_container.style.marginBottom = '2px';
        }
    });

    function update_stats(stats: info_bar_stats): void
    {
        map_info_el.innerHTML = `<span>Devices: <b>${stats.device_count}</b></span><span>Size: <b>${stats.map_dimensions}</b></span>`;
        refresh_uid_options();
    }

    function render_device_details(dev: device): void
    {
        content_container.innerHTML = '';

        const card = document.createElement('div');
        card.style.cssText = 'background: #1e1e2e; border: 1px solid #45475a; border-radius: 6px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 8px; width: 100%; min-width: 0; box-sizing: border-box; overflow-wrap: anywhere; word-break: break-all;';

        const header = document.createElement('div');
        header.style.cssText = 'color: #a6e3a1; font-weight: bold; font-size: 13px; border-bottom: 1px dashed #45475a; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center; width: 100%; min-width: 0; gap: 6px;';
        header.innerHTML = `<span style="white-space:nowrap;">Device #${dev.uid}</span><span style="color:#89b4fa; font-weight:normal; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${dev.definition_id}</span>`;

        // Position & Move controls
        const pos_container = document.createElement('div');
        pos_container.style.cssText = 'display: flex; flex-direction: column; gap: 4px; width: 100%; min-width: 0; box-sizing: border-box;';

        const pos_title = document.createElement('div');
        pos_title.style.cssText = 'color: #89b4fa; font-size: 11px; font-weight: bold;';
        pos_title.textContent = 'Position (Even Coords):';

        const pos_row = document.createElement('div');
        pos_row.style.cssText = 'display: flex; flex-wrap: wrap; gap: 6px; align-items: center; width: 100%; min-width: 0; box-sizing: border-box;';

        const map = get_map();
        const num_dims = map ? map.size.length : dev.position.length;
        const axis_names = ['X', 'Y', 'Z', 'W', 'V'];
        const pos_inputs: HTMLInputElement[] = [];

        for (let i = 0; i < num_dims; i++)
        {
            const axis_label = i < axis_names.length ? axis_names[i] : `D${i+1}`;
            const wrap = document.createElement('div');
            wrap.style.cssText = 'display: flex; align-items: center; gap: 4px; flex: 1 1 calc(30% - 6px); min-width: 60px;';

            const name_span = document.createElement('span');
            name_span.style.cssText = 'font-size: 11px; color: #a6adc8; font-weight: bold; min-width: 14px;';
            name_span.textContent = `${axis_label}:`;

            const inp = document.createElement('input');
            inp.type = 'number';
            inp.step = '2';
            inp.value = String(dev.position[i]);
            inp.style.cssText = `
                width: 100%;
                min-width: 36px;
                background: #11111b;
                border: 1px solid #45475a;
                border-radius: 4px;
                color: #cdd6f4;
                padding: 3px 4px;
                font-family: monospace;
                font-size: 11px;
                text-align: center;
                outline: none;
                box-sizing: border-box;
            `.trim();

            pos_inputs.push(inp);
            wrap.appendChild(name_span);
            wrap.appendChild(inp);
            pos_row.appendChild(wrap);
        }

        const move_btn = document.createElement('button');
        move_btn.textContent = 'Move';
        move_btn.style.cssText = `
            background: #313244;
            border: 1px solid #585b70;
            border-radius: 4px;
            color: #cdd6f4;
            padding: 3px 8px;
            font-size: 11px;
            cursor: pointer;
            font-weight: bold;
        `.trim();

        const move_error = document.createElement('div');
        move_error.style.cssText = 'color: #f38ba8; font-size: 10px; display: none;';

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
                display_device_info(dev.uid);
            }
        });

        pos_row.appendChild(move_btn);
        pos_container.appendChild(pos_title);
        pos_container.appendChild(pos_row);
        pos_container.appendChild(move_error);

        // Recipe Selector Row
        const recipe_container = document.createElement('div');
        recipe_container.style.cssText = 'display: flex; flex-direction: column; gap: 4px; width: 100%; min-width: 0; box-sizing: border-box;';

        const recipe_title = document.createElement('div');
        recipe_title.style.cssText = 'color: #89b4fa; font-size: 11px; font-weight: bold;';
        recipe_title.textContent = 'Selected Recipe:';

        const recipe_select = document.createElement('select');
        recipe_select.style.cssText = `
            width: 100%;
            min-width: 0;
            max-width: 100%;
            background: #11111b;
            border: 1px solid #45475a;
            border-radius: 4px;
            color: #cdd6f4;
            padding: 4px 6px;
            font-family: monospace;
            font-size: 11px;
            outline: none;
            cursor: pointer;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            box-sizing: border-box;
        `.trim();

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
                display_device_info(dev.uid);
            }
        });

        recipe_container.appendChild(recipe_title);
        recipe_container.appendChild(recipe_select);

        const shape_row = document.createElement('div');
        shape_row.innerHTML = `<span style="color:#f9e2af;">Shape:</span> ${JSON.stringify(dev.get_shape())}`;

        const in_ports_row = document.createElement('div');
        in_ports_row.innerHTML = `<span style="color:#f9e2af;">Input Ports:</span> ${JSON.stringify(dev.get_port('input'))}`;

        const out_ports_row = document.createElement('div');
        out_ports_row.innerHTML = `<span style="color:#f9e2af;">Output Ports:</span> ${JSON.stringify(dev.get_port('output'))}`;

        card.appendChild(header);
        card.appendChild(pos_container);
        card.appendChild(recipe_container);
        card.appendChild(shape_row);
        card.appendChild(in_ports_row);
        card.appendChild(out_ports_row);

        if (dev.selected_recipe_id && registry)
        {
            const evaluation = evaluate_recipe(registry, dev.selected_recipe_id, dev.uid);
            if (evaluation)
            {
                const eval_card = document.createElement('div');
                eval_card.style.cssText = 'background: #11111b; border: 1px solid #313244; border-radius: 4px; padding: 6px; margin-top: 2px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;';

                const valid_color = evaluation.valid ? '#a6e3a1' : '#f38ba8';
                const status_text = evaluation.valid ? 'VALID' : 'INVALID / INCOMPATIBLE';
                eval_card.innerHTML = `
                    <div><span style="color:#cba6f7;">Evaluation:</span> <b style="color:${valid_color};">${status_text}</b></div>
                    <div><span style="color:#fab387;">Duration:</span> ${evaluation.duration}s</div>
                    <div><span style="color:#89dceb;">Inputs:</span> ${JSON.stringify(evaluation.inputs)}</div>
                    <div><span style="color:#a6e3a1;">Outputs:</span> ${JSON.stringify(evaluation.outputs)}</div>
                `.trim();

                if (evaluation.other_info && Object.keys(evaluation.other_info).length > 0)
                {
                    eval_card.innerHTML += `<div><span style="color:#f5c2e7;">Extra:</span> ${JSON.stringify(evaluation.other_info)}</div>`;
                }

                card.appendChild(eval_card);
            }
        }

        if (dev.other_info && Object.keys(dev.other_info).length > 0)
        {
            const other_row = document.createElement('div');
            other_row.innerHTML = `<span style="color:#cba6f7;">Other Info:</span> ${JSON.stringify(dev.other_info)}`;
            card.appendChild(other_row);
        }

        // Actions container (Delete Device button)
        const actions_container = document.createElement('div');
        actions_container.style.cssText = 'display: flex; gap: 8px; margin-top: 4px; border-top: 1px dashed #45475a; padding-top: 8px;';

        const delete_btn = document.createElement('button');
        delete_btn.textContent = '🗑️ Delete Device';
        delete_btn.style.cssText = `
            flex: 1;
            background: #45212e;
            border: 1px solid #f38ba8;
            border-radius: 4px;
            color: #f38ba8;
            padding: 6px 10px;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
        `.trim();

        delete_btn.addEventListener('mouseenter', () =>
        {
            delete_btn.style.background = '#612b3d';
        });
        delete_btn.addEventListener('mouseleave', () =>
        {
            delete_btn.style.background = '#45212e';
        });

        delete_btn.addEventListener('click', () =>
        {
            const current_map = get_map();
            if (current_map)
            {
                delete_device(current_map, dev.uid);
                clear_device_info();
            }
        });

        actions_container.appendChild(delete_btn);
        card.appendChild(actions_container);

        content_container.appendChild(card);
    }

    function display_device_info(uid: number): boolean
    {
        const map = get_map();
        if (!map)
        {
            content_container.innerHTML = '<div style="color:#f38ba8;">Error: Map not found</div>';
            return false;
        }

        const dev = map.devices.find(d => d.uid === uid);
        if (!dev)
        {
            content_container.innerHTML = `<div style="color:#f38ba8; background:#313244; padding:8px; border-radius:4px;">Device UID ${uid} not found.</div>`;
            return false;
        }

        render_device_details(dev);
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

    return { element, update_stats, display_device_info, clear_device_info };
}
