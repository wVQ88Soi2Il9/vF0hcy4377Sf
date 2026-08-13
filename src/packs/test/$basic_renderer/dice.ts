import type { device, device_definition } from '@/core/types';
import type { camera_type } from '@/packs/basic_renderer/types';
import type { device_draw_fn } from '@/packs/basic_renderer/draw_registry';

export const device_id = 'test:dice';

// Dynamically load all asset image URLs from ../assets/
const asset_modules = import.meta.glob('../assets/*', { eager: true, import: 'default' }) as Record<string, string>;
const dice_face_urls: string[] = Object.values(asset_modules);

const dice_images: HTMLImageElement[] = dice_face_urls.map((url) =>
{
    const img = new Image();
    img.src = url;
    return img;
});

export const draw: device_draw_fn = function draw_dice
(
    ctx:     CanvasRenderingContext2D,
    sx:      number,
    sy:      number,
    sw:      number,
    sh:      number,
    zoom:    number,
    device?: device,
    _def?:   device_definition,
    camera?: camera_type
): void
{
    let face_idx = 0;
    const total_faces = Math.max(1, dice_images.length);

    if (camera && device)
    {
        const { dim_h, dim_v, slices } = camera.plane;
        let depth_val = 0;
        for (let i = 0; i < slices.length; i++)
        {
            if (i !== dim_h && i !== dim_v)
            {
                depth_val += Math.abs(slices[i]);
            }
        }
        const seed = device.unique_id + dim_h * 2 + dim_v * 3 + Math.floor(depth_val / 2);
        face_idx = Math.abs(seed) % total_faces;
    }
    else if (device)
    {
        face_idx = Math.abs(device.unique_id) % total_faces;
    }

    const face_img = dice_images[face_idx];

    // Background fill
    ctx.fillStyle = '#181825';
    ctx.fillRect(sx, sy, sw, sh);

    if (face_img && face_img.complete && face_img.naturalWidth > 0)
    {
        ctx.drawImage(face_img, sx, sy, sw, sh);
    }
    else
    {
        ctx.fillStyle = '#cdd6f4';
        ctx.font = `bold ${Math.max(10, zoom * 0.35)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🎲 ${face_idx + 1}`, sx + sw / 2, sy + sh / 2);
    }

    if (device)
    {
        const uid_text = `#${device.unique_id}`;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, zoom * 0.25)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(uid_text, sx + sw / 2, sy + 2);
    }

    ctx.strokeStyle = '#cba6f7';
    ctx.lineWidth = Math.max(1, zoom * 0.04);
    ctx.strokeRect(sx, sy, sw, sh);
};
