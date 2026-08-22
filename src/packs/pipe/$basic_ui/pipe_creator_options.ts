import { get_registry } from '@/runtime';
import { basic_ui } from '@/packs/basic_ui';
import { pipe, type pipe_segment } from '../pipe';

/**
 * Creates the interactive Pipe Shape / Segments builder inside Device Creator.
 * Allows users to add, remove, and configure segments (direction and even offset) before creating the pipe.
 */
export function render_pipe_creator_options(container: HTMLElement, _def_id: string): { get_other_info: () => Record<string, unknown> }
{
    const wrap = document.createElement('div');
    wrap.className = 'basic_ui_form_group';

    const title_row = document.createElement('div');
    title_row.className = 'basic_ui_section_title';
    title_row.textContent = 'Pipe Shape (Segments):';

    const desc = document.createElement('div');
    desc.className = 'basic_ui_label_sub';
    desc.style.marginBottom = '6px';
    desc.textContent = 'Define pipeline trajectory: [{axis, delta}, ...]';

    const segments_list = document.createElement('div');
    segments_list.style.display = 'flex';
    segments_list.style.flexDirection = 'column';
    segments_list.style.gap = '4px';

    const state_segments: { dir_select: HTMLSelectElement; offset_input: HTMLInputElement; row: HTMLElement }[] = [];

    function add_segment_row(initial_dir: number = 0, initial_offset: number = 4): void
    {
        const row = document.createElement('div');
        row.className = 'basic_ui_lookup_row';
        row.style.alignItems = 'center';

        const dir_select = document.createElement('select');
        dir_select.className = 'basic_ui_select';
        dir_select.style.flex = '1';
        dir_select.innerHTML = `
            <option value="0">D1 (+X / -X)</option>
            <option value="1">D2 (+Y / -Y)</option>
            <option value="2">D3 (+Z / -Z)</option>
        `;
        dir_select.value = String(initial_dir);

        const offset_wrap = document.createElement('div');
        offset_wrap.className = 'basic_ui_stepper';
        offset_wrap.style.flex = '1';
        offset_wrap.innerHTML = `
            <input type="number" step="2" value="${initial_offset}" class="basic_ui_stepper_input" style="width:100%;" />
            <div class="basic_ui_stepper_btns">
                <button type="button" class="basic_ui_stepper_btn up" title="+2">▲</button>
                <button type="button" class="basic_ui_stepper_btn down" title="-2">▼</button>
            </div>
        `;

        const offset_inp = offset_wrap.querySelector('input') as HTMLInputElement;
        const btn_up = offset_wrap.querySelector('.up') as HTMLButtonElement;
        const btn_down = offset_wrap.querySelector('.down') as HTMLButtonElement;

        btn_up.addEventListener('click', () =>
        {
            offset_inp.value = String((parseInt(offset_inp.value, 10) || 0) + 2);
        });

        btn_down.addEventListener('click', () =>
        {
            offset_inp.value = String((parseInt(offset_inp.value, 10) || 0) - 2);
        });

        const del_btn = document.createElement('button');
        del_btn.type = 'button';
        del_btn.className = 'basic_ui_btn_danger';
        del_btn.textContent = '✕';
        del_btn.title = 'Remove segment';
        del_btn.addEventListener('click', () =>
        {
            const idx = state_segments.findIndex(s => s.row === row);
            if (idx !== -1)
            {
                state_segments.splice(idx, 1);
            }
            row.remove();
        });

        row.appendChild(dir_select);
        row.appendChild(offset_wrap);
        row.appendChild(del_btn);

        segments_list.appendChild(row);
        state_segments.push({ dir_select, offset_input: offset_inp, row });
    }

    // Default initial segment: D1 (X) offset 4
    add_segment_row(0, 4);

    const btn_add_row = document.createElement('div');
    btn_add_row.style.marginTop = '6px';

    const add_btn = document.createElement('button');
    add_btn.type = 'button';
    add_btn.className = 'basic_ui_btn';
    add_btn.textContent = '➕ Add Segment';
    add_btn.addEventListener('click', () =>
    {
        // Suggest next orthogonal direction
        const last = state_segments[state_segments.length - 1];
        const next_dir = last ? (parseInt(last.dir_select.value, 10) === 0 ? 1 : 0) : 0;
        add_segment_row(next_dir, 2);
    });

    btn_add_row.appendChild(add_btn);

    wrap.appendChild(title_row);
    wrap.appendChild(desc);
    wrap.appendChild(segments_list);
    wrap.appendChild(btn_add_row);

    container.appendChild(wrap);

    return {
        get_other_info: (): Record<string, unknown> =>
        {
            const segments: pipe_segment[] = [];
            for (const s of state_segments)
            {
                const axis = parseInt(s.dir_select.value, 10) || 0;
                const delta = parseInt(s.offset_input.value, 10) || 0;
                if (delta !== 0)
                {
                    segments.push({ axis, delta });
                }
            }
            return { segments };
        }
    };
}

/**
 * Checks if a device definition inherits from abstract class pipe.
 */
export function is_pipe_definition(def_id: string): boolean
{
    const registry = get_registry();
    if (!registry)
    {
        return false;
    }
    const cls = registry.device_classes.get(def_id);
    if (!cls)
    {
        return false;
    }
    return cls.prototype instanceof pipe || (cls as any) === pipe;
}

// Auto-register to basic_ui device creator options
basic_ui.register_device_creation_option(
    (def_id: string) => is_pipe_definition(def_id),
    render_pipe_creator_options
);
