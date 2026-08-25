import type { map_command } from '@/core';
import { delete_branch, toggle_node_pin } from './history';

export function delete_branch_command(target_uid: number): map_command
{
    return {
        pack: 'vanilla',
        id:   'delete_branch',
        other_info:
        {
            vanilla: { target_uid }
        },
        execute(): void
        {
            delete_branch(Number(target_uid));
        },
        inverse(): void
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

export function pin_node_command(target: string | number): map_command
{
    return {
        pack: 'vanilla',
        id:   'pin_node',
        other_info:
        {
            vanilla: { target }
        },
        execute(): void
        {
            if (typeof target === 'string' && target.toLowerCase() === 'list')
            {
                return;
            }
            const uid = typeof target === 'number' ? target : parseInt(target, 10);
            if (!isNaN(uid))
            {
                toggle_node_pin(uid);
            }
        },
        inverse(): void
        {
            if (typeof target !== 'string' || target.toLowerCase() !== 'list')
            {
                const uid = typeof target === 'number' ? target : parseInt(target, 10);
                if (!isNaN(uid))
                {
                    toggle_node_pin(uid);
                }
            }
        }
    };
}

(pin_node_command as any).other_info = {
    cli: {
        alias:    'pin',
        describe: 'Toggle pin on history node or list pinned nodes'
    }
};

export const vanilla_commands = {
    delete_branch: delete_branch_command,
    pin_node:      pin_node_command
};
