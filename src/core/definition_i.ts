export type vector = number[];

export interface namespaced_id
{
    namespace: string;
    id:        string;
}

export type uid = string;

export function generate_uid(): uid
{
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export type hook_callback = (...args: any[]) => void;

export type hook_list = Map<string, Map<string, hook_callback[]>>;