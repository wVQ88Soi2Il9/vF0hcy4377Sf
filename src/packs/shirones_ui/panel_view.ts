export interface panel_view_options
{
    id:     string;
    tag?:   keyof HTMLElementTagNameMap;
    title?: string;
}

export interface panel_view
{
    element:         HTMLElement;
    header_element:  HTMLElement;
    title_container: HTMLElement;
    content_element: HTMLElement;
}

export function create_panel_view(options: panel_view_options): panel_view
{
    const element = document.createElement(options.tag ?? 'aside');
    element.id = options.id;
    element.className = 'basic_ui_panel';

    const header_element = document.createElement('header');
    header_element.className = 'basic_ui_header';

    const title_container = document.createElement('div');
    title_container.className = 'basic_ui_title';

    if (options.title)
    {
        const title = document.createElement('h3');
        title.textContent = options.title;
        title_container.appendChild(title);
    }

    const content_element = document.createElement('div');
    content_element.className = 'basic_ui_content';

    header_element.appendChild(title_container);
    element.append(header_element, content_element);

    return {
        element,
        header_element,
        title_container,
        content_element
    };
}
