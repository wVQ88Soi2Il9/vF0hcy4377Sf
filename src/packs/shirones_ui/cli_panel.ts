import { execute_command, tokenize_input } from '@/packs/cli_tool';
import { basic_ui } from '@/packs/basic_ui';
import { basic_renderer } from '@/packs/basic_renderer';
import { clean_flag_arg } from '@/packs/cli_tool';
import { parse_axis_name, format_axis_name, get_right_oriented_axes } from '@/packs/vanilla';
import { get_map } from '@/runtime';

export interface cli_bar_component
{
    element:       HTMLElement;
    is_collapsed:  () => boolean;
    set_collapsed: (collapsed: boolean) => void;
}

/**
 * Translates Core command aliases and UI-specific commands.
 */
function handle_ui_and_core_aliases(input: string): string | null
{
    const tokens = tokenize_input(input.trim());
    if (tokens.length === 0) return '';
    const cmd = tokens[0].toLowerCase();
    const args = tokens.slice(1);

    // UI-specific: info
    if (cmd === 'info')
    {
        if (args.length < 1)
        {
            return 'Usage: info --"<uid>" (e.g. info --"1")';
        }
        const id = parseInt(clean_flag_arg(args[0]), 10);
        if (isNaN(id))
        {
            return 'Error: Invalid device UID. Must be a number (e.g. info --"1").';
        }
        const success = basic_ui.display_device_info(id);
        return success ? `Displayed info for device UID ${id}` : `Error: Device ID ${id} not found.`;
    }

    // UI-specific: camera
    if (cmd === 'camera')
    {
        const map = get_map();
        if (!map) return 'Error: Global map instance not found.';
        const current = basic_renderer.get_camera();
        if (args.length === 0)
        {
            const num_dims = map.dimension;
            const eq_parts: string[] = [];
            for (let i = 0; i < num_dims; i++)
            {
                if (i !== current.dim_h && i !== current.dim_v)
                {
                    eq_parts.push(`${format_axis_name(i)}=${current.slices[i]}`);
                }
            }
            return `camera --"${eq_parts.join(', ')}"`;
        }

        const clean = clean_flag_arg(args.join(' '));
        const fixed_map = new Map<number, number>();
        for (const part of clean.split(',').map(s => s.trim()).filter(s => s.length > 0))
        {
            const kv = part.split('=');
            if (kv.length === 2)
            {
                const axis_idx = parse_axis_name(kv[0]);
                const depth_val = parseInt(kv[1].trim(), 10);
                if (axis_idx !== null && !isNaN(depth_val))
                {
                    fixed_map.set(axis_idx, depth_val);
                }
            }
        }

        if (fixed_map.size === 0)
        {
            return 'Error: Invalid camera format. Usage: camera --"d3=0"';
        }

        const num_dims = map.dimension;
        const fixed_axes_set = new Set(fixed_map.keys());
        const free_dim_count = num_dims - fixed_axes_set.size;
        if (free_dim_count !== 2)
        {
            return `Error: Camera requires exactly 2 free dimensions (currently ${free_dim_count}). Expected ${num_dims - 2} fixed axes.`;
        }

        const axes = get_right_oriented_axes(num_dims, fixed_axes_set);
        if (!axes)
        {
            return 'Error: Unable to resolve 2D view plane.';
        }

        const new_slices = [...current.slices];
        fixed_map.forEach((depth, axis_idx) =>
        {
            if (axis_idx < num_dims)
            {
                new_slices[axis_idx] = depth;
            }
        });

        basic_renderer.set_camera(axes.dim_h, axes.dim_v, new_slices);
        return 'Updated camera view plane.';
    }

    // Core Aliases
    if (cmd === 'create')
    {
        return execute_command(`core:create_device ${args.join(' ')}`);
    }
    if (cmd === 'move')
    {
        return execute_command(`core:move_device ${args.join(' ')}`);
    }
    if (cmd === 'delete')
    {
        return execute_command(`core:delete_device ${args.join(' ')}`);
    }

    return null;
}

/**
 * Creates the bottom Command Line Interface (CLI) panel.
 */
export function create_cli_bar(on_collapse_change?: (collapsed: boolean) => void): cli_bar_component
{
    const panel = basic_ui.create_floating_panel({
        id:          'cli_bar',
        tag:         'footer',
        collapsible: false
    });

    const root_element = panel.element;
    root_element.classList.add('basic_ui_cli_panel_root');
    root_element.classList.add('is_cli_collapsed');

    // Header: Prompt + Input + Enter badge + Collapse/Expand Toggle
    const prompt_title = document.createElement('div');
    prompt_title.className = 'basic_ui_cli_prompt';
    prompt_title.innerHTML = '<span class="basic_ui_cli_prompt_icon">&gt;_</span> CLI';

    const input_el = document.createElement('input');
    input_el.id = 'cli_input';
    input_el.type = 'text';
    input_el.className = 'basic_ui_cli_input';
    input_el.placeholder = 'Type command (e.g. create --"test:assembler" --"4, 4, 0") or help...';

    const enter_badge = document.createElement('div');
    enter_badge.className = 'basic_ui_cli_kbd';
    enter_badge.innerHTML = '<kbd>Enter</kbd>';

    const toggle_btn = document.createElement('button');
    toggle_btn.type = 'button';
    toggle_btn.className = 'basic_ui_cli_toggle_btn';
    toggle_btn.title = 'Expand / Collapse CLI log (Default 100px)';
    toggle_btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';

    panel.title_container.appendChild(prompt_title);
    panel.title_container.appendChild(input_el);
    panel.title_container.appendChild(enter_badge);
    panel.title_container.appendChild(toggle_btn);

    // Body: Command output log
    const output_el = document.createElement('div');
    output_el.id = 'cli_output';
    output_el.className = 'basic_ui_cli_output';

    panel.content_element.appendChild(output_el);

    let is_currently_collapsed = true;

    function set_collapsed(collapsed: boolean): void
    {
        is_currently_collapsed = collapsed;
        root_element.classList.toggle('is_cli_collapsed', collapsed);
        if (collapsed)
        {
            toggle_btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>';
            toggle_btn.title = 'Expand CLI output log';
        }
        else
        {
            toggle_btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>';
            toggle_btn.title = 'Collapse CLI output log';
        }

        if (on_collapse_change)
        {
            on_collapse_change(collapsed);
        }
    }

    toggle_btn.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        set_collapsed(!is_currently_collapsed);
    });

    input_el.addEventListener('keydown', (e) =>
    {
        if (e.key === 'Enter' && input_el.value.trim() !== '')
        {
            const raw_val = input_el.value;
            const ui_res = handle_ui_and_core_aliases(raw_val);
            const result = ui_res !== null ? ui_res : execute_command(raw_val);

            output_el.textContent = result;
            output_el.classList.remove('success', 'error');
            if (result.startsWith('Error') || result.startsWith('Unknown'))
            {
                output_el.classList.add('error');
            }
            else
            {
                output_el.classList.add('success');
            }
            input_el.value = '';

            if (is_currently_collapsed)
            {
                set_collapsed(false);
            }
        }
    });

    return {
        element:       panel.element,
        is_collapsed:  () => is_currently_collapsed,
        set_collapsed
    };
}
