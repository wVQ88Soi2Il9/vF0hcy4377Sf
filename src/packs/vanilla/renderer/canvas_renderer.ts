import type { game_map, device_node, device, device_definition } from '@/core/types'
import type { pack_registry } from '@/core/pack_manager'
import type { camera } from './camera'
import { create_camera, grid_to_screen, screen_to_grid } from './camera'
import { draw_all_devices, draw_ghost_device } from './draw_device'
import { draw_all_connections } from './draw_connections'

// ── 背景顏色 ──────────────────────────────────────────────────────────────────
const COLOR_BG          = '#0f172a'
const COLOR_GRID_MINOR  = 'rgba(148,163,184,0.08)'
const COLOR_GRID_MAJOR  = 'rgba(148,163,184,0.18)'
const COLOR_AXIS        = 'rgba(148,163,184,0.35)'

/**
 * canvas_renderer 是 vanilla pack 的渲染器。
 *
 * 使用方式：
 *   const renderer = new canvas_renderer(canvas_el)
 *   renderer.render(map, registry, nodes)   ← 每 frame 呼叫一次
 *
 * 可選：
 *   renderer.set_selected(id)      ← 設定選中設備
 *   renderer.set_ghost(dev, def)   ← 設定放置預覽
 *   renderer.cam                   ← 直接修改相機（pan/zoom）
 */
export class canvas_renderer
{
    readonly canvas: HTMLCanvasElement
    readonly ctx:    CanvasRenderingContext2D
    cam:             camera

    private selected_id:  number | null  = null
    private ghost_dev:    device | null  = null
    private ghost_def:    device_definition | null = null

    constructor(canvas: HTMLCanvasElement)
    {
        this.canvas = canvas
        const ctx = canvas.getContext('2d')
        if (!ctx) { throw new Error('canvas_renderer: 無法取得 2D context') }
        this.ctx = ctx
        this.cam = create_camera(canvas.width, canvas.height)
    }

    // ── 公開設定 API ──────────────────────────────────────────────────────────

    set_selected(id: number | null): void
    {
        this.selected_id = id
    }

    set_ghost(dev: device | null, def: device_definition | null): void
    {
        this.ghost_dev = dev
        this.ghost_def = def
    }

    // ── 座標工具（給 mouse 事件用） ───────────────────────────────────────────

    screen_to_grid_pos(sx: number, sy: number): { gx: number; gy: number }
    {
        return screen_to_grid(this.cam, sx, sy)
    }

    // ── 主繪製入口 ─────────────────────────────────────────────────────────────

    render(
        map:      game_map,
        registry: pack_registry,
        nodes:    device_node[],
        error_ids: Set<number> = new Set()
    ): void
    {
        const { ctx, canvas, cam } = this

        // 自動同步 canvas 尺寸（防止 DPI 縮放導致模糊）
        this._sync_size()

        // 1. 清除背景
        ctx.fillStyle = COLOR_BG
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // 2. 畫網格
        this._draw_grid()

        // 3. 畫連線（在設備下方，先畫）
        draw_all_connections(ctx, cam, map, nodes, registry.device_definitions)

        // 4. 畫所有設備
        draw_all_devices(ctx, cam, map.devices, registry.device_definitions, error_ids, this.selected_id)

        // 5. 畫 ghost（放置預覽，疊最上面）
        if (this.ghost_dev && this.ghost_def)
        {
            draw_ghost_device(ctx, cam, this.ghost_dev, this.ghost_def)
        }
    }

    // ── 私有輔助 ──────────────────────────────────────────────────────────────

    private _sync_size(): void
    {
        const { canvas } = this
        const display_w = canvas.clientWidth
        const display_h = canvas.clientHeight
        if (canvas.width !== display_w || canvas.height !== display_h)
        {
            canvas.width  = display_w
            canvas.height = display_h
        }
    }

    /**
     * 畫背景網格。
     * minor = 每個真實格（zoom px）
     * major = 每 4 個真實格
     */
    private _draw_grid(): void
    {
        const { ctx, canvas, cam } = this
        const { pan_x, pan_y, zoom } = cam
        const w = canvas.width
        const h = canvas.height

        // minor lines（每格）
        ctx.strokeStyle = COLOR_GRID_MINOR
        ctx.lineWidth   = 1

        // 計算最左邊的格子 index
        const start_gx = Math.floor(-pan_x / zoom) - 1
        const end_gx   = Math.ceil((w - pan_x) / zoom) + 1
        const start_gy = Math.floor(-pan_y / zoom) - 1
        const end_gy   = Math.ceil((h - pan_y) / zoom) + 1

        ctx.beginPath()
        for (let i = start_gx; i <= end_gx; i++)
        {
            const x = pan_x + i * zoom
            ctx.moveTo(x, 0)
            ctx.lineTo(x, h)
        }
        for (let j = start_gy; j <= end_gy; j++)
        {
            const y = pan_y + j * zoom
            ctx.moveTo(0, y)
            ctx.lineTo(w, y)
        }
        ctx.stroke()

        // major lines（每 4 格）
        ctx.strokeStyle = COLOR_GRID_MAJOR
        ctx.lineWidth   = 1
        ctx.beginPath()
        for (let i = start_gx; i <= end_gx; i++)
        {
            if (i % 4 !== 0) { continue }
            const x = pan_x + i * zoom
            ctx.moveTo(x, 0)
            ctx.lineTo(x, h)
        }
        for (let j = start_gy; j <= end_gy; j++)
        {
            if (j % 4 !== 0) { continue }
            const y = pan_y + j * zoom
            ctx.moveTo(0, y)
            ctx.lineTo(w, y)
        }
        ctx.stroke()

        // 原點軸線
        ctx.strokeStyle = COLOR_AXIS
        ctx.lineWidth   = 1.5
        ctx.beginPath()
        ctx.moveTo(pan_x, 0); ctx.lineTo(pan_x, h)  // Y 軸
        ctx.moveTo(0, pan_y); ctx.lineTo(w, pan_y)   // X 軸
        ctx.stroke()
    }
}
