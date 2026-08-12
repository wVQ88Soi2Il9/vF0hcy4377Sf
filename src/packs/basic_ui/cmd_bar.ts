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
        right: 16px;
        bottom: 16px;
        height: 44px;
        background: rgba(15, 23, 42, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        color: #f8fafc;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        padding: 0 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        z-index: 10;
    `.trim();

    element.innerHTML = `
        <div style="font-weight:700;color:#38bdf8;user-select:none;display:flex;align-items:center;gap:6px;">
            <span style="color:#0ea5e9;">&gt;_</span> CMD
        </div>
        <input
            id="cmd_input"
            type="text"
            placeholder="Type command or press Enter..."
            style="
                flex: 1;
                background: transparent;
                border: none;
                outline: none;
                color: #f8fafc;
                font-family: inherit;
                font-size: 13px;
            "
        />
        <div style="font-size:11px;color:#64748b;user-select:none;">
            Press <kbd style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;color:#cbd5e1;">Enter</kbd> to submit
        </div>
    `;

    const input_el = element.querySelector('#cmd_input') as HTMLInputElement | null;
    if (input_el)
    {
        input_el.addEventListener('keydown', (e) =>
        {
            if (e.key === 'Enter' && input_el.value.trim() !== '')
            {
                console.log('[basic_ui] Executing command:', input_el.value);
                input_el.value = '';
            }
        });
    }

    return { element };
}
