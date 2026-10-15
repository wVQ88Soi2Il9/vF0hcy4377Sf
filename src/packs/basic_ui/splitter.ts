export type axis = 'x' | 'y';

export interface splitter_options
{
    axis:  axis;
    min_a: number;
    min_b: number;
}

export interface splitter
{
    element: HTMLElement;
}

/**
 * 分割：總長 total 不變，a 由 start_a 移動 delta，夾在 [min_a, total - min_b]；回傳 [a, b]。
 */
export function split(total: number, start_a: number, delta: number, min_a: number, min_b: number): [number, number]
{
    if (total < min_a + min_b)
    {
        throw new Error(`Total length ${total} is less than min_a + min_b (${min_a + min_b}).`);
    }
    const a = Math.min(total - min_b, Math.max(min_a, start_a + delta));
    return [a, total - a];
}

/**
 * 在相鄰的兄弟元素 a、b 之間插入分割線；沿 axis 拖曳時 a、b 一邊變大一邊變小。
 */
export function create_splitter(a: HTMLElement, b: HTMLElement, options: splitter_options): splitter
{
    if (options.axis !== 'x' && options.axis !== 'y')
    {
        throw new Error(`Unknown axis "${options.axis}".`);
    }
    for (const [name, value] of [['min_a', options.min_a], ['min_b', options.min_b]] as const)
    {
        if (!Number.isFinite(value) || value < 0)
        {
            throw new Error(`${name} must be a non-negative finite number, got ${value}.`);
        }
    }
    if (a.parentElement === null || a.parentElement !== b.parentElement || a.nextElementSibling !== b)
    {
        throw new Error('Splitter requires a and b to be adjacent siblings, a before b.');
    }

    const element = document.createElement('div');
    element.dataset.basic_ui_splitter = options.axis;
    element.style.cursor = options.axis === 'x' ? 'ew-resize' : 'ns-resize';
    element.style.flex = '0 0 auto';
    element.style[options.axis === 'x' ? 'width' : 'height'] = '6px';
    a.after(element);

    const dimension = options.axis === 'x' ? 'width' : 'height';
    const coordinate = options.axis === 'x' ? 'clientX' : 'clientY';

    element.addEventListener('pointerdown', down =>
    {
        down.preventDefault();
        const start_a = a.getBoundingClientRect()[dimension];
        const total = start_a + b.getBoundingClientRect()[dimension];
        const doc = element.ownerDocument;

        function on_move(move: PointerEvent): void
        {
            const [next_a, next_b] = split(total, start_a, move[coordinate] - down[coordinate], options.min_a, options.min_b);
            a.style.flex = `0 0 ${next_a}px`;
            b.style.flex = `0 0 ${next_b}px`;
        }
        function on_up(): void
        {
            doc.removeEventListener('pointermove', on_move);
            doc.removeEventListener('pointerup', on_up);
        }
        doc.addEventListener('pointermove', on_move);
        doc.addEventListener('pointerup', on_up);
    });

    return { element };
}
