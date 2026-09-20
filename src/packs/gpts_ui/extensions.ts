import type { device, space } from '@/core';

export interface device_action
{
    label: string;
    on_click: (dev: device) => void;
    is_danger?: boolean;
}

export type device_inspector_fn = (container: HTMLElement, dev: device) => void;
export type device_creation_option_fn = (container: HTMLElement, def_id: string) => { get_other_info: () => Record<string, unknown> };
export type panel_section_fn = (container: HTMLElement, sp: space) => void;

export function create_extensions()
{
    const inspectors: { predicate: (dev: device) => boolean; render: device_inspector_fn }[] = [];
    const actions: device_action[] = [];
    const options: { predicate: (id: string) => boolean; render: device_creation_option_fn }[] = [];
    const sections = new Map<string, { id: string; priority: number; render: panel_section_fn }>();

    function remove<T>(entries: T[], entry: T): void
    {
        const index = entries.indexOf(entry);
        if (index >= 0) { entries.splice(index, 1); }
    }
    return {
        register_device_inspector(predicate: (dev: device) => boolean, render: device_inspector_fn)
        {
            const entry = { predicate, render };
            inspectors.push(entry);
            return () => remove(inspectors, entry);
        },
        unregister_device_inspector(render: device_inspector_fn)
        {
            const entry = inspectors.find(entry => entry.render === render);
            if (entry) { remove(inspectors, entry); }
        },
        get_device_inspectors: (dev: device) => inspectors.filter(entry => entry.predicate(dev)).map(entry => entry.render),
        register_device_action(action: device_action)
        {
            actions.push(action);
            return () => remove(actions, action);
        },
        unregister_device_action: (action: device_action) => remove(actions, action),
        get_device_actions: () => [...actions],
        register_device_creation_option(predicate: (id: string) => boolean, render: device_creation_option_fn)
        {
            const entry = { predicate, render };
            options.push(entry);
            return () => remove(options, entry);
        },
        unregister_device_creation_option(render: device_creation_option_fn)
        {
            const entry = options.find(entry => entry.render === render);
            if (entry) { remove(options, entry); }
        },
        get_device_creation_options: (id: string) => options.filter(entry => entry.predicate(id)).map(entry => entry.render),
        register_panel_section(id: string, priority: number, render: panel_section_fn)
        {
            const entry = { id, priority, render };
            sections.set(id, entry);
            return () =>
            {
                if (sections.get(id) === entry) { sections.delete(id); }
            };
        },
        unregister_panel_section: (id: string) => { sections.delete(id); },
        get_panel_sections: () => [...sections.values()].sort((a, b) => a.priority - b.priority),
        clear_all_extensions()
        {
            inspectors.length = actions.length = options.length = 0;
            sections.clear();
        }
    };
}

export type ui_extensions = ReturnType<typeof create_extensions>;
