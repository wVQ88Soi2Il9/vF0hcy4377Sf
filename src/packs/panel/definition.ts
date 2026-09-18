export interface panel
{
    readonly element: HTMLElement;
}

export type panel_direction = 'row' | 'column';

export interface fill_panels_options
{
    direction?: panel_direction;
}

export interface panel_layout
{
    readonly resize_handles: readonly HTMLElement[];
    reset_sizes(): void;
}
