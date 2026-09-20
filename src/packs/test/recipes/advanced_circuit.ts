import type { recipe } from '@/core';

export const advanced_circuit_recipe: recipe = {
    namespace: 'test',
    id: 'advanced_circuit',
    evaluate: (_device_uid) => [{
        port_uid: 1,
        item_stack: { item_id: { namespace: 'test', id: 'advanced_circuit' }, quantity: 1 }
    }]
};
