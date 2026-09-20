import { button, element, error_message } from './dom';

export interface position_input
{
    element: HTMLElement;
    read(): number[];
    attempt(action: () => void): void;
}

export function create_position_input(initial: number[]): position_input
{
    const root = element('div', 'gpts_position_input');
    const error = element('p', 'gpts_error');
    error.setAttribute('role', 'alert');

    function read_coordinate(input: HTMLInputElement): number
    {
        const value = Number(input.value);
        if (!input.value.trim() || !Number.isSafeInteger(value) || value % 2 !== 0)
        {
            throw new Error('Coordinates must be finite, safe even integers.');
        }
        return value;
    }

    function attempt(action: () => void): void
    {
        error.textContent = '';
        try { action(); }
        catch (cause) { error.textContent = error_message(cause); }
    }

    const inputs = initial.map((value, index) =>
    {
        const field = element('div', 'gpts_position_field');
        const input = element('input');
        const controls = element('div', 'gpts_position_steps');
        const coordinate = index + 1;

        input.type = 'number';
        input.step = '2';
        input.value = String(value);
        input.setAttribute('aria-label', `Position coordinate ${coordinate}`);

        function step(delta: number): void
        {
            input.value = String(read_coordinate(input) + delta);
        }

        controls.append(
            button(`Increase coordinate ${coordinate} by 2`, () => attempt(() => step(2)), 'arrow_up'),
            button(`Decrease coordinate ${coordinate} by 2`, () => attempt(() => step(-2)), 'arrow_down')
        );
        field.append(input, controls);
        root.append(field);
        return input;
    });

    root.append(error);
    return {
        element: root,
        read: () => inputs.map(read_coordinate),
        attempt
    };
}
