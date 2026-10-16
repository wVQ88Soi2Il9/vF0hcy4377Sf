import * as world from '@/world';
import * as basic_ui from '@/packs/basic_ui';

const collapsible_names = ['explorer', 'log', 'inspector'];

function block(title: string, color: string): HTMLElement
{
    const el = document.createElement('div');
    el.style.height = '100%';
    el.style.overflow = 'auto';
    el.style.boxSizing = 'border-box';
    el.style.padding = '8px';
    el.style.background = color;
    el.style.color = '#ddd';
    el.style.font = '13px sans-serif';
    const heading = document.createElement('strong');
    heading.textContent = title;
    el.appendChild(heading);
    return el;
}

/**
 * 中央的世界區塊：顯示 world id，並放收合 / 展開按鈕（由 wire_controls 接上）。
 */
function render_world(target_world: world.pure_world): HTMLElement
{
    const el = block(`world: ${target_world.id}`, '#1e1e1e');
    const bar = document.createElement('div');
    bar.style.marginTop = '8px';
    for (const name of collapsible_names)
    {
        const button = document.createElement('button');
        button.dataset.basic_ui_demo_toggle = name;
        button.textContent = `toggle ${name}`;
        button.style.marginRight = '6px';
        bar.appendChild(button);
    }
    el.appendChild(bar);
    return el;
}

function render_log(): HTMLElement
{
    const el = block('log', '#181818');
    for (let i = 1; i <= 40; i++)
    {
        const line = document.createElement('div');
        line.textContent = `line ${i}`;
        el.appendChild(line);
    }
    return el;
}

export const panels: Record<string, basic_ui.panel_declaration> =
{
    explorer:  { render: () => block('explorer', '#252526') },
    world:     { render: render_world },
    log:       { render: render_log },
    inspector: { render: () => block('inspector', '#252526') }
};

/**
 * 示範版面：左 explorer、中間上下切成 world / log、右 inspector；三個側邊區塊可收合。
 * explorer 與 inspector 的上限示範 CSS 長度（vw、max()）。
 */
export const layout: basic_ui.layout_node =
{
    kind: 'group',
    axis: 'x',
    children:
    [
        { node: { kind: 'panel', panel: { namespace: 'basic_ui_demo', id: 'explorer' } }, size: 220, min: 120, max: '40vw', collapsible: true, collapsed_size: 0 },
        {
            node:
            {
                kind: 'group',
                axis: 'y',
                children:
                [
                    { node: { kind: 'panel', panel: { namespace: 'basic_ui_demo', id: 'world' } }, size: 500, min: 200, max: Infinity, collapsible: false },
                    { node: { kind: 'panel', panel: { namespace: 'basic_ui_demo', id: 'log' } }, size: 180, min: 80, max: 400, collapsible: true, collapsed_size: 0 }
                ]
            },
            size: 800, min: 300, max: Infinity, collapsible: false
        },
        { node: { kind: 'panel', panel: { namespace: 'basic_ui_demo', id: 'inspector' } }, size: 240, min: 150, max: 'max(25vw, 300px)', collapsible: true, collapsed_size: 0 }
    ]
};

/**
 * 把 world 區塊裡的按鈕接到對應 panel 的 collapse / expand。
 */
export function wire_controls(root: basic_ui.ui_root): void
{
    const mine = root.panels.get('basic_ui_demo')!;
    const world_content = mine.get('world')!.content;
    for (const name of collapsible_names)
    {
        const handle = mine.get(name)!;
        const button = world_content.querySelector(`[data-basic_ui_demo_toggle="${name}"]`)!;
        button.addEventListener('click', () => (handle.is_collapsed() ? handle.expand() : handle.collapse()));
    }
}
