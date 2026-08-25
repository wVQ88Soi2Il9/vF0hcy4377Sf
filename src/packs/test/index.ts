/**
 * Test Pack index entry.
 * Unified pack_module export encapsulating test devices and recipes.
 */

import type { pack_module } from '@/core';
import { assembler_device } from './devices/assembler';
import { belt_device } from './devices/belt';
import { merger_device } from './devices/merger';
import { splitter_device } from './devices/splitter';
import { irregular_3d_device } from './devices/irregular_3d';
import { pipe_device } from './devices/pipe';
import { recipe as advanced_circuit_recipe } from './recipes/advanced_circuit';
import { recipe as iron_gear_recipe } from './recipes/iron_gear';

export {
    assembler_device,
    belt_device,
    merger_device,
    splitter_device,
    irregular_3d_device,
    pipe_device,
    advanced_circuit_recipe,
    iron_gear_recipe
};

export const test_pack: pack_module = {
    pack_id: 'test',
    devices: {
        assembler:    assembler_device,
        belt:         belt_device,
        merger:       merger_device,
        splitter:     splitter_device,
        irregular_3d: irregular_3d_device,
        pipe:         pipe_device
    },
    recipes: {
        advanced_circuit: advanced_circuit_recipe,
        iron_gear:        iron_gear_recipe
    }
};

export function init_pack(): void
{
}
