import { record_operation, type device, type rev_op } from '@/core';
import type { pure_world } from '@/world';
import { create_device_operation, delete_device_operation, move_device_operation, select_recipe_operation, get_device_class, parse_namespaced_id, format_namespaced_id } from '@/packs/vanilla_alpha';
import { button, create_panel, element, option } from './dom';
import { create_position_input } from './position_input';
import { create_extensions, type ui_extensions } from './extensions';

function record(target_world: pure_world, operation: rev_op, payload: unknown = operation): void
{
    const node = record_operation(target_world.history, target_world.space, [operation]);
    target_world.trigger(operation, target_world, payload);
    target_world.trigger({ namespace: 'vanilla_alpha', id: 'history_record' }, target_world, node);
}

export function create_device_creator(target_world: pure_world, extensions: ui_extensions, on_created: (uid: number) => void)
{
    const root = element('section', 'gpts_card');
    const namespace = element('select');
    namespace.setAttribute('aria-label', 'Pack namespace');
    const definition = element('select');
    definition.setAttribute('aria-label', 'Device definition');
    const extra = element('div');
    const position = create_position_input(Array(target_world.space.dimension).fill(0));
    let getters: (() => Record<string, unknown>)[] = [];
    let rendered_id = '';
    const full_id = () => namespace.value && definition.value ? `${namespace.value}:${definition.value}` : '';
    function refresh_options(force = false): void
    {
        const id = full_id();
        if (id === rendered_id && !force) { return; }
        rendered_id = id;
        extra.replaceChildren();
        getters = id ? extensions.get_device_creation_options(id).map(render => render(extra, id).get_other_info) : [];
    }
    function refresh_devices(): void
    {
        const previous = definition.value;
        const ids = Object.keys(target_world.registry.get(namespace.value)?.devices ?? {}).sort();
        definition.replaceChildren(option('', 'device'), ...ids.map(id => option(id)));
        if (ids.includes(previous)) { definition.value = previous; }
        definition.disabled = !namespace.value;
        refresh_options();
    }
    function refresh_definitions(): void
    {
        const previous = namespace.value;
        const names = [...target_world.registry].filter(([, pack]) => pack.devices).map(([name]) => name).sort();
        namespace.replaceChildren(option('', 'pack'), ...names.map(name => option(name)));
        if (names.includes(previous)) { namespace.value = previous; }
        refresh_devices();
    }
    namespace.addEventListener('focus', refresh_definitions);
    namespace.addEventListener('pointerdown', refresh_definitions);
    namespace.addEventListener('change', refresh_devices);
    definition.addEventListener('change', () => refresh_options(true));
    root.append(element('h3', '', 'Create device'), namespace, definition, extra, position.element,
        button('Create', () => position.attempt(() =>
        {
            if (!full_id()) { throw new Error('Select a pack and device definition.'); }
            const id = parse_namespaced_id(full_id());
            const coords = position.read();
            const other_info = Object.assign({}, ...getters.map(get => get()));
            const operation = create_device_operation(get_device_class(target_world.registry, id), id, coords, other_info);
            const node = record_operation(target_world.history, target_world.space, [operation]);
            const dev = operation.get_device()!;
            target_world.trigger(operation, target_world, dev);
            target_world.trigger({ namespace: 'vanilla_alpha', id: 'history_record' }, target_world, node);
            on_created(dev.device_uid);
        }), 'plus'));
    refresh_definitions();
    return { element: root, refresh_definitions };
}

function device_card(target_world: pure_world, dev: device, extensions: ui_extensions, refresh: () => void): HTMLElement
{
    const card = element('section', 'gpts_card');
    const position = create_position_input(dev.position);
    const execute = (operation: rev_op) => position.attempt(() => { record(target_world, operation); refresh(); });
    card.append(element('h3', '', `Device #${dev.device_uid} · ${format_namespaced_id(dev.definition_id)}`), position.element,
        button('Move', () => position.attempt(() => { record(target_world, move_device_operation(dev.device_uid, position.read())); refresh(); }), 'move'),
        button('Delete device', () => execute(delete_device_operation(dev.device_uid)), 'trash'));
    const recipes = element('select');
    recipes.setAttribute('aria-label', 'Selected recipe');
    recipes.append(option('', '(None / Pass-through)'));
    for (const [namespace, pack] of target_world.registry)
    {
        for (const id of Object.keys(pack.recipes ?? {})) { recipes.append(option(`${namespace}:${id}`)); }
    }
    recipes.value = dev.selected_recipe_id ? format_namespaced_id(dev.selected_recipe_id) : '';
    recipes.addEventListener('change', () => execute(select_recipe_operation(dev.device_uid, recipes.value ? parse_namespaced_id(recipes.value) : undefined)));
    card.append(element('label', '', 'Recipe'), recipes);
    const ports = dev.get_port();
    card.append(element('h4', '', 'Ports'), element('pre', '', ports.length ? ports.map(port => `#${port.port_uid} ${port.direction} [${port.offset.join(', ')}]`).join('\n') : 'None'));
    if ('validate' in dev && typeof dev.validate === 'function')
    {
        card.append(element('p', '', `Evaluation: ${dev.validate() ? 'VALID' : 'INVALID'}`));
    }
    for (const [key, value] of Object.entries(dev))
    {
        if (!['device_uid', 'definition_id', 'position', 'selected_recipe_id'].includes(key))
        {
            card.append(element('pre', '', `${key}: ${JSON.stringify(value)}`));
        }
    }
    for (const render of extensions.get_device_inspectors(dev)) { render(card, dev); }
    for (const action of extensions.get_device_actions())
    {
        const control = button(action.label, () => position.attempt(() => { action.on_click(dev); refresh(); }));
        control.classList.toggle('gpts_danger', !!action.is_danger);
        card.append(control);
    }
    return card;
}

export function create_info_bar(target_world: pure_world, on_change?: (collapsed: boolean) => void, extensions = create_extensions())
{
    const panel = create_panel('Status', on_change);
    const stats = element('p');
    const badge = element('small');
    panel.header.append(badge);
    const sections = element('div');
    const selection = element('select');
    selection.setAttribute('aria-label', 'Inspect device');
    const inspector = element('div');
    let selected: number | null = null;
    const creator = create_device_creator(target_world, extensions, display_device_info);
    panel.body.append(stats, sections, creator.element, selection, inspector);
    function clear_device_info(): void
    {
        selected = null;
        selection.value = '';
        inspector.replaceChildren();
    }
    function display_device_info(uid: number): boolean
    {
        const dev = target_world.space.devices.find(dev => dev.device_uid === uid);
        if (!dev)
        {
            clear_device_info();
            inspector.append(element('p', 'gpts_error', `Device #${uid} not found.`));
            return false;
        }
        selected = uid;
        panel.set_collapsed(false);
        refresh();
        return true;
    }
    function update_stats(value: { device_count: number; map_dimensions: string }): void
    {
        stats.textContent = `Devices: ${value.device_count} · Size: ${value.map_dimensions}`;
        badge.textContent = `${value.device_count} dev`;
    }
    function refresh(): void
    {
        update_stats({ device_count: target_world.space.devices.length, map_dimensions: target_world.space.size.join(' × ') });
        creator.refresh_definitions();
        selection.replaceChildren(option('', 'Select device'), ...target_world.space.devices.map(dev =>
            option(String(dev.device_uid), `#${dev.device_uid} · ${format_namespaced_id(dev.definition_id)} @ [${dev.position.join(', ')}]`)));
        const dev = target_world.space.devices.find(dev => dev.device_uid === selected);
        if (dev)
        {
            selection.value = String(dev.device_uid);
            inspector.replaceChildren(device_card(target_world, dev, extensions, refresh));
        }
        else { clear_device_info(); }
        sections.replaceChildren();
        for (const section of extensions.get_panel_sections()) { section.render(sections, target_world.space); }
    }
    selection.addEventListener('change', () => selection.value ? display_device_info(Number(selection.value)) : clear_device_info());
    const unsubscribe = ['device_change', 'history_change'].map(id => target_world.inject_hook({ namespace: 'vanilla_alpha', id }, refresh));
    refresh();
    return { ...panel, refresh, update_stats, display_device_info, clear_device_info, destroy: () => unsubscribe.forEach(remove => remove()) };
}
