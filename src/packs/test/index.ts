import { register_device_draw } from '@/packs/basic_renderer/draw_registry'

/**
 * Initialize the test pack by registering draw functions for each device.
 * Called automatically by loader.ts — do not call manually.
 */
export function init_pack(): void
{
    // assembler — 2x2, 深藍底 + 白色標籤
    register_device_draw('test:assembler', (ctx, sx, sy, sw, sh, zoom) =>
    {
        ctx.fillStyle = '#1e3a5f'
        ctx.fillRect(sx, sy, sw, sh)

        ctx.strokeStyle = '#4a90d9'
        ctx.lineWidth = Math.max(1, zoom * 0.04)
        ctx.strokeRect(sx, sy, sw, sh)

        ctx.fillStyle = '#4a90d9'
        ctx.font = `bold ${Math.max(8, zoom * 0.3)}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('ASM', sx + sw / 2, sy + sh / 2)
    })

    // belt — 1x1, 灰底 + 方向箭頭（往上）
    register_device_draw('test:belt', (ctx, sx, sy, sw, sh, zoom) =>
    {
        ctx.fillStyle = '#3a3a3a'
        ctx.fillRect(sx, sy, sw, sh)

        ctx.strokeStyle = '#aaaaaa'
        ctx.lineWidth = Math.max(1, zoom * 0.04)
        ctx.strokeRect(sx, sy, sw, sh)

        const cx = sx + sw / 2
        const cy = sy + sh / 2
        const arrow_size = Math.min(sw, sh) * 0.3

        ctx.strokeStyle = '#e0e0e0'
        ctx.lineWidth = Math.max(1, zoom * 0.06)
        ctx.beginPath()
        ctx.moveTo(cx, cy + arrow_size)
        ctx.lineTo(cx, cy - arrow_size)
        ctx.lineTo(cx - arrow_size * 0.5, cy - arrow_size * 0.4)
        ctx.moveTo(cx, cy - arrow_size)
        ctx.lineTo(cx + arrow_size * 0.5, cy - arrow_size * 0.4)
        ctx.stroke()
    })

    // splitter — 1x1, 橙色 + 分叉符號
    register_device_draw('test:splitter', (ctx, sx, sy, sw, sh, zoom) =>
    {
        ctx.fillStyle = '#4a2800'
        ctx.fillRect(sx, sy, sw, sh)

        ctx.strokeStyle = '#f0a040'
        ctx.lineWidth = Math.max(1, zoom * 0.04)
        ctx.strokeRect(sx, sy, sw, sh)

        ctx.fillStyle = '#f0a040'
        ctx.font = `bold ${Math.max(8, zoom * 0.28)}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('SPL', sx + sw / 2, sy + sh / 2)
    })

    // merger — 1x1, 綠色 + 合流符號
    register_device_draw('test:merger', (ctx, sx, sy, sw, sh, zoom) =>
    {
        ctx.fillStyle = '#0a2e1a'
        ctx.fillRect(sx, sy, sw, sh)

        ctx.strokeStyle = '#40c070'
        ctx.lineWidth = Math.max(1, zoom * 0.04)
        ctx.strokeRect(sx, sy, sw, sh)

        ctx.fillStyle = '#40c070'
        ctx.font = `bold ${Math.max(8, zoom * 0.28)}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('MRG', sx + sw / 2, sy + sh / 2)
    })
}
