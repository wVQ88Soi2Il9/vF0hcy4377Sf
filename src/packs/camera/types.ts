/**
 * src/packs/camera/types.ts — 相機模組型別與資料契約
 */

export interface camera_args
{
    axes:        [number, number];
    slices:      Record<number, number>;
    other_info?: Record<string, unknown>;
}
