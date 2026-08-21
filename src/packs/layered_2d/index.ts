import { vanilla, type map_validation_result, type device_node } from '@/packs/vanilla';
import { base_layered_device } from './base_device';
import { apply_d4_transform, compose_d4, invert_d4, normalize_rotation, is_vector_3d, add_vector_3d } from './math';
import { draw_layered_devices } from './renderer';

export type
{
    vector_3d,
    rotation_step,
    d4_transform,
    layered_camera,
    rotatable_device,
    layered_device,
    drawable_layered_device,
    layered_render_options
} from './types';

export type { map_validation_result, device_node };
export { base_layered_device } from './base_device';
export { apply_d4_transform, compose_d4, invert_d4, normalize_rotation, is_vector_3d, add_vector_3d } from './math';
export { draw_layered_devices } from './renderer';

export const layered_2d =
{
    base_layered_device,
    apply_d4_transform,
    compose_d4,
    invert_d4,
    normalize_rotation,
    is_vector_3d,
    add_vector_3d,
    draw_layered_devices,
    // 直接引用 vanilla 空間檢查與連接圖建構
    check_map_overlap:  vanilla.check_map_overlap,
    build_device_graph: vanilla.build_device_graph,
    is_out_of_bounds:   vanilla.is_out_of_bounds
};
