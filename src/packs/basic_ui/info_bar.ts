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
 * Creates the right-side Info Bar panel (kept empty for now).
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
        width: 0;
        display: none;
        pointer-events: none;
        z-index: 10;
    `.trim();

    function update_stats(_stats: info_bar_stats): void
    {
        // Info bar kept empty for now
    }

    return { element, update_stats };
}

