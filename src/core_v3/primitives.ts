/**
 * N 維整數網格座標向量。
 * Index 0 = X, 1 = Y, 2 = Z, 3 = W, ...
 */
export type vector = number[];

/**
 * 結構化命名空間識別碼。
 */
export interface namespaced_id
{
    pack: string;
    id:   string;
}

export type uid = number;