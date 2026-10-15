export type vector = number[];

export interface namespaced_id
{
    namespace: string;
    id:        string;
}

export type uid = number;

export type hook_callback = (...args: any[]) => void;

export type hook_list = Map<string, Map<string, hook_callback[]>>;