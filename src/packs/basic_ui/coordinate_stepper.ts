export interface coordinate_stepper_group
{
    container:  HTMLElement;
    row:        HTMLElement;
    get_values: () => { success: true; position: number[] } | { success: false; error: string };
    show_error: (msg: string) => void;
    hide_error: () => void;
}

const axis_names = ['X', 'Y', 'Z'];

/**
 * Creates an N-dimensional coordinate stepper form group with ±2 controls and even coordinate validation.
 */
export function create_coordinate_stepper_group
(
    initial_coords: number[],
    title_text:     string = 'Position (Even Coords):'
): coordinate_stepper_group
{
    const container = document.createElement('div');
    container.className = 'basic_ui_form_group';

    const title = document.createElement('div');
    title.className = 'basic_ui_section_title';
    title.textContent = title_text;

    const row = document.createElement('div');
    row.className = 'basic_ui_pos_row';

    const inputs: HTMLInputElement[] = [];

    for (let i = 0; i < initial_coords.length; i++)
    {
        const axis = i < axis_names.length ? axis_names[i] : `D${i + 1}`;
        const wrap = document.createElement('div');
        wrap.className = 'basic_ui_pos_field';
        wrap.innerHTML = `<span class="basic_ui_pos_label">${axis}:</span><div class="basic_ui_stepper"><input type="number" step="2" value="${initial_coords[i]}" class="basic_ui_stepper_input" /><div class="basic_ui_stepper_btns"><button type="button" class="basic_ui_stepper_btn up" title="Increase by 2">▲</button><button type="button" class="basic_ui_stepper_btn down" title="Decrease by 2">▼</button></div></div>`;

        const inp = wrap.querySelector('input') as HTMLInputElement;
        const btn_up = wrap.querySelector('.up') as HTMLButtonElement;
        const btn_down = wrap.querySelector('.down') as HTMLButtonElement;

        btn_up.addEventListener('click', () =>
        {
            inp.value = String((parseInt(inp.value, 10) || 0) + 2);
        });

        btn_down.addEventListener('click', () =>
        {
            inp.value = String((parseInt(inp.value, 10) || 0) - 2);
        });

        inputs.push(inp);
        row.appendChild(wrap);
    }

    const error_el = document.createElement('div');
    error_el.className = 'basic_ui_error_msg';
    error_el.style.display = 'none';

    container.appendChild(title);
    container.appendChild(row);
    container.appendChild(error_el);

    function show_error(msg: string): void
    {
        error_el.textContent = msg;
        error_el.style.display = 'block';
    }

    function hide_error(): void
    {
        error_el.style.display = 'none';
    }

    function get_values(): { success: true; position: number[] } | { success: false; error: string }
    {
        const position: number[] = [];
        for (const inp of inputs)
        {
            const val = parseInt(inp.value.trim(), 10);
            if (isNaN(val))
            {
                return { success: false, error: 'Error: Invalid number coordinate.' };
            }
            if (Math.abs(val) % 2 !== 0)
            {
                return { success: false, error: 'Error: Coordinates must all be even numbers.' };
            }
            position.push(val);
        }
        return { success: true, position };
    }

    return {
        container,
        row,
        get_values,
        show_error,
        hide_error
    };
}
