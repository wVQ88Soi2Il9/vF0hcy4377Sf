import { execute_command } from './cmd_executor';

export interface cmd_bar_component
{
    element: HTMLElement;
}

/**
 * Creates the bottom Command Bar panel with resizable width and height.
 */
export function create_cmd_bar(): cmd_bar_component
{
    const element = document.createElement('footer');
    element.id = 'cmd_bar';
    element.style.cssText = `
        position: absolute;
        left: 16px;
        bottom: 16px;
        box-sizing: border-box;
        width: 580px;
        min-width: 320px;
        max-width: calc(100vw - 32px);
        height: 68px;
        min-height: 68px;
        max-height: calc(100vh - 32px);
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
        justify-content: flex-start;
        gap: 6px;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        z-index: 10;
        overflow: hidden;
    `.trim();

    // Top Resize Handle (Height)
    const top_resize = document.createElement('div');
    top_resize.id = 'cmd_bar_top_resize';
    top_resize.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 6px;
        cursor: ns-resize;
        user-select: none;
        z-index: 20;
        transition: background 0.2s;
    `.trim();

    let is_resizing_y = false;
    let start_y = 0;
    let start_height = 68;

    top_resize.addEventListener('mouseenter', () =>
    {
        top_resize.style.background = 'rgba(56, 189, 248, 0.3)';
    });
    top_resize.addEventListener('mouseleave', () =>
    {
        if (!is_resizing_y)
        {
            top_resize.style.background = 'transparent';
        }
    });
    top_resize.addEventListener('mousedown', (e) =>
    {
        is_resizing_y = true;
        start_y = e.clientY;
        start_height = element.offsetHeight;
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        top_resize.style.background = 'rgba(56, 189, 248, 0.5)';
        e.preventDefault();
    });

    // Right Resize Handle (Width)
    const right_resize = document.createElement('div');
    right_resize.id = 'cmd_bar_right_resize';
    right_resize.style.cssText = `
        position: absolute;
        top: 0;
        bottom: 0;
        right: 0;
        width: 6px;
        cursor: ew-resize;
        user-select: none;
        z-index: 20;
        transition: background 0.2s;
    `.trim();

    let is_resizing_x = false;
    let start_x = 0;
    let start_width = 580;

    right_resize.addEventListener('mouseenter', () =>
    {
        right_resize.style.background = 'rgba(56, 189, 248, 0.3)';
    });
    right_resize.addEventListener('mouseleave', () =>
    {
        if (!is_resizing_x)
        {
            right_resize.style.background = 'transparent';
        }
    });
    right_resize.addEventListener('mousedown', (e) =>
    {
        is_resizing_x = true;
        start_x = e.clientX;
        start_width = element.offsetWidth;
        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';
        right_resize.style.background = 'rgba(56, 189, 248, 0.5)';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) =>
    {
        if (is_resizing_y)
        {
            const dy = start_y - e.clientY;
            const max_allowed_h = Math.max(68, window.innerHeight - 32);
            const new_h = Math.max(68, Math.min(max_allowed_h, start_height + dy));
            element.style.height = `${new_h}px`;
        }
        if (is_resizing_x)
        {
            const dx = e.clientX - start_x;
            const max_allowed_w = Math.max(320, window.innerWidth - 32);
            const new_w = Math.max(320, Math.min(max_allowed_w, start_width + dx));
            element.style.width = `${new_w}px`;
        }
    });

    window.addEventListener('mouseup', () =>
    {
        if (is_resizing_y)
        {
            is_resizing_y = false;
            top_resize.style.background = 'transparent';
        }
        if (is_resizing_x)
        {
            is_resizing_x = false;
            right_resize.style.background = 'transparent';
        }
        if (!is_resizing_y && !is_resizing_x)
        {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });

    element.appendChild(top_resize);
    element.appendChild(right_resize);

    const content_wrapper = document.createElement('div');
    content_wrapper.style.cssText = 'display:flex;flex-direction:column;gap:6px;width:100%;height:100%;';
    content_wrapper.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
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
            <div id="cmd_enter_badge" style="font-size:11px;color:#64748b;user-select:none;">
                <kbd style="background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;color:#cbd5e1;">Enter</kbd>
            </div>
            <button id="cmd_collapse_btn" title="Collapse / Expand CMD bar" style="
                background: transparent;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 4px;
                color: #94a3b8;
                font-size: 12px;
                font-weight: bold;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                outline: none;
            ">−</button>
        </div>
        <div id="cmd_output" style="font-size:12px;color:#94a3b8;overflow-y:auto;white-space:pre-wrap;padding-left:46px;flex:1;min-height:16px;"></div>
    `;

    element.appendChild(content_wrapper);

    const input_el      = element.querySelector('#cmd_input') as HTMLInputElement | null;
    const output_el     = element.querySelector('#cmd_output') as HTMLElement | null;
    const enter_badge   = element.querySelector('#cmd_enter_badge') as HTMLElement | null;
    const collapse_btn  = element.querySelector('#cmd_collapse_btn') as HTMLButtonElement | null;

    let is_collapsed = false;
    let saved_expanded_w = 580;
    let saved_expanded_h = 68;

    if (collapse_btn)
    {
        collapse_btn.addEventListener('click', () =>
        {
            is_collapsed = !is_collapsed;
            if (is_collapsed)
            {
                saved_expanded_w = element.offsetWidth;
                saved_expanded_h = element.offsetHeight;
                collapse_btn.innerHTML = '+';

                if (input_el)
                {
                    input_el.style.display = 'none';
                }
                if (output_el)
                {
                    output_el.style.display = 'none';
                }
                if (enter_badge)
                {
                    enter_badge.style.display = 'none';
                }

                top_resize.style.display = 'none';
                right_resize.style.display = 'none';

                element.style.width = 'auto';
                element.style.minWidth = 'unset';
                element.style.height = 'auto';
                element.style.minHeight = 'unset';
                element.style.padding = '8px 12px';
            }
            else
            {
                collapse_btn.innerHTML = '−';

                if (input_el)
                {
                    input_el.style.display = 'block';
                }
                if (output_el)
                {
                    output_el.style.display = 'block';
                }
                if (enter_badge)
                {
                    enter_badge.style.display = 'block';
                }

                top_resize.style.display = 'block';
                right_resize.style.display = 'block';

                element.style.width = `${saved_expanded_w}px`;
                element.style.minWidth = '320px';
                element.style.height = `${saved_expanded_h}px`;
                element.style.minHeight = '68px';
                element.style.padding = '10px 16px';
            }
        });
    }

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


