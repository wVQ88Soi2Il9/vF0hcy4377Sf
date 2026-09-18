export interface panel
{
    readonly element: HTMLElement;
}

export type panel_direction = 'row' | 'column';

export interface fill_panels_options
{
    direction?: panel_direction;
}
