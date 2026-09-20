import type { recipe } from '@/core';

export const iron_gear_recipe: recipe = {
    namespace: 'test',
    id: 'iron_gear',
    evaluate: (_device_uid) => [{
        port_uid: 1,
        item_stack: { item_id: { namespace: 'test', id: 'iron_gear' }, quantity: 1 }
    }]
};
