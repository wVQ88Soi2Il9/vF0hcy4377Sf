import { execute_command } from './cmd_executor';
import { create_floating_panel } from './panel';

export interface cmd_bar_component
{
    element: HTMLElement;
}

/**
 * Creates the bottom Command Bar panel with an inline input header and flexible output area.
 */
export function create_cmd_bar(): cmd_bar_component
{
    const panel = create_floating_panel({
        id:             'cmd_bar',
        tag:            'footer',
        position_css:   'left: 16px; bottom: 16px;',
        default_width:  '580px',
        default_height: '68px',
        collapsible:    true,
        resize: {
            top:        true,
            right:      true,
            min_width:  320,
            max_width:  () => window.innerWidth - 32,
            min_height: 68,
            max_height: () => window.innerHeight - 32
        }
    });

    // Header: Prompt + Input + Enter badge
    const prompt_title = document.createElement('div');
    prompt_title.className = 'basic_ui_cmd_prompt';
    prompt_title.innerHTML = '<span class="basic_ui_cmd_prompt_icon">&gt;_</span> CMD';

    const input_el = document.createElement('input');
    input_el.id = 'cmd_input';
    input_el.type = 'text';
    input_el.className = 'basic_ui_cmd_input';
    input_el.placeholder = 'Type command (e.g. create --"test:assembler" --"4, 4, 0") or help...';

    const enter_badge = document.createElement('div');
    enter_badge.className = 'basic_ui_cmd_kbd';
    enter_badge.innerHTML = '<kbd>Enter</kbd>';

    panel.title_container.appendChild(prompt_title);
    panel.title_container.appendChild(input_el);
    panel.title_container.appendChild(enter_badge);

    // Body: Command output log
    const output_el = document.createElement('div');
    output_el.id = 'cmd_output';
    output_el.className = 'basic_ui_cmd_output';

    panel.content_element.appendChild(output_el);

    input_el.addEventListener('keydown', (e) =>
    {
        if (e.key === 'Enter' && input_el.value.trim() !== '')
        {
            const result = execute_command(input_el.value);
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
        }
    });

    return { element: panel.element };
}
