import type { device, device_definition } from '@/core/types'
import type { camera } from './camera'
import { grid_to_screen } from './camera'
import { get_world_cells, get_world_ports } from '@/utils/device_utils'

// ── 顏色常數 ─────────────────────────────────────────────────────────────────

const COLOR_DEVICE_FILL    = '#1e293b'   // 正常設備底色
const COLOR_DEVICE_BORDER  = '#38bdf8'   // 正常邊框
const COLOR_ERROR_FILL     = '#450a0a'   // 錯誤（重疊/越界）底色
const COLOR_ERROR_BORDER   = '#ef4444'   // 錯誤邊框
const COLOR_SELECTED_FILL  = '#0c2440'   // 選中底色
const COLOR_SELECTED_BORDER = '#facc15'  // 選中邊框（黃）
const COLOR_PORT_IN        = '#4ade80'   // 輸入 port（綠）
const COLOR_PORT_OUT       = '#f97316'   // 輸出 port（橘）
const COLOR_GHOST          = 'rgba(56,189,248,0.35)'  // 放置預覽
const COLOR_TEXT           = '#e2e8f0'

/**
 * 繪製地圖上的所有設備。
 *
 * @param ctx              Canvas 2D context
 * @param cam              相機狀態
 * @param devices          要繪製的設備列表
 * @param registry_defs    device_definition map（用 id 查找）
 * @param error_ids        有錯誤的 unique_id 集合（重疊/越界）
 * @param selected_id      目前選中的 unique_id，null 表示無
 */
export function draw_all_devices(
    ctx:           CanvasRenderingContext2D,
    cam:           camera,
    devices:       device[],
    registry_defs: Map<string, device_definition>,
    error_ids:     Set<number>,
    selected_id:   number | null
): void
{
    for (const dev of devices)
    {
        const def = registry_defs.get(dev.definition_id)
        if (!def) { continue }

        const is_error    = error_ids.has(dev.unique_id)
        const is_selected = dev.unique_id === selected_id

        draw_device(ctx, cam, dev, def, is_error, is_selected)
    }
}

/**
 * 繪製單一設備（所有格子 + ports + ID 文字）。
 */
function draw_device(
    ctx:         CanvasRenderingContext2D,
    cam:         camera,
    dev:         device,
    def:         device_definition,
    is_error:    boolean,
    is_selected: boolean
): void
{
    const cells = get_world_cells(dev, def)
    const tile   = cam.zoom          // 每格像素大小
    const half   = tile / 2

    // ── 格子底色 ────────────────────────────────────────────────────────────
    ctx.fillStyle   = is_error    ? COLOR_ERROR_FILL
                    : is_selected ? COLOR_SELECTED_FILL
                    : COLOR_DEVICE_FILL
    ctx.strokeStyle = is_error    ? COLOR_ERROR_BORDER
                    : is_selected ? COLOR_SELECTED_BORDER
                    : COLOR_DEVICE_BORDER
    ctx.lineWidth = 2

    for (const cell of cells)
    {
        // cell 座標是雙倍精度，偶數，所以 / 2 後就是真實格子 index
        const { sx, sy } = grid_to_screen(cam, cell.x, cell.y)
        ctx.beginPath()
        ctx.roundRect(sx - half + 2, sy - half + 2, tile - 4, tile - 4, 6)
        ctx.fill()
        ctx.stroke()
    }

    // ── 設備 ID 文字（只在 anchor 格顯示） ──────────────────────────────────
    const { sx: ax, sy: ay } = grid_to_screen(cam, dev.position.x, dev.position.y)
    ctx.fillStyle  = COLOR_TEXT
    ctx.font       = `${Math.max(10, tile * 0.22)}px monospace`
    ctx.textAlign  = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(def.id.split(':').pop() ?? def.id, ax, ay)

    // ── Ports ────────────────────────────────────────────────────────────────
    const in_ports  = get_world_ports(dev, def, 'input')
    const out_ports = get_world_ports(dev, def, 'output')

    for (const p of in_ports)
    {
        draw_port(ctx, cam, p.x, p.y, COLOR_PORT_IN)
    }
    for (const p of out_ports)
    {
        draw_port(ctx, cam, p.x, p.y, COLOR_PORT_OUT)
    }
}

/**
 * 繪製一個 port 小三角箭頭。
 * Port 座標是奇數，剛好在格子邊界上。
 */
function draw_port(
    ctx:   CanvasRenderingContext2D,
    cam:   camera,
    gx:    number,
    gy:    number,
    color: string
): void
{
    const { sx, sy } = grid_to_screen(cam, gx, gy)
    const r = cam.zoom * 0.15   // 三角形半徑

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(sx, sy, r, 0, Math.PI * 2)
    ctx.fill()
}

/**
 * 繪製一個半透明的「ghost」設備（放置預覽）。
 */
export function draw_ghost_device(
    ctx: CanvasRenderingContext2D,
    cam: camera,
    dev: device,
    def: device_definition
): void
{
    const cells = get_world_cells(dev, def)
    const tile   = cam.zoom
    const half   = tile / 2

    ctx.fillStyle   = COLOR_GHOST
    ctx.strokeStyle = COLOR_DEVICE_BORDER
    ctx.lineWidth   = 2

    for (const cell of cells)
    {
        const { sx, sy } = grid_to_screen(cam, cell.x, cell.y)
        ctx.beginPath()
        ctx.roundRect(sx - half + 2, sy - half + 2, tile - 4, tile - 4, 6)
        ctx.fill()
        ctx.stroke()
    }
}
