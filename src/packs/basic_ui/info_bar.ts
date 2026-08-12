export interface info_bar_stats
{
    device_count:   number;
    map_dimensions: string;
}

export interface info_bar_component
{
    element:      HTMLElement;
    update_stats: (stats: info_bar_stats) => void;
}

/**
 * Creates the right-side Info Bar panel.
 */
export function create_info_bar(): info_bar_component
{
    const element = document.createElement('aside');
    element.id = 'info_bar';
    element.style.cssText = `
        position: absolute;
        top: 16px;
        right: 16px;
        bottom: 96px;
        width: 300px;
        background: rgba(15, 23, 42, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #f8fafc;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 13px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        pointer-events: auto;
        z-index: 10;
        overflow-y: auto;
    `.trim();

    element.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:12px;">
            <div style="font-weight:700;letter-spacing:0.05em;color:#38bdf8;">INFO PANEL</div>
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#4ade80;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#4ade80;"></span> LIVE
            </div>
        </div>

        <div style="background:rgba(30,41,59,0.5);border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.05);">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;">Map Overview</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <div>
                    <div style="font-size:10px;color:#64748b;">DEVICES</div>
                    <div id="info_device_count" style="font-size:18px;font-weight:700;color:#f1f5f9;">0</div>
                </div>
                <div>
                    <div style="font-size:10px;color:#64748b;">GRID SIZE</div>
                    <div id="info_map_dim" style="font-size:14px;font-weight:600;color:#cbd5e1;line-height:1.6;">-</div>
                </div>
            </div>
        </div>

        <div style="background:rgba(30,41,59,0.5);border-radius:8px;padding:12px;border:1px solid rgba(255,255,255,0.05);flex:1;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;">Device Inspector</div>
            <div style="font-size:12px;color:#64748b;font-style:italic;">No device selected</div>
        </div>
    `;

    const count_el = element.querySelector('#info_device_count');
    const dim_el   = element.querySelector('#info_map_dim');

    function update_stats(stats: info_bar_stats): void
    {
        if (count_el)
        {
            count_el.textContent = stats.device_count.toString();
        }
        if (dim_el)
        {
            dim_el.textContent = stats.map_dimensions;
        }
    }

    return { element, update_stats };
}
