import type { device, game_map } from '@/API';

export interface device_action
{
    label:      string;
    on_click:   (dev: device) => void;
    is_danger?: boolean;
}

export type device_inspector_fn = (container: HTMLElement, dev: device) => void;

export interface device_inspector_entry
{
    predicate: (dev: device) => boolean;
    render:    device_inspector_fn;
}

export type panel_section_fn = (container: HTMLElement, map: game_map) => void;

export interface panel_section_entry
{
    id:       string;
    priority: number;
    render:   panel_section_fn;
}

const registered_inspectors: device_inspector_entry[] = [];
const registered_actions:    device_action[]          = [];
const registered_sections:   panel_section_entry[]    = [];

/**
 * Registers a custom inspector slot for devices matching the predicate.
 */
export function register_device_inspector
(
    predicate: (dev: device) => boolean,
    render:    device_inspector_fn
): void
{
    registered_inspectors.push({ predicate, render });
}

/**
 * Registers a custom action button to be displayed in the device card actions row.
 */
export function register_device_action(action: device_action): void
{
    registered_actions.push(action);
}

/**
 * Registers an independent custom section inside the Info Bar panel.
 */
export function register_panel_section
(
    id:       string,
    priority: number,
    render:   panel_section_fn
): void
{
    registered_sections.push({ id, priority, render });
    registered_sections.sort((a, b) => a.priority - b.priority);
}

/**
 * Retrieves all inspectors applicable to the specified device.
 */
export function get_device_inspectors(dev: device): device_inspector_fn[]
{
    return registered_inspectors
        .filter(entry => entry.predicate(dev))
        .map(entry => entry.render);
}

/**
 * Retrieves all registered device actions.
 */
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
