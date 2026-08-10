<template>
    <!--
        app.vue = 根元件，只負責：
        1. 掛 canvas（renderer 的畫布）
        2. 掛 HUD（Vue UI 疊在 canvas 上）
        3. 處理 mouse / wheel 事件
    -->
    <div class="app-root">
        <!-- ── Canvas ──────────────────────────────────────────── -->
        <canvas
            ref="canvas_el"
            class="main-canvas"
            @mousedown="on_mouse_down"
            @mousemove="on_mouse_move"
            @mouseup="on_mouse_up"
            @wheel.prevent="on_wheel"
            @contextmenu.prevent
        />

        <!-- ── HUD 層 ───────────────────────────────────────────── -->
        <toolbar
            :device_defs="Array.from(registry.device_definitions.values())"
        />

        <device_panel
            :device="selected_device"
            :all_defs="registry.device_definitions"
            :all_recipes="registry.recipes"
            @delete="on_delete_device"
            @recipe_change="on_recipe_change"
        />

        <status_bar
            :device_count="map.devices.length"
            :zoom="renderer?.cam.zoom ?? 64"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import type { game_map, device, device_definition } from '@/core/types'
import { create_pack_registry, load_pack }  from '@/core/pack_manager'
import { create_device, delete_device }     from '@/core/map_manager'
import { trigger_check_overlap, trigger_build_graph } from '@/core/hooks'
import { load_all_packs }                   from '@/packs/loader'
import { init_vanilla_pack }                from '@/packs/vanilla/index'
import { canvas_renderer }                  from '@/packs/vanilla/renderer/canvas_renderer'
import { use_editor_state, set_selected, set_cursor_pos } from '@/packs/vanilla/ui/use_editor_state'

import toolbar       from '@/packs/vanilla/ui/toolbar.vue'
import device_panel  from '@/packs/vanilla/ui/device_panel.vue'
import status_bar    from '@/packs/vanilla/ui/status_bar.vue'

// ── 引擎初始化 ────────────────────────────────────────────────────────────────

init_vanilla_pack()

const registry = reactive(create_pack_registry())
const loaded_packs = load_all_packs()
for (const p of loaded_packs)
{
    load_pack(registry as any, p)
}

const map = reactive<game_map>(
{
    size:          { x: 40, y: 40, z: 4 },
    next_unique_id: 1,
    devices:       []
})

// ── Renderer ──────────────────────────────────────────────────────────────────

const canvas_el  = ref<HTMLCanvasElement | null>(null)
let renderer:    canvas_renderer | null = null
let raf_id:      number = 0

// ── Editor State ──────────────────────────────────────────────────────────────

const editor = use_editor_state()

const selected_device = computed((): device | null =>
    editor.selected_id !== null
        ? (map.devices.find(d => d.unique_id === editor.selected_id) ?? null)
        : null
)

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() =>
{
    if (!canvas_el.value) { return }
    renderer = new canvas_renderer(canvas_el.value)
    start_loop()
})

onUnmounted(() =>
{
    cancelAnimationFrame(raf_id)
})

function start_loop(): void
{
    const tick = () =>
    {
        if (!renderer) { return }

        const validation = trigger_check_overlap(map as any, registry as any)
        const nodes      = trigger_build_graph(map as any, registry as any)
        const error_set  = new Set([...validation.out_of_bounds, ...validation.overlapped])

        // 同步 renderer 的 selected / ghost 狀態
        renderer.set_selected(editor.selected_id)

        // ghost device（放置預覽）
        if (editor.tool === 'place' && editor.placing_def_id && editor.cursor_grid_pos)
        {
            const def = registry.device_definitions.get(editor.placing_def_id)
            if (def)
            {
                const ghost: device =
                {
                    unique_id:    -1,
                    definition_id: editor.placing_def_id,
                    position:     { x: editor.cursor_grid_pos.gx, y: editor.cursor_grid_pos.gy, z: editor.current_layer },
                    rotation:     { x: 0, y: 0, z: 0 },
                    other_info:   {}
                }
                renderer.set_ghost(ghost, def)
            }
        }
        else
        {
            renderer.set_ghost(null, null)
        }

        renderer.render(map as any, registry as any, nodes, error_set)
        raf_id = requestAnimationFrame(tick)
    }
    raf_id = requestAnimationFrame(tick)
}

// ── Mouse 事件 ────────────────────────────────────────────────────────────────

// 記錄 pan 拖曳起點
let is_panning  = false
let pan_start_x = 0
let pan_start_y = 0
let pan_cam_x   = 0
let pan_cam_y   = 0

function get_canvas_pos(e: MouseEvent): { sx: number; sy: number }
{
    const rect = canvas_el.value!.getBoundingClientRect()
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top }
}

function on_mouse_down(e: MouseEvent): void
{
    if (!renderer) { return }
    const { sx, sy } = get_canvas_pos(e)

    // 右鍵或中鍵 → pan
    if (e.button === 1 || e.button === 2)
    {
        is_panning  = true
        pan_start_x = sx
        pan_start_y = sy
        pan_cam_x   = renderer.cam.pan_x
        pan_cam_y   = renderer.cam.pan_y
        return
    }

    // 左鍵
    if (e.button === 0)
    {
        const { gx, gy } = renderer.screen_to_grid_pos(sx, sy)

        if (editor.tool === 'place' && editor.placing_def_id)
        {
            place_device(gx, gy)
        }
        else if (editor.tool === 'delete')
        {
            delete_at(gx, gy)
        }
        else
        {
            select_at(gx, gy)
        }
    }
}

function on_mouse_move(e: MouseEvent): void
{
    if (!renderer) { return }
    const { sx, sy } = get_canvas_pos(e)

    // 更新 cursor 座標
    const pos = renderer.screen_to_grid_pos(sx, sy)
    set_cursor_pos(pos)

    if (is_panning)
    {
        renderer.cam.pan_x = pan_cam_x + (sx - pan_start_x)
        renderer.cam.pan_y = pan_cam_y + (sy - pan_start_y)
    }
}

function on_mouse_up(e: MouseEvent): void
{
    if (e.button === 1 || e.button === 2) { is_panning = false }
}

function on_wheel(e: WheelEvent): void
{
    if (!renderer) { return }
    const { sx, sy } = get_canvas_pos(e)

    // 以滑鼠位置為中心縮放
    const factor   = e.deltaY < 0 ? 1.1 : 0.9
    const old_zoom = renderer.cam.zoom
    const new_zoom = Math.max(20, Math.min(200, old_zoom * factor))

    // 保持滑鼠指向的世界座標不變
    renderer.cam.pan_x = sx - (sx - renderer.cam.pan_x) * (new_zoom / old_zoom)
    renderer.cam.pan_y = sy - (sy - renderer.cam.pan_y) * (new_zoom / old_zoom)
    renderer.cam.zoom  = new_zoom
}

// ── 操作函數 ──────────────────────────────────────────────────────────────────

function place_device(gx: number, gy: number): void
{
    if (!editor.placing_def_id) { return }
    const id = map.next_unique_id++
    create_device(map as any,
    {
        unique_id:     id,
        definition_id: editor.placing_def_id,
        position:      { x: gx, y: gy, z: editor.current_layer },
        rotation:      { x: 0, y: 0, z: 0 },
        other_info:    {}
    })
}

function delete_at(gx: number, gy: number): void
{
    // 找到格子 (gx, gy) 上的設備（用 anchor 比較，簡化版）
    const hit = map.devices.find(d =>
        d.position.x === gx && d.position.y === gy && d.position.z === editor.current_layer
    )
    if (hit) { delete_device(map as any, hit.unique_id) }
}

function select_at(gx: number, gy: number): void
{
    const hit = map.devices.find(d =>
        d.position.x === gx && d.position.y === gy && d.position.z === editor.current_layer
    )
    set_selected(hit?.unique_id ?? null)
}

function on_delete_device(id: number): void
{
    delete_device(map as any, id)
    set_selected(null)
}

function on_recipe_change(device_id: number, recipe_id: string | undefined): void
{
    const dev = map.devices.find(d => d.unique_id === device_id)
    if (dev) { dev.selected_recipe_id = recipe_id }
}
</script>

<style scoped>
.app-root
{
    position: relative;
    width:    100vw;
    height:   100vh;
    overflow: hidden;
}

.main-canvas
{
    display: block;
    width:   100%;
    height:  100%;
    cursor:  crosshair;
}
</style>
