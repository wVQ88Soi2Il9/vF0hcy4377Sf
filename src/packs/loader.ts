import type { pack_module, pack_registry } from '@/core';
import { register_pack } from '@/core';

/**
 * 載入並註冊所有 Pack 模組。
 * 自動掃描 packs 旗下所有 index.ts，辨識導出的 pack_module 物件並註冊至全域 Registry。
 */
export function load_all_packs(registry: pack_registry): void
{
    const index_modules = import.meta.glob('./*/index.ts', { eager: true }) as Record<string, any>;

    for (const path in index_modules)
    {
        const parts = path.split('/');
        if (parts.length < 3)
        {
            continue;
        }

        const pack_dir = parts[1];
        const mod = index_modules[path];

        // 尋找導出的 pack_module 物件（可能為命名導出 pack_dir 或預設導出，或帶有 pack_id 屬性的物件）
        const pack_candidate: pack_module | undefined =
            (mod[pack_dir] && typeof mod[pack_dir] === 'object' && 'pack_id' in mod[pack_dir] ? mod[pack_dir] : undefined) ??
            (mod.default && typeof mod.default === 'object' && 'pack_id' in mod.default ? mod.default : undefined) ??
            Object.values(mod).find((v): v is pack_module => typeof v === 'object' && v !== null && 'pack_id' in v);

        if (pack_candidate)
        {
            register_pack(registry, pack_candidate);
        }
        else
        {
            // 若為純邏輯 pack 且無物件導出，以目錄名稱建立基礎 pack_module 結構
            register_pack(registry, { pack_id: pack_dir });
        }
    }
}

/**
 * 自動發現並執行各 Pack index.ts 導出的 init_pack() 初始化函式。
 */
export function call_all_pack_inits(): void
{
    const init_modules = import.meta.glob('./*/index.ts', { eager: true }) as Record<string, { init_pack?: () => void }>;

    for (const path in init_modules)
    {
        const mod = init_modules[path];
        if (typeof mod.init_pack === 'function')
        {
            mod.init_pack();
        }
    }
}
