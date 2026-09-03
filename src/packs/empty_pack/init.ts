import { register_pack, type pack_registry } from '@/core';

export function global_init(registry: pack_registry): void
{
    register_pack(registry, {
        pack_id: 'empty_pack'
    });
}

export function local_init(): void
{

}