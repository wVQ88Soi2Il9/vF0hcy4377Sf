import './style.css';

export interface panel_options
{
    id:                 string;
    tag?:               string;
    title?:             string | HTMLElement;
    class_name?:        string;
    collapsible?:       boolean;
    default_collapsed?: boolean;
}

export interface panel_component
{
    element:         HTMLElement;
    header_element:  HTMLElement;
    title_container: HTMLElement;
    content_element: HTMLElement;
    is_collapsed:    () => boolean;
    set_collapsed:   (collapsed: boolean) => void;
}

export function create_panel(options: panel_options): panel_component
{
    const element = document.createElement(options.tag ?? 'section');
    element.id = options.id;
    element.className = 'basic_ui_panel';

    if (options.class_name)
    {
        element.classList.add(options.class_name);
    }

    const header_element = document.createElement('header');
    header_element.className = 'basic_ui_header';

    const title_container = document.createElement('div');
    title_container.className = 'basic_ui_title';

    if (typeof options.title === 'string')
    {
        const title_element = document.createElement('h3');
        title_element.textContent = options.title;
        title_container.appendChild(title_element);
    }
    else if (options.title instanceof HTMLElement)
    {
        title_container.appendChild(options.title);
    }

    header_element.appendChild(title_container);

    const content_element = document.createElement('div');
    content_element.className = 'basic_ui_content';

    element.appendChild(header_element);
    element.appendChild(content_element);

    let collapse_button: HTMLButtonElement | null = null;

    function set_collapsed(collapsed: boolean): void
    {
        element.classList.toggle('is_collapsed', collapsed);
        if (collapse_button)
        {
            collapse_button.textContent = collapsed ? '+' : '−';
        }
    }

    if (options.collapsible)
    {
        collapse_button = document.createElement('button');
        collapse_button.type = 'button';
        collapse_button.className = 'basic_ui_collapse_btn';
        collapse_button.textContent = options.default_collapsed ? '+' : '−';
        collapse_button.addEventListener('click', () =>
        {
            set_collapsed(!element.classList.contains('is_collapsed'));
        });
        header_element.appendChild(collapse_button);
    }

    set_collapsed(options.default_collapsed ?? false);

    return {
        element,
        header_element,
        title_container,
        content_element,
        is_collapsed: () => element.classList.contains('is_collapsed'),
        set_collapsed
    };
}

export const create_floating_panel = create_panel;
