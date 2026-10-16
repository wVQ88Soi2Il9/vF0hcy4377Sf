import * as core from '@/core';
import * as world from '@/world';
import * as cli from '@/packs/cli';
import * as panel from '@/packs/panel';

// 每個 world 一份：committed 時呼叫已掛上的 refresh
export interface test_ui_state
{
    listeners: (() => void)[];
}

function state_of(target_world: world.pure_world): test_ui_state
{
    return target_world.pack_state.get('test_ui') as test_ui_state;
}

export function on_committed(target_world: world.pure_world): void
{
    for (const listener of state_of(target_world).listeners)
    {
        listener();
    }
}

// 不改 space 的操作，只為了在 history 產生節點
export const mark_template: core.op_template =
{
    namespace:  'test_ui',
    id:         'mark',
    other_info: { cli: { description: 'mark [label] — 新增一個不改 space 的歷史節點' } },
    create(_target_world: world.pure_world, label?: unknown): core.rev_op
    {
        return {
            namespace:  'test_ui',
            id:         'mark',
            other_info: { label: label === undefined ? '' : String(label) },
            execute() {},
            inverse() {}
        };
    }
};

function box(): HTMLElement
{
    const el = document.createElement('div');
    el.style.height = '100%';
    el.style.boxSizing = 'border-box';
    el.style.padding = '8px';
    el.style.color = '#ddd';
    el.style.font = '13px monospace';
    return el;
}

function button(text: string, on_click: () => void): HTMLButtonElement
{
    const el = document.createElement('button');
    el.textContent = text;
    el.style.marginRight = '4px';
    el.addEventListener('click', on_click);
    return el;
}

function render_view(target_world: world.pure_world): HTMLElement
{
    const el = box();
    el.style.background = '#1e1e1e';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.textContent = `renderer 未實作 — world ${target_world.id}, space [${target_world.space.size.join(', ')}]`;
    return el;
}

function format_result(result: unknown): string
{
    if (typeof result === 'string')
    {
        return result;
    }
    if (result === undefined)
    {
        return 'ok';
    }
    const op = result as Partial<core.rev_op>;
    if (typeof op.execute === 'function')
    {
        return `submitted ${op.namespace}:${op.id}`;
    }
    return JSON.stringify(result);
}

function render_cli(target_world: world.pure_world): HTMLElement
{
    const el = box();
    el.style.background = '#181818';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';

    const output = document.createElement('div');
    output.dataset.test_ui_cli_output = '';
    output.style.flex = '1';
    output.style.overflow = 'auto';
    output.style.whiteSpace = 'pre-wrap';

    const input = document.createElement('input');
    input.dataset.test_ui_cli_input = '';
    input.placeholder = '輸入指令，例如 help';
    input.style.font = 'inherit';

    function print(text: string, color: string): void
    {
        const line = document.createElement('div');
        line.textContent = text;
        line.style.color = color;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    }

    input.addEventListener('keydown', event =>
    {
        if (event.key !== 'Enter' || input.value.trim() === '')
        {
            return;
        }
        const line = input.value;
        input.value = '';
        print(`> ${line}`, '#888');
        try
        {
            print(format_result(cli.run(target_world, line)), '#ddd');
        }
        catch (error)
        {
            print(error instanceof Error ? error.message : String(error), '#f66');
        }
    });

    el.append(output, input);
    return el;
}

function node_label(node: core.node): string
{
    if (node.operations.length === 0)
    {
        return 'root';
    }
    return node.operations
        .map(op => `${op.namespace}:${op.id}${op.other_info?.label ? ` ${op.other_info.label}` : ''}`)
        .join(', ');
}

function render_history(target_world: world.pure_world): HTMLElement
{
    const el = box();
    el.style.background = '#252526';
    el.style.overflow = 'auto';

    const bar = document.createElement('div');
    bar.style.marginBottom = '8px';
    bar.append(
        button('undo', () => target_world.undo()),
        button('redo', () => target_world.redo()),
        button('root', () => target_world.jump_to_root()),
        button('leaf', () => target_world.jump_to_leaf())
    );

    const tree = document.createElement('div');

    function draw(uid: core.uid, depth: number): void
    {
        const node = target_world.history.nodes.get(uid)!;
        const row = document.createElement('div');
        row.dataset.test_ui_history_node = uid;
        row.textContent = `${uid === target_world.history.current_history_uid ? '● ' : '○ '}${node_label(node)}`;
        row.style.paddingLeft = `${depth * 12}px`;
        row.style.cursor = 'pointer';
        row.addEventListener('click', () => target_world.jump_to(uid));
        tree.appendChild(row);
        for (const child of node.children_history_uids)
        {
            draw(child, depth + 1);
        }
    }

    function refresh(): void
    {
        tree.replaceChildren();
        draw(target_world.history.root_history_uid, 0);
    }

    state_of(target_world).listeners.push(refresh);
    refresh();
    el.append(bar, tree);
    return el;
}

export const panels: Record<string, panel.panel_declaration> =
{
    history: { render: render_history },
    view:    { render: render_view },
    cli:     { render: render_cli }
};

export const layout: panel.layout_node =
{
    kind: 'group',
    axis: 'x',
    children:
    [
        { node: { kind: 'panel', panel: { namespace: 'test_ui', id: 'history' } }, size: 260, min: 150, max: 600, collapsible: false },
        { node: { kind: 'panel', panel: { namespace: 'test_ui', id: 'view' } }, size: 800, min: 300, max: Infinity, collapsible: false },
        { node: { kind: 'panel', panel: { namespace: 'test_ui', id: 'cli' } }, size: 360, min: 200, max: 800, collapsible: false }
    ]
};
