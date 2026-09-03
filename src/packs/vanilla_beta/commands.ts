import * as core from '@/core';
import { delete_branch, toggle_node_pin, set_node_pin } from './history';
import { inspect_device_text } from './device_inspector';

export function delete_branch_command(target_uid: number, tree?: core.tree): core.reversible_operation
{
    return {
        namespace: 'vanilla',
        id:   'delete_branch',
        other_info:
        {
            vanilla:
            {
                target_uid
            }
        },
        execute(_map: core.space): void
        {
            if (tree)
            {
                delete_branch(tree, Number(target_uid));
            }
        },
        inverse(_map: core.space): void
        {
        }
    };
}

(delete_branch_command as any).other_info = {
    cli: {
        alias:    'delete-branch',
        describe: 'Delete an entire history branch rooted at target UID'
    }
};

export function pin_node_command(target_uid: number, tree?: core.tree): core.reversible_operation
{
    let previous_state: boolean | null = null;
    return {
        namespace: 'vanilla',
        id:   'pin_node',
        other_info:
        {
            vanilla:
            {
                target_uid
            }
        },
        execute(_map: core.space): void
        {
            if (tree)
            {
                previous_state = toggle_node_pin(tree, Number(target_uid));
            }
        },
        inverse(_map: core.space): void
        {
            if (tree && previous_state !== null)
            {
                set_node_pin(tree, Number(target_uid), !previous_state);
            }
        }
    };
}

(pin_node_command as any).other_info = {
    cli: {
        alias:    'pin',
        describe: 'Toggle pin on a history node'
    }
};

export function info_device_command(device_uid: number): core.reversible_operation
{
    let result_text = '';
    const cmd: core.reversible_operation = {
        namespace: 'vanilla',
        id:   'info_device',
        other_info:
        {
            vanilla:
            {
                device_uid
            }
        },
        execute(map: core.space): void
        {
            result_text = inspect_device_text(map, Number(device_uid));
            (cmd as any).result_text = result_text;
        },
        inverse(_map: core.space): void
        {
        }
    };
    return cmd;
}

(info_device_command as any).other_info = {
    cli: {
        alias:    'info',
        describe: 'Display detailed device specifications and status'
    }
};

export const vanilla_commands = {
    delete_branch: delete_branch_command,
    pin_node:      pin_node_command,
    info_device:   info_device_command
};
