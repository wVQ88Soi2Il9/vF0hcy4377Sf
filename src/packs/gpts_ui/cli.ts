import * as world from '@/world';
import * as cli from '@/packs/cli';
import { button, create_panel, element, error_message } from './dom';

export function create_cli_bar(target_world: world.pure_world, on_change?: (collapsed: boolean) => void)
{
    const panel = create_panel('CLI', on_change);
    panel.element.classList.add('gpts_cli');
    const input = element('input');
    input.placeholder = 'Command or --help';
    input.setAttribute('aria-label', 'CLI command');
    const output = element('pre');
    output.setAttribute('aria-live', 'polite');
    panel.header.append(input);
    panel.body.append(output);
    input.addEventListener('keydown', event =>
    {
        if (event.key !== 'Enter' || !input.value.trim()) { return; }
        try
        {
            const result = cli.exe(input.value, target_world);
            output.textContent = result === undefined ? '' : String(result);
            output.className = /^(Error|Unknown)/.test(output.textContent) ? 'gpts_error' : 'gpts_success';
        }
        catch (cause)
        {
            output.textContent = error_message(cause);
            output.className = 'gpts_error';
        }
        input.value = '';
        panel.set_collapsed(false);
    });
    return panel;
}

export function create_viewport_panel()
{
    const panel = create_panel('Viewport');
    panel.set_collapsed(false);
    panel.element.classList.add('gpts_viewport');
    const badge = element('output');
    let zoom = 40;
    function update_zoom_ui(value: number): void
    {
        if (!Number.isFinite(value) || value <= 0) { throw new Error('Zoom must be positive and finite.'); }
        zoom = value;
        badge.textContent = `${Math.round(zoom / 40 * 100)}%`;
    }
    const change = (factor: number) => update_zoom_ui(Math.max(10, Math.min(200, Math.round(zoom * factor))));
    panel.header.replaceChildren(element('strong', '', 'Viewport'), button('Zoom out', () => change(0.8), 'minus'), badge,
        button('Zoom in', () => change(1.25), 'plus'), button('Reset zoom', () => update_zoom_ui(40), 'reset'));
    update_zoom_ui(40);
    return { panel, content_element: panel.body, update_zoom_ui };
}
