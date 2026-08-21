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
    prompt_title.style.cssText = 'font-weight:700;color:#38bdf8;user-select:none;display:flex;align-items:center;gap:6px;font-size:14px;flex-shrink:0;';
    prompt_title.innerHTML = '<span style="color:#0ea5e9;">&gt;_</span> CMD';

    const input_el = document.createElement('input');
    input_el.id = 'cmd_input';
    input_el.type = 'text';
    input_el.placeholder = 'Type command (e.g. create --"test:assembler" --"4, 4, 0") or help...';
    input_el.style.cssText = `
        flex: 1;
        min-width: 0;
        background: transparent;
        border: none;
        outline: none;
        color: #f8fafc;
        font-family: inherit;
        font-size: 13px;
    `.trim();

    const enter_badge = document.createElement('div');
    enter_badge.style.cssText = 'font-size:11px;color:#64748b;user-select:none;flex-shrink:0;';
    enter_badge.innerHTML = '<kbd style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;color:#cbd5e1;">Enter</kbd>';

    panel.title_container.appendChild(prompt_title);
    panel.title_container.appendChild(input_el);
    panel.title_container.appendChild(enter_badge);

    // Body: Command output log
    const output_el = document.createElement('div');
    output_el.id = 'cmd_output';
    output_el.style.cssText = 'font-size:12px;color:#94a3b8;overflow-y:auto;white-space:pre-wrap;padding-left:46px;flex:1;min-height:16px;box-sizing:border-box;';

    panel.content_element.appendChild(output_el);

    input_el.addEventListener('keydown', (e) =>
    {
        if (e.key === 'Enter' && input_el.value.trim() !== '')
        {
            const result = execute_command(input_el.value);
            output_el.textContent = result;
            if (result.startsWith('Error'))
            {
                output_el.style.color = '#f87171';
            }
            else
            {
                output_el.style.color = '#4ade80';
            }
            input_el.value = '';
        }
    });

    return { element: panel.element };
}
