import { execute_command } from '@/packs/cli_tool';
import { basic_ui } from '@/packs/basic_ui';

export interface cli_bar_component
{
    element:       HTMLElement;
    is_collapsed:  () => boolean;
    set_collapsed: (collapsed: boolean) => void;
}

function handle_ui_cli_input(input: string): string
{
    return execute_command(input);
}

/**
 * Creates the bottom Command Line Interface (CLI) panel.
 * Default collapsed (36px single input line), expands to a compact 100px output log.
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
    input_el.placeholder = 'Type command (e.g. create test:assembler 4 4 0) or help...';

    const enter_badge = document.createElement('div');
    enter_badge.className = 'basic_ui_cli_kbd';
    enter_badge.innerHTML = '<kbd>Enter</kbd>';

    const toggle_btn = document.createElement('button');
    toggle_btn.type = 'button';
    toggle_btn.className = 'basic_ui_cli_toggle_btn';
    toggle_btn.title = 'Expand / Collapse CLI log (Default 100px)';
    toggle_btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>'; // ▲

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
            toggle_btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>'; // ▲ (Expand)
            toggle_btn.title = 'Expand CLI output log';
        }
        else
        {
            toggle_btn.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/></svg>'; // ▼ (Collapse)
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
            const result = handle_ui_cli_input(input_el.value);

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

            // Auto-expand CLI if collapsed so output is visible
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
