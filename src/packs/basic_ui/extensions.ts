import * as core from '@/core';

export interface device_action
{
    label:      string;
    on_click:   (dev: core.device) => void;
    is_danger?: boolean;
}

export type device_inspector_fn = (container: HTMLElement, dev: core.device) => void;

export interface device_inspector_entry
{
    predicate: (dev: core.device) => boolean;
    render:    device_inspector_fn;
}

export type device_creation_option_fn = (container: HTMLElement, def_id: string) => { get_other_info: () => Record<string, unknown> };

export interface device_creation_option_entry
{
    predicate: (def_id: string) => boolean;
    render:    device_creation_option_fn;
}

export type panel_section_fn = (container: HTMLElement, map: core.space) => void;

export interface panel_section_entry
{
    id:       string;
    priority: number;
    render:   panel_section_fn;
}

const registered_inspectors:        device_inspector_entry[]       = [];
const registered_actions:           device_action[]                 = [];
const registered_sections:          panel_section_entry[]           = [];
const registered_creation_options:  device_creation_option_entry[]  = [];

export function register_device_inspector
(
    predicate: (dev: core.device) => boolean,
    render:    device_inspector_fn
): () => void
{
    const entry: device_inspector_entry = { predicate, render };
    registered_inspectors.push(entry);
    return () =>
    {
        unregister_device_inspector(entry);
    };
}

export function unregister_device_inspector(entry: device_inspector_entry | device_inspector_fn): void
{
    const index = registered_inspectors.findIndex(e => e === entry || e.render === entry);
    if (index !== -1)
    {
        registered_inspectors.splice(index, 1);
    }
}

export function register_device_action(action: device_action): () => void
{
    registered_actions.push(action);
    return () =>
    {
        unregister_device_action(action);
    };
}

export function unregister_device_action(action: device_action): void
{
    const index = registered_actions.indexOf(action);
    if (index !== -1)
    {
        registered_actions.splice(index, 1);
    }
}

/**
 * If a section with the same ID already exists, it is replaced.
 */
export function register_panel_section
(
    id:       string,
    priority: number,
    render:   panel_section_fn
): () => void
{
    const existing_index = registered_sections.findIndex(s => s.id === id);
    if (existing_index !== -1)
    {
        registered_sections.splice(existing_index, 1);
    }

    registered_sections.push({ id, priority, render });
    registered_sections.sort((a, b) => a.priority - b.priority);

    return () =>
    {
        unregister_panel_section(id);
    };
}

export function unregister_panel_section(id: string): void
{
    const index = registered_sections.findIndex(s => s.id === id);
    if (index !== -1)
    {
        registered_sections.splice(index, 1);
    }
}

export function get_device_inspectors(dev: core.device): device_inspector_fn[]
{
    return registered_inspectors
        .filter(entry => entry.predicate(dev))
        .map(entry => entry.render);
}

export function get_device_actions(): device_action[]
{
    return registered_actions;
}

/**
 * Retrieves all registered panel sections sorted by priority.
 */
export function get_panel_sections(): panel_section_entry[]
{
    return registered_sections;
}

export function register_device_creation_option
(
    predicate: (def_id: string) => boolean,
    render:    device_creation_option_fn
): () => void
{
    const entry: device_creation_option_entry = { predicate, render };
    registered_creation_options.push(entry);
    return () =>
    {
        unregister_device_creation_option(entry);
    };
}

export function unregister_device_creation_option(entry: device_creation_option_entry | device_creation_option_fn): void
{
    const index = registered_creation_options.findIndex(e => e === entry || e.render === entry);
    if (index !== -1)
    {
        registered_creation_options.splice(index, 1);
    }
}

export function get_device_creation_options(def_id: string): device_creation_option_fn[]
{
    return registered_creation_options
        .filter(entry => entry.predicate(def_id))
        .map(entry => entry.render);
}

export function clear_all_extensions(): void
{
    registered_inspectors.length = 0;
    registered_actions.length = 0;
    registered_sections.length = 0;
    registered_creation_options.length = 0;
}
