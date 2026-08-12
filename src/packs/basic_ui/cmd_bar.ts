import { execute_command } from './cmd_executor';

export interface cmd_bar_component
{
    element: HTMLElement;
}

/**
 * Creates the bottom Command Bar panel.
 */
export function create_cmd_bar(): cmd_bar_component
{
    const element = document.createElement('footer');
    element.id = 'cmd_bar';
    element.style.cssText = `
        position: absolute;
        left: 16px;
        bottom: 16px;
        width: calc(100% - 32px);
        max-width: 640px;
        height: 68px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #f8fafc;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        padding: 10px 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        z-index: 10;
    `.trim();

    element.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
            <div style="font-weight:700;color:#38bdf8;user-select:none;display:flex;align-items:center;gap:6px;font-size:14px;">
                <span style="color:#0ea5e9;">&gt;_</span> CMD
            </div>
            <input
                id="cmd_input"
                type="text"
                placeholder='Type command (e.g. create --"test:assembler" --"4, 4, 0") or help...'
                style="
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: #f8fafc;
                    font-family: inherit;
                    font-size: 14px;
                "
            />
            <div style="font-size:11px;color:#64748b;user-select:none;">
                <kbd style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;color:#cbd5e1;">Enter</kbd>
            </div>
        </div>
        <div id="cmd_output" style="font-size:12px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:46px;min-height:16px;"></div>
    `;

    const input_el  = element.querySelector('#cmd_input') as HTMLInputElement | null;
    const output_el = element.querySelector('#cmd_output') as HTMLElement | null;

    if (input_el)
    {
        input_el.addEventListener('keydown', (e) =>
        {
            if (e.key === 'Enter' && input_el.value.trim() !== '')
            {
                const result = execute_command(input_el.value);
                if (output_el)
                {
                    output_el.textContent = result;
                    if (result.startsWith('Error'))
                    {
                        output_el.style.color = '#f87171';
                    }
                    else
                    {
                        output_el.style.color = '#4ade80';
                    }
                }
                input_el.value = '';
            }
        });
    }

    return { element };
}


