/**
 * src/packs/vanilla_alpha/spatial.ts — 2× 網格幾何、向量算術、空間映射與碰撞檢驗
 */

import * as core from '@/core';

// ── 基礎向量算術 ─────────────────────────────────────────────────────────────

/**
 * 依分量將兩向量相加。
 */
export function add_vector(a: core.vector, b: core.vector): core.vector
{
    return a.map((v, i) => v + b[i]);
}

/**
 * 比較兩向量長度與各分量數值是否完全相等。
 */
export function vectors_equal(a: core.vector, b: core.vector): boolean
{
    return a.length === b.length && a.every((v, i) => v === b[i]);
}

/**
 * 將向量轉為逗號分隔字串，供 Map / Set 做鍵值索引。
 */
export function vector_to_string(vec: core.vector): string
{
    return vec.join(',');
}

// ── 2× 網格不變量校驗 ────────────────────────────────────────────────────────

/**
 * 驗證座標是否滿足裝置錨點不變量：所有分量必須為偶數。
 */
export function is_valid_device_position(pos: core.vector): boolean
{
    return pos.every(c => c % 2 === 0);
}

/**
 * 驗證座標是否滿足邊界端口不變量：恰有 1 軸為偶數、其餘 n - 1 軸為奇數。
 */
export function is_valid_port_position(port_pos: core.vector): boolean
{
    let even_count = 0;
    for (let i = 0; i < port_pos.length; i++)
    {
        if (port_pos[i] % 2 === 0)
        {
            even_count++;
        }
    }
    return even_count === 1;
}

/**
 * 解析端口所落於的交界面法線軸向（0 代表 X、1 代表 Y、2 代表 Z...）。
 * 若座標不符規範則回傳 null。
 */
export function get_port_axis(port_pos: core.vector): number | null
{
    const even_indices: number[] = [];
    for (let i = 0; i < port_pos.length; i++)
    {
        if (port_pos[i] % 2 === 0)
        {
            even_indices.push(i);
        }
    }
    return even_indices.length === 1 ? even_indices[0] : null;
}

// ── N 維稀疏空間映射表 ───────────────────────────────────────────────────────

/**
 * N 維空間雜湊表，以格點座標字串映射至泛型數值 T。
 */
export class spatial_map<T>
{
    private map = new Map<string, T>();

    public set(pos: core.vector, value: T): void
    {
        this.map.set(vector_to_string(pos), value);
    }

    public get(pos: core.vector): T | undefined
    {
        return this.map.get(vector_to_string(pos));
    }

    public has(pos: core.vector): boolean
    {
        return this.map.has(vector_to_string(pos));
    }

    public get_or_insert(pos: core.vector, default_factory: () => T): T
    {
        const key = vector_to_string(pos);
        if (!this.map.has(key))
        {
            this.map.set(key, default_factory());
        }
        return this.map.get(key)!;
    }

    public values(): IterableIterator<T>
    {
        return this.map.values();
    }

    public keys(): IterableIterator<string>
    {
        return this.map.keys();
    }
}

// ── 空間邊界與重疊校驗 ───────────────────────────────────────────────────────

export interface map_validation_result
{
    out_of_bounds: core.uid[];
    overlapped:    core.uid[];
}

/**
 * 檢查座標是否超出指定空間邊界。
 */
export function is_out_of_bounds(pos: core.vector, map_size: core.vector): boolean
{
    return pos.some((v, i) => v < 0 || v >= map_size[i]);
}

/**
 * 掃描空間上所有裝置，偵測並標記出超出邊界或彼此重疊之裝置 UID。
 */
export function check_map_overlap(map: core.space, _registry?: core.pack_registry): map_validation_result
{
    const occupied_map = new spatial_map<core.uid[]>();
    const out_of_bounds: core.uid[] = [];

    for (const dev of map.devices)
    {
        const cells = dev.get_shape().map(local_cell => add_vector(dev.position, local_cell));

        if (cells.some(cell => is_out_of_bounds(cell, map.size)))
        {
            out_of_bounds.push(dev.device_uid);
        }

        for (const cell of cells)
        {
            occupied_map.get_or_insert(cell, () => []).push(dev.device_uid);
        }
    }

    const overlapped = Array.from(new Set(
        Array.from(occupied_map.values())
            .filter(device_ids => new Set(device_ids).size > 1)
            .flat()
    ));

    return {
        out_of_bounds,
        overlapped
    };
}
