import { fill_panels } from '@/packs/panel';
import './panel_mock.css';

function create_panel(name: string, size: string): HTMLElement
{
    const element = document.createElement('section');
    element.className = `mock_panel panel_${name.toLowerCase()}`;
    element.textContent = `${name} ${size}`;
    return element;
}

const root = document.querySelector<HTMLElement>('#app');
if (!root)
{
    throw new Error('#app not found.');
}

const panel_a = create_panel('A', '30%');
const panel_b = create_panel('B', '50%');
const panel_c = create_panel('C', '20%');
const panel_d = create_panel('D', '20%');
const panel_e = create_panel('E', '80%');

const right = document.createElement('div');
right.className = 'mock_group mock_right';

const bottom = document.createElement('div');
bottom.className = 'mock_group mock_bottom';

fill_panels(bottom, [{ element: panel_d }, { element: panel_e }]);
fill_panels
(
    right,
    [{ element: panel_b }, { element: panel_c }, { element: bottom }],
    { direction: 'column' }
);
fill_panels(root, [{ element: panel_a }, { element: right }]);

document.title = 'Panel Mock';
