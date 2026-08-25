import type { game_map, map_command } from '@/core';
import { delete_branch, toggle_node_pin, set_node_pin } from './history';

export function delete_branch_command(target_uid: number): map_command
{
    return {
        pack: 'vanilla',
        id:   'delete_branch',
        other_info:
        {
            vanilla:
            {
                target_uid
            }
        },
        execute(_map: game_map): void
        {
            delete_branch(Number(target_uid));
        },
        inverse(_map: game_map): void
        {
            // History branch subtree deletion
        }
    };
}

(delete_branch_command as any).other_info = {
    cli: {
        alias:    'delete-branch',
        describe: 'Delete an entire history branch rooted at target UID'
    }
};

export function pin_node_command(target_uid: number): map_command
{
    let previous_state: boolean | null = null;
    return {
        pack: 'vanilla',
        id:   'pin_node',
        other_info:
        {
            vanilla:
            {
                target_uid
            }
        },
        execute(_map: game_map): void
        {
            previous_state = toggle_node_pin(Number(target_uid));
        },
        inverse(_map: game_map): void
        {
            if (previous_state !== null)
            {
                set_node_pin(Number(target_uid), !previous_state);
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

export const vanilla_commands = {
    delete_branch: delete_branch_command,
    pin_node:      pin_node_command
};
