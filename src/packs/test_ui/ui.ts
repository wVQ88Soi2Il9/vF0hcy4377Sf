import * as core from '@/core';
import * as world from '@/world';
import * as cli from '@/packs/cli';
import * as panel from '@/packs/panel';
import * as camera from '@/packs/camera';
import * as basic_renderer from '@/packs/basic_renderer';

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

const VIEW_CELL_PX = 16;
// 新切片軸的起始位置：第一層格中心
const NEW_SLICE_POS = 1;

// 初始視角：畫面取第 0、1 軸，其餘軸切在第一層格中心
function default_view(target: core.space): camera.camera_view
{
    const slice: Record<number, number> = {};
    for (let axis = 2; axis < target.dimension; axis++)
    {
        slice[axis] = NEW_SLICE_POS;
    }
    return { axes: [0, 1], slice };
}

// 換畫面軸：選到另一軸時兩軸互換；保留仍是切片軸的位置，新切片軸從第一層開始
function with_axis(target: core.space, view: camera.camera_view, index: 0 | 1, axis: number): camera.camera_view
{
    const axes: [number, number] = [...view.axes];
    if (axes[1 - index] === axis)
    {
        axes[1 - index] = axes[index];
    }
    axes[index] = axis;
    const slice: Record<number, number> = {};
    for (let a = 0; a < target.dimension; a++)
    {
        if (a !== axes[0] && a !== axes[1])
        {
            slice[a] = a in view.slice ? view.slice[a] : NEW_SLICE_POS;
        }
    }
    return { axes, slice };
}

// 示範裝置的顏色：畫面軸（不分順序）決定色相，切片在各軸的相對位置平均決定明暗
export function view_color(target: core.space, view: camera.camera_view): string
{
    const [lo, hi] = [...view.axes].sort((a, b) => a - b);
    let pair_index = 0;
    let pair_count = 0;
    for (let i = 0; i < target.dimension; i++)
    {
        for (let j = i + 1; j < target.dimension; j++)
        {
            if (i === lo && j === hi)
            {
                pair_index = pair_count;
            }
            pair_count++;
        }
    }
    const hue = Math.round(360 * pair_index / pair_count);

    const slice_axes = Object.keys(view.slice).map(Number);
    const depth = slice_axes.length === 0
        ? 0.5
        : slice_axes.reduce((sum, axis) => sum + view.slice[axis] / target.size[axis], 0) / slice_axes.length;
    const lightness = Math.round(75 - 45 * depth);
    return `hsl(${hue}, 70%, ${lightness}%)`;
}

// 裁切：剪掉空間範圍外的格子，全被剪掉的裝置不畫
function clip(projection: basic_renderer.projection): basic_renderer.projection
{
    const [width, height] = projection.size;
    const devices: basic_renderer.projected_device[] = [];
    for (const item of projection.devices)
    {
        const cells = item.cells.filter(([x, y]) => x >= 0 && y >= 0 && x + 2 <= width && y + 2 <= height);
        if (cells.length > 0)
        {
            devices.push({ device: item.device, cells });
        }
    }
    return { size: projection.size, view: projection.view, devices };
}

function select(options: number[], value: number, on_change: (value: number) => void): HTMLSelectElement
{
    const el = document.createElement('select');
    el.style.font = 'inherit';
    el.style.marginRight = '8px';
    for (const option of options)
    {
        const item = document.createElement('option');
        item.value = String(option);
        item.textContent = `d${option}`;
        el.appendChild(item);
    }
    el.value = String(value);
    el.addEventListener('change', () => on_change(Number(el.value)));
    return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
// 滾輪每單位 deltaY 的縮放指數
const WHEEL_ZOOM_RATE = 0.0015;
// 格線間距小於此 px 時不畫，避免縮小時線太密
const GRID_MIN_PX = 6;

// 畫面看到的範圍內每一格的格線（render 單位）；線寬不隨縮放改變
function draw_grid(grid: SVGGElement, box: number[], cell_px: number, scale_px: number): void
{
    grid.replaceChildren();
    if (cell_px * scale_px < GRID_MIN_PX)
    {
        return;
    }
    const [x, y, w, h] = box;
    function line(x1: number, y1: number, x2: number, y2: number): void
    {
        const el = document.createElementNS(SVG_NS, 'line');
        el.setAttribute('x1', String(x1));
        el.setAttribute('y1', String(y1));
        el.setAttribute('x2', String(x2));
        el.setAttribute('y2', String(y2));
        el.setAttribute('vector-effect', 'non-scaling-stroke');
        grid.appendChild(el);
    }
    for (let gx = Math.ceil(x / cell_px) * cell_px; gx <= x + w; gx += cell_px)
    {
        line(gx, y, gx, y + h);
    }
    for (let gy = Math.ceil(y / cell_px) * cell_px; gy <= y + h; gy += cell_px)
    {
        line(x, gy, x + w, gy);
    }
}

function render_view(target_world: world.pure_world): HTMLElement
{
    const el = box();
    el.style.background = '#1e1e1e';
    el.style.overflow = 'hidden';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';

    const controls = document.createElement('div');
    controls.style.marginBottom = '8px';
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.dataset.test_ui_view = '';
    svg.style.display = 'block';
    svg.style.flex = '1';
    svg.style.minHeight = '0';
    svg.style.width = '100%';
    svg.style.cursor = 'grab';
    el.append(controls, svg);

    const grid = document.createElementNS(SVG_NS, 'g');
    grid.dataset.test_ui_grid = '';
    grid.setAttribute('stroke', '#444');
    grid.setAttribute('stroke-width', '1');

    // 平移/縮放在第一次量到畫面大小時才 fit；之前沒有 viewBox
    let cam: camera.camera_state = { view: default_view(target_world.space), origin: [0, 0], scale: 1 };
    let fitted = false;

    function px_size(): [number, number] | undefined
    {
        const width = svg.clientWidth;
        const height = svg.clientHeight;
        return width > 0 && height > 0 ? [width, height] : undefined;
    }

    function update_view_box(): void
    {
        const size = px_size();
        if (size === undefined)
        {
            return;
        }
        if (!fitted)
        {
            cam = camera.fit(cam, target_world.space, size);
            fitted = true;
        }
        const k = VIEW_CELL_PX / 2;
        const box = camera.window_of(cam, size).map(n => n * k);
        svg.setAttribute('viewBox', box.join(' '));
        // render 單位 → px 的倍率 = 空間單位 → px 的倍率 / k
        draw_grid(grid, box, VIEW_CELL_PX, cam.scale / k);
    }

    function set_cam(next: camera.camera_state): void
    {
        cam = next;
        update_view_box();
    }

    // 不合法的視角（例如切片超出範圍）不採用，畫面還原後照樣 throw
    function set_view(next: camera.camera_view): void
    {
        const prev = cam.view;
        cam = { ...cam, view: next };
        try
        {
            refresh();
        }
        catch (error)
        {
            cam = { ...cam, view: prev };
            refresh();
            throw error;
        }
    }

    function draw_controls(): void
    {
        const target = target_world.space;
        const view = cam.view;
        const all_axes = [...Array(target.dimension).keys()];
        const h = select(all_axes, view.axes[0], axis => set_view(with_axis(target, cam.view, 0, axis)));
        const v = select(all_axes, view.axes[1], axis => set_view(with_axis(target, cam.view, 1, axis)));
        h.dataset.test_ui_view_axis = '0';
        v.dataset.test_ui_view_axis = '1';
        const whole = button('全景', () =>
        {
            const size = px_size();
            if (size !== undefined)
            {
                set_cam(camera.fit(cam, target, size));
            }
        });
        whole.dataset.test_ui_view_fit = '';
        controls.replaceChildren(whole, '橫 ', h, '直 ', v);

        for (const axis of Object.keys(view.slice).map(Number))
        {
            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.max = String(target.size[axis]);
            input.step = '1';
            input.value = String(view.slice[axis]);
            input.style.width = '4em';
            input.style.font = 'inherit';
            input.style.marginRight = '8px';
            input.dataset.test_ui_view_slice = String(axis);
            input.addEventListener('change', () =>
                set_view({ axes: cam.view.axes, slice: { ...cam.view.slice, [axis]: Number(input.value) } }));
            controls.append(`d${axis}=`, input);
        }
    }

    function refresh(): void
    {
        draw_controls();
        const target = target_world.space;
        const projection = clip(camera.project(target, cam.view));
        const layer = basic_renderer.render(projection, VIEW_CELL_PX);
        // 空間範圍以底色標出；外面是無限畫布
        const extent = document.createElementNS(SVG_NS, 'rect');
        extent.setAttribute('width', String(projection.size[0] / 2 * VIEW_CELL_PX));
        extent.setAttribute('height', String(projection.size[1] / 2 * VIEW_CELL_PX));
        extent.setAttribute('fill', '#111');
        svg.style.setProperty('--test_ui_device_fill', view_color(target, cam.view));
        layer.dataset.test_ui_layer = '';
        svg.replaceChildren(extent, grid, layer);
        update_view_box();
    }

    svg.addEventListener('wheel', event =>
    {
        event.preventDefault();
        const rect = svg.getBoundingClientRect();
        set_cam(camera.zoom_at(cam, Math.exp(-event.deltaY * WHEEL_ZOOM_RATE),
            [event.clientX - rect.left, event.clientY - rect.top]));
    }, { passive: false });

    svg.addEventListener('mousedown', down =>
    {
        let last: [number, number] = [down.clientX, down.clientY];
        svg.style.cursor = 'grabbing';
        function move(event: MouseEvent): void
        {
            set_cam(camera.pan(cam, event.clientX - last[0], event.clientY - last[1]));
            last = [event.clientX, event.clientY];
        }
        function up(): void
        {
            svg.style.cursor = 'grab';
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
        }
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
    });

    new ResizeObserver(update_view_box).observe(svg);
    state_of(target_world).listeners.push(refresh);
    refresh();
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
