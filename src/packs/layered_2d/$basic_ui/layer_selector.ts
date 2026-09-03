import type { space } from '@/core';
import { basic_ui } from '@/packs/basic_ui';
import { basic_renderer } from '@/packs/basic_renderer';
import { layered_2d } from '../index';

/**
 * Renders the 2.5D Layer Switcher section in Info Bar.
 * Allows interactive switching across integer Z elevation levels (Z = 0, 1, 2, ...),
 * showing content in the depth window [Z, Z + 3).
 */
export function render_layer_selector_section(container: HTMLElement, map: space): void
{
    // Only show layer selector if map has 3 or more dimensions and height > 2
    if (map.dimension < 3 || map.size[2] <= 2)
    {
        return;
    }

    const max_z = map.size[2];
    const available_layers: number[] = [];
    for (let z = 0; z < max_z; z++)
    {
        available_layers.push(z);
    }

    const current_plane = basic_renderer.get_camera();
    const current_z = current_plane.slices.length > 2 ? current_plane.slices[2] : 0;

    const section_wrap = document.createElement('div');
    section_wrap.className = 'basic_ui_form_group';

    const title_row = document.createElement('div');
    title_row.className = 'basic_ui_section_title';
    title_row.textContent = 'Active Depth Window [Z, Z+3):';

    const control_row = document.createElement('div');
    control_row.className = 'basic_ui_lookup_row';

    const select = document.createElement('select');
    select.className = 'basic_ui_select';

    for (let idx = 0; idx < available_layers.length; idx++)
    {
        const z_val = available_layers[idx];
        const opt = document.createElement('option');
        opt.value = String(z_val);
        opt.textContent = `Z = ${z_val} (Depth [${z_val}, ${z_val + 3}))`;
        if (z_val === current_z)
        {
            opt.selected = true;
        }
        select.appendChild(opt);
    }

    function switch_layer(target_z: number): void
    {
        const plane = basic_renderer.get_camera();
        const slices = [...plane.slices];
        while (slices.length < 3)
        {
            slices.push(0);
        }
        slices[2] = target_z;
        basic_renderer.set_camera(plane.dim_h, plane.dim_v, slices);
        select.value = String(target_z);
    }

    select.addEventListener('change', () =>
    {
        const val = parseInt(select.value, 10);
        if (!isNaN(val))
        {
            switch_layer(val);
        }
    });

    // Quick Step Down button (▼)
    const btn_down = document.createElement('button');
    btn_down.type = 'button';
    btn_down.className = 'basic_ui_btn';
    btn_down.innerHTML = '▼';
    btn_down.title = 'Previous Level (Z - 1)';
    btn_down.addEventListener('click', () =>
    {
        const cur = parseInt(select.value, 10) || 0;
        const next_z = Math.max(0, cur - 1);
        switch_layer(next_z);
    });

    // Quick Step Up button (▲)
    const btn_up = document.createElement('button');
    btn_up.type = 'button';
    btn_up.className = 'basic_ui_btn';
    btn_up.innerHTML = '▲';
    btn_up.title = 'Next Level (Z + 1)';
    btn_up.addEventListener('click', () =>
    {
        const cur = parseInt(select.value, 10) || 0;
        const next_z = Math.min(available_layers[available_layers.length - 1], cur + 1);
        switch_layer(next_z);
    });

    control_row.appendChild(select);
    control_row.appendChild(btn_down);
    control_row.appendChild(btn_up);

    // Translucent layer toggle control (開關半透明層)
    const toggle_row = document.createElement('div');
    toggle_row.className = 'basic_ui_lookup_row';

    const checkbox_label = document.createElement('label');
    checkbox_label.className = 'basic_ui_checkbox_label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'basic_ui_checkbox';
    const current_opts = layered_2d.get_render_options();
    checkbox.checked = current_opts.show_inactive_layers !== false;

    checkbox.addEventListener('change', () =>
    {
        layered_2d.set_render_options({ show_inactive_layers: checkbox.checked });
    });

    const label_text = document.createElement('span');
    label_text.textContent = 'Translucent Layers';

    checkbox_label.appendChild(checkbox);
    checkbox_label.appendChild(label_text);
    toggle_row.appendChild(checkbox_label);

    section_wrap.appendChild(title_row);
    section_wrap.appendChild(control_row);
    section_wrap.appendChild(toggle_row);

    container.appendChild(section_wrap);
}

// Auto-register to basic_ui
basic_ui.register_panel_section('layered_2d_layer_selector', 10, render_layer_selector_section);
