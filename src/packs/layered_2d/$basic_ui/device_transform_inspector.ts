import type { device } from '@/API';
import { execute_command } from '@/API';
import { basic_ui } from '@/packs/basic_ui';
import { basic_renderer } from '@/packs/basic_renderer';
import {
    is_rotatable_device,
    rotate_device_command,
    flip_device_command
} from '../commands';
import type { rotatable_device } from '../types';

/**
 * Renders the D4 Transform (Rotation & Flip) control section in Device Card.
 */
export function render_d4_transform_inspector(container: HTMLElement, dev: device): void
{
    if (!is_rotatable_device(dev))
    {
        return;
    }

    const rot_dev = dev as rotatable_device;

    const wrap = document.createElement('div');
    wrap.className = 'basic_ui_form_group';

    const title_row = document.createElement('div');
    title_row.className = 'basic_ui_section_title';
    title_row.textContent = '2.5D Transform (D4):';

    // Status indicator
    const status_row = document.createElement('div');
    status_row.className = 'basic_ui_eval_row';

    const rot_step = rot_dev.transform.rotation;
    const rot_info_map: Record<number, { deg: string; rad: string }> = {
        0: { deg: '0°',   rad: '0' },
        1: { deg: '90°',  rad: 'π/2' },
        2: { deg: '180°', rad: 'π' },
        3: { deg: '270°', rad: '3π/2' }
    };
    const { deg, rad } = rot_info_map[rot_step] ?? { deg: `${rot_step * 90}°`, rad: `${rot_step * 0.5}π` };
    const flip_val_num = rot_dev.transform.flipped ? 1 : 0;

    const rot_label = document.createElement('span');
    rot_label.className = 'basic_ui_label_key';
    rot_label.textContent = 'Rotation: ';

    const rot_val = document.createElement('span');
    rot_val.style.marginRight = '12px';
    rot_val.textContent = `${deg} · ${rad} · ${rot_step}`;

    const flip_label = document.createElement('span');
    flip_label.className = 'basic_ui_label_key';
    flip_label.textContent = 'Flip: ';

    const flip_val = document.createElement('span');
    flip_val.textContent = String(flip_val_num);

    status_row.appendChild(rot_label);
    status_row.appendChild(rot_val);
    status_row.appendChild(flip_label);
    status_row.appendChild(flip_val);

    // Control buttons row (Only CCW Rotation & Flip)
    const btn_row = document.createElement('div');
    btn_row.className = 'basic_ui_lookup_row';
    btn_row.style.marginTop = '4px';

    // Rotate CCW (+90°)
    const btn_rotate_ccw = document.createElement('button');
    btn_rotate_ccw.type = 'button';
    btn_rotate_ccw.className = 'basic_ui_btn';
    btn_rotate_ccw.textContent = '↺ Rotate (CCW +90°)';
    btn_rotate_ccw.title = 'Rotate 90° counter-clockwise';
    btn_rotate_ccw.addEventListener('click', () =>
    {
        const cmd = rotate_device_command(dev.uid, 1);
        execute_command(cmd);
        basic_renderer.redraw();
        basic_ui.display_device_info(dev.uid);
    });

    // Flip (Toggle 0 / 1)
    const btn_flip = document.createElement('button');
    btn_flip.type = 'button';
    btn_flip.className = 'basic_ui_btn';
    btn_flip.textContent = '⇋ Flip X (0 ↔ 1)';
    btn_flip.title = 'Toggle flip across horizontal axis (0 / 1)';
    btn_flip.addEventListener('click', () =>
    {
        const cmd = flip_device_command(dev.uid);
        execute_command(cmd);
        basic_renderer.redraw();
        basic_ui.display_device_info(dev.uid);
    });

    btn_row.appendChild(btn_rotate_ccw);
    btn_row.appendChild(btn_flip);

    wrap.appendChild(title_row);
    wrap.appendChild(status_row);
    wrap.appendChild(btn_row);

    container.appendChild(wrap);
}

// Auto-register to basic_ui device inspector slot
basic_ui.register_device_inspector(
    (dev) => is_rotatable_device(dev),
    render_d4_transform_inspector
);
