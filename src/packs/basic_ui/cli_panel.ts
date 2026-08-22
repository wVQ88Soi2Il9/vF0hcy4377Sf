import { execute_command } from './cli_executor';
import { create_floating_panel } from './panel';

export interface cli_bar_component
{
    element: HTMLElement;
}

/**
 * Creates the bottom Command Line Interface (CLI) panel with an inline input header and flexible output area.
 */
export function create_cli_bar(): cli_bar_component
{
    const panel = create_floating_panel({
        id:             'cli_bar',
        tag:            'footer',
        position_css:   'top: 16px; left: 16px;',
        default_width:  '440px',
        default_height: '68px',
        collapsible:       true,
        default_collapsed: true,
        resize: {
            bottom:     true,
            right:      true,
            min_width:  320,
            max_width:  () => window.innerWidth - 32,
            min_height: 68,
            max_height: () => window.innerHeight - 32
        }
    });

    // Header: Prompt + Input + Enter badge
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

    panel.title_container.appendChild(prompt_title);
    panel.title_container.appendChild(input_el);
    panel.title_container.appendChild(enter_badge);

    // Body: Command output log
    const output_el = document.createElement('div');
    output_el.id = 'cli_output';
    output_el.className = 'basic_ui_cli_output';

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
