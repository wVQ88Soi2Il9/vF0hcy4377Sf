import type { pack_module } from '@/API';
import { points_to_segments, segments_to_shape } from './pipe';

export { pipe, type pipe_segment, points_to_segments, segments_to_shape } from './pipe';

export const pipe_pack: pack_module = {
    id: 'pipe',
    points_to_segments,
    segments_to_shape
};

export function init_pack(): void
{
    import.meta.glob('./$*/*.ts', { eager: true });
}
