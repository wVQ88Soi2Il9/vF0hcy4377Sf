/**
 * src/main.ts — 依據 src/README.md 實裝之 Runtime 生命週期示範
 *
 * 核心哲學：
 * - Packs 定義「系統能做什麼（What the system can do）」
 * - Worlds 容納「當前正在運行什麼（What is currently running）」
 *
 * 核心不變量（Invariant）：
 * - Hook definitions are global. Hook callbacks are per-world.
 * - 注入至 World A 的回呼絕不影響 World B。
 */

import
{
    create_pack_registry,
    register_pack,
    build_empty_hook_list,
    inject_world_hook,
    space,
    pure_world,
    type pack_module
} from '@/core_v3';

// ── 1. Initialize (初始化) ───────────────────────────────────────────────────
// 依序加載所有 Pack，每個 Pack 宣告其能力與 Hook 定義清單。

console.log('[Runtime Architecture] === Stage 1: Initialize ===');

const registry = create_pack_registry();

// 宣告示範 Pack A：工廠流水線模組
const factory_pack: pack_module =
{
    pack_id: 'factory',
    hooks:
    [
        { namespace: 'factory', id: 'device_produced' },
        { namespace: 'factory', id: 'machine_overheated' }
    ]
};

// 宣告示範 Pack B：物流傳輸模組
const logistics_pack: pack_module =
{
    pack_id: 'logistics',
    hooks:
    [
        { namespace: 'logistics', id: 'item_shipped' },
        { namespace: 'logistics', id: 'conveyor_jammed' }
    ]
};

register_pack(registry, factory_pack);
register_pack(registry, logistics_pack);

// 走訪已就緒之 registry，建構全域空 Hook 槽位模板：
// namespace
// └── hook
//     └── callbacks[]
const hook_template = build_empty_hook_list(registry);

console.log('Registered Packs:', Array.from(registry.packs.keys()));
console.log('Global Hook Template Namespaces:', Array.from(hook_template.keys()));

// ── 2. Create World (建立世界實例) ───────────────────────────────────────────
// 每個新世界實例接收從 template 深拷貝獲得的獨立槽位清單。

console.log('\n[Runtime Architecture] === Stage 2: Create World ===');

const space_a = new space([16, 16, 4]);
const space_b = new space([32, 32, 4]);

const world_a = new pure_world(space_a, hook_template, 'world_alpha');
const world_b = new pure_world(space_b, hook_template, 'world_beta');

console.log(`Created ${world_a.id} (Space: 16×16×4)`);
console.log(`Created ${world_b.id} (Space: 32×32×4)`);
console.log('Hook slot memory isolation check (world_a !== world_b):', world_a.current_hook !== world_b.current_hook);

// ── 3. Run World (運行世界與回呼獨立注入) ──────────────────────────────────────
// Pack 針對特定世界實例注入獨立回呼，世界運作時觸發其專屬 Hook。

console.log('\n[Runtime Architecture] === Stage 3: Run World ===');

const logs: string[] = [];

function record_log(msg: string): void
{
    console.log(msg);
    logs.push(msg);
}

// 向 World Alpha 注入專屬產線監聽回呼
inject_world_hook
(
    world_a,
    { namespace: 'factory', id: 'device_produced' },
    (payload: { item: string; quantity: number }) =>
    {
        record_log(`[World Alpha Hook] Device produced: ${payload.item} × ${payload.quantity}`);
    }
);

// 向 World Beta 注入不同的監聽回呼
inject_world_hook
(
    world_b,
    { namespace: 'factory', id: 'device_produced' },
    (payload: { item: string; quantity: number }) =>
    {
        record_log(`[World Beta Hook] Telemetry received: ${payload.item} (Qty: ${payload.quantity})`);
    }
);

inject_world_hook
(
    world_a,
    { namespace: 'logistics', id: 'item_shipped' },
    (route: string) =>
    {
        record_log(`[World Alpha Hook] Cargo dispatched via route: ${route}`);
    }
);

// ── 4. 驗證核心不變量（Invariant Verification） ──────────────────────────────
// Invariant: Hook definitions are global. Hook callbacks are per-world.

record_log('\n--- Triggering event on World Alpha ---');
world_a.trigger({ namespace: 'factory', id: 'device_produced' }, { item: 'assembler', quantity: 2 });
world_a.trigger({ namespace: 'logistics', id: 'item_shipped' }, 'Sector-7G');

record_log('\n--- Triggering event on World Beta ---');
world_b.trigger({ namespace: 'factory', id: 'device_produced' }, { item: 'fusion_core', quantity: 1 });

// ── 5. 若在瀏覽器中運行，渲染視覺化架構狀態 ──────────────────────────────────
if (typeof document !== 'undefined')
{
    const app = document.getElementById('app');
    if (app)
    {
        app.innerHTML = `
            <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background: #181825; color: #cdd6f4; min-height: 100vh; padding: 2rem; box-sizing: border-box;">
                <div style="max-width: 800px; margin: 0 auto; background: #1e1e2e; border: 1px solid #313244; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
                    <h1 style="color: #89b4fa; margin-top: 0; font-size: 1.5rem; border-bottom: 1px solid #313244; padding-bottom: 0.75rem;">
                        Runtime Architecture · 5-Stage Hook Lifecycle
                    </h1>
                    <div style="margin-bottom: 1rem; color: #a6adc8; font-size: 0.9rem;">
                        <strong>Invariant:</strong> Hook definitions are global. Hook callbacks are per-world.
                    </div>
                    <div style="background: #11111b; border: 1px solid #313244; border-radius: 6px; padding: 1rem; white-space: pre-wrap; line-height: 1.5; font-size: 0.85rem; color: #a6e3a1;">${logs.join('\n')}</div>
                </div>
            </div>
        `;
    }
}
