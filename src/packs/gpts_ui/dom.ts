export function element<K extends keyof HTMLElementTagNameMap>(tag: K, class_name = '', text = ''): HTMLElementTagNameMap[K]
{
    const node = document.createElement(tag);
    node.className = class_name;
    node.textContent = text;
    return node;
}

const button_icons = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    arrow_up: 'M6 15l6-6 6 6',
    arrow_down: 'M6 9l6 6 6-6',
    collapse: 'M15 5l-7 7 7 7',
    cut: 'M9 9l12 12M9 15L21 3M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    reset: 'M3 10a9 9 0 1 1 2 8M3 4v6h6',
    root: 'M4 5v14M19 5l-8 7 8 7M11 5l-7 7 7 7',
    previous_fork: 'M12 5l-8 7 8 7M20 5l-8 7 8 7',
    next_fork: 'M4 5l8 7-8 7M12 5l8 7-8 7',
    undo: 'M9 4l-6 6 6 6M3 10h11a7 7 0 0 1 7 7v3',
    redo: 'M15 4l6 6-6 6M21 10h-11a7 7 0 0 0-7 7v3',
    move: 'M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    pin: 'M8 3h8M9 3v7l-3 4v2h12v-2l-3-4V3M12 16v5',
    unpin: 'M3 3l18 18M8 3h8M15 3v7l3 4v2M9 9v1l-3 4v2h10M12 16v5'
};

export function button(label: string, action: () => void, icon?: keyof typeof button_icons): HTMLButtonElement
{
    const node = element('button', icon ? 'gpts_icon_button' : '', icon ? '' : label);
    node.type = 'button';
    node.title = label;
    node.setAttribute('aria-label', label);
    if (icon)
    {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const path = document.createElementNS(svg.namespaceURI, 'path');
        path.setAttribute('d', button_icons[icon]);
        svg.append(path);
        node.append(svg);
    }
    node.addEventListener('click', action);
    return node;
}

export function option(value: string, label = value): HTMLOptionElement
{
    const node = element('option', '', label);
    node.value = value;
    return node;
}

export function error_message(error: unknown): string
{
    return error instanceof Error ? error.message : String(error);
}

export function create_panel(title: string, on_change?: (collapsed: boolean) => void)
{
    const root = element('section', 'gpts_panel');
    const header = element('header');
    const body = element('div', 'gpts_body');
    let collapsed = true;
    const toggle = button(title, () => set_collapsed(!collapsed), 'collapse');
    toggle.classList.add('gpts_panel_toggle');
    const heading = element('strong', 'gpts_panel_title', title);
    header.append(toggle, heading);
    root.append(header, body);
    function set_collapsed(value: boolean): void
    {
        if (collapsed === value)
        {
            return;
        }
        collapsed = value;
        root.classList.toggle('gpts_collapsed', value);
        toggle.setAttribute('aria-expanded', String(!value));
        toggle.title = `${value ? 'Expand' : 'Collapse'} ${title}`;
        toggle.setAttribute('aria-label', toggle.title);
        on_change?.(value);
    }
    root.classList.add('gpts_collapsed');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.title = `Expand ${title}`;
    toggle.setAttribute('aria-label', toggle.title);
    return { element: root, header, body, set_collapsed, is_collapsed: () => collapsed };
}
