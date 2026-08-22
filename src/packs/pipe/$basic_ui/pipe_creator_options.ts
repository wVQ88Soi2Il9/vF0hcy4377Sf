import { get_registry } from '@/runtime';
import { basic_ui } from '@/packs/basic_ui';
import { pipe, points_to_segments, type pipe_segment } from '../pipe';

/**
 * Renders a lightweight, compact Waypoints / Segments input for pipe devices.
 * Format examples:
 *   - "0,4; 1,2" (axis 0 delta 4, axis 1 delta 2)
 *   - "[0,0,0], [4,0,0], [4,2,0]" (discrete waypoints)
 */
export function render_pipe_creator_options(container: HTMLElement, _def_id: string): { get_other_info: () => Record<string, unknown> }
{
    const wrap = document.createElement('div');
    wrap.className = 'basic_ui_form_group';

    const title_row = document.createElement('div');
    title_row.className = 'basic_ui_section_title';
    title_row.textContent = 'Pipe Path (Segments / Waypoints):';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'basic_ui_input';
    input.style.width = '100%';
    input.placeholder = 'e.g. 0,4; 1,2 or [0,0,0], [4,0,0], [4,2,0]';
    input.value = '0,4; 1,2';

    wrap.appendChild(title_row);
    wrap.appendChild(input);
    container.appendChild(wrap);

    return {
        get_other_info: (): Record<string, unknown> =>
        {
            const text = input.value.trim();
            if (!text)
            {
                return { segments: [] };
            }

            // Check if user input format is JSON waypoints [[0,0,0], [4,0,0], ...]
            if (text.startsWith('['))
            {
                try
                {
                    const json_str = text.startsWith('[[') ? text : `[${text}]`;
                    const parsed = JSON.parse(json_str);
                    if (Array.isArray(parsed))
                    {
                        const segments = points_to_segments(parsed);
                        return { segments };
                    }
                }
                catch
                {
                    // Fall through to semicolon/comma parser
                }
            }

            // Parse format "axis,delta; axis,delta" (e.g. "0,4; 1,2")
            const segments: pipe_segment[] = [];
            const parts = text.split(';').map(s => s.trim()).filter(Boolean);

            for (const part of parts)
            {
                const [axis_str, delta_str] = part.split(',').map(s => s.trim());
                const axis = parseInt(axis_str, 10);
                const delta = parseInt(delta_str, 10);
                if (!isNaN(axis) && !isNaN(delta) && delta !== 0)
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
