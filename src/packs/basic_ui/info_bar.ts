import type { device } from '@/API';
import { evaluate_recipe } from '@/API';
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
 * Creates the right-side Info Bar panel supporting interactive UID lookup via dropdown and device info display.
 */
export function create_info_bar(): info_bar_component
{
    const element = document.createElement('aside');
    element.id = 'info_bar';
    element.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        width: 300px;
        max-height: calc(100vh - 120px);
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

    // Section 1: Header / Map stats
    const stats_container = document.createElement('div');
    stats_container.style.cssText = 'border-bottom: 1px solid #45475a; padding-bottom: 8px; margin-bottom: 2px;';

    const title_el = document.createElement('h3');
    title_el.style.cssText = 'margin: 0 0 6px 0; font-size: 14px; color: #89b4fa; font-weight: bold;';
    title_el.textContent = 'Map Status';

    const map_info_el = document.createElement('div');
    map_info_el.style.cssText = 'color: #a6adc8; font-size: 12px; display: flex; justify-content: space-between;';

    stats_container.appendChild(title_el);
    stats_container.appendChild(map_info_el);

    // Section 2: Dropdown select for UID -> Get & Display Info
    const lookup_container = document.createElement('div');
    lookup_container.style.cssText = 'display: flex; gap: 6px; align-items: center;';

    const uid_select = document.createElement('select');
    uid_select.id = 'uid_select';
    uid_select.style.cssText = `
        flex: 1;
        background: #1e1e2e;
        border: 1px solid #45475a;
        border-radius: 4px;
        color: #cdd6f4;
        padding: 4px 8px;
        font-family: monospace;
        font-size: 12px;
        outline: none;
        cursor: pointer;
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
    content_container.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

    element.appendChild(stats_container);
    element.appendChild(lookup_container);
    element.appendChild(content_container);

    function update_stats(stats: info_bar_stats): void
    {
        map_info_el.innerHTML = `<span>Devices: <b>${stats.device_count}</b></span><span>Size: <b>${stats.map_dimensions}</b></span>`;
        refresh_uid_options();
    }

    function render_device_details(dev: device): void
    {
        content_container.innerHTML = '';

        const card = document.createElement('div');
        card.style.cssText = 'background: #1e1e2e; border: 1px solid #45475a; border-radius: 6px; padding: 10px; font-size: 12px; display: flex; flex-direction: column; gap: 6px;';

        const header = document.createElement('div');
        header.style.cssText = 'color: #a6e3a1; font-weight: bold; font-size: 13px; border-bottom: 1px dashed #45475a; padding-bottom: 4px;';
        header.textContent = `Device #${dev.uid}`;

        const def_row = document.createElement('div');
        def_row.innerHTML = `<span style="color:#89b4fa;">Definition:</span> ${dev.definition_id}`;

        const pos_row = document.createElement('div');
        pos_row.innerHTML = `<span style="color:#89b4fa;">Position:</span> [${dev.position.join(', ')}]`;

        const recipe_row = document.createElement('div');
        recipe_row.innerHTML = `<span style="color:#89b4fa;">Selected Recipe:</span> ${dev.selected_recipe_id ?? 'None'}`;

        const shape_row = document.createElement('div');
        shape_row.innerHTML = `<span style="color:#f9e2af;">Shape:</span> ${JSON.stringify(dev.get_shape())}`;

        const in_ports_row = document.createElement('div');
        in_ports_row.innerHTML = `<span style="color:#f9e2af;">Input Ports:</span> ${JSON.stringify(dev.get_port('input'))}`;

        const out_ports_row = document.createElement('div');
        out_ports_row.innerHTML = `<span style="color:#f9e2af;">Output Ports:</span> ${JSON.stringify(dev.get_port('output'))}`;

        card.appendChild(header);
        card.appendChild(def_row);
        card.appendChild(pos_row);
        card.appendChild(recipe_row);
        card.appendChild(shape_row);
        card.appendChild(in_ports_row);
        card.appendChild(out_ports_row);

        const registry = get_registry();
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
