/**
 * 環境標籤資料
 */

import type { environment } from '../types';

/** 全部環境標籤 */
export const environment_list: readonly environment[] = [
    {
        id:      'none',
        label:   '無環境（預設）',
        builtin: true
    },
    {
        id:    'stable',
        label: '穩定環境'
    },
    {
        id:    'acidic',
        label: '酸性環境'
    },
    {
        id:    'humid',
        label: '濕潤環境'
    },
    {
        id:    'xisang',
        label: '息壤環境'
    }
];

const _env_map = new Map<string, environment>(environment_list.map((e) => [e.id, e]));

/**
 * 依 id 查詢環境標籤。
 *
 * @param id environment.id（如 `"none"`）
 */
export function get_environment(id: string): environment | undefined
{
    return _env_map.get(id);
}

/** 取得全部環境標籤副本 */
export function get_all_environments(): environment[]
{
    return [...environment_list];
}
