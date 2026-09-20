import type { pack_module, pack_registry } from '@/core';
import { assembler_device } from './devices/assembler';
import { belt_device } from './devices/belt';
import { irregular_3d_device } from './devices/irregular_3d';
import { merger_device } from './devices/merger';
import { pipe_device } from './devices/pipe';
import { splitter_device } from './devices/splitter';
import { advanced_circuit_recipe } from './recipes/advanced_circuit';
import { iron_gear_recipe } from './recipes/iron_gear';

export * from './devices/assembler';
export * from './devices/belt';
export * from './devices/irregular_3d';
export * from './devices/merger';
export * from './devices/pipe';
export * from './devices/splitter';
export { advanced_circuit_recipe, iron_gear_recipe };

export const test_pack: pack_module = {
    pack_id: 'test',
    devices: {
        assembler: assembler_device,
        belt: belt_device,
        merger: merger_device,
        splitter: splitter_device,
        irregular_3d: irregular_3d_device,
        pipe: pipe_device
    },
    recipes: {
        advanced_circuit: advanced_circuit_recipe,
        iron_gear: iron_gear_recipe
    }
};

export function global_init(registry: pack_registry): void
{
    registry.set(test_pack.pack_id, test_pack);
}
