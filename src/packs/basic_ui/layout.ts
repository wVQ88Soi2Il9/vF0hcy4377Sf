let root_element: HTMLElement | null = null;

/**
 * Gets or creates the primary UI root container.
 */
export function get_ui_root(host: HTMLElement): HTMLElement
{
    if (!root_element)
    {
        root_element = document.getElementById('ui_root');
        if (!root_element)
        {
            root_element = document.createElement('div');
            root_element.id = 'ui_root';
            root_element.className = 'basic_ui_splitter_layout';
            host.appendChild(root_element);
        }
    }
    return root_element;
}

export function create_ui_container(id?: string, class_name?: string): HTMLElement
{
    const container = document.createElement('div');
    if (id)
    {
        container.id = id;
    }
    if (class_name)
    {
        container.className = class_name;
    }
    return container;
}
