import type { device, device_definition, vector } from '@/API';
import { device_definition_base } from '@/API';
import type { camera_type } from '@/packs/basic_renderer/types';
import { draw_ports } from './draw_ports';

export interface port_config
{
    side:   'top' | 'right' | 'bottom' | 'left';
    offset: number;
    media:  'belt' | 'pipe';
}

export interface machine_loss
{
    item:         string;
    rate_per_min: number;
}

export interface machine_mode
{
    id:           string;
    label:        string;
    input_ports:  port_config[];
    output_ports: port_config[];
    loss:         machine_loss | null;
}

export interface device_theme
{
    fill:   string;
    stroke: string;
    text:   string;
}

/**
 * Base OOP Device class for all Endfield machines.
 * Encapsulates blueprint metadata, shape/port generation, and custom drawing logic.
 */
export abstract class ef_device extends device_definition_base
{
    public readonly name:              string;
    public readonly width:             number;
    public readonly height:            number;
    public readonly power:             number;
    public readonly tags:              string[];
    public readonly is_source:         boolean;
    public readonly is_sink:           boolean;
    public readonly config_signed_off: boolean;
    public readonly modes:             machine_mode[];
    public readonly theme:             device_theme;

    constructor
    (
        id:                 string,
        name:               string,
        width:              number,
        height:             number,
        power:              number = -1,
        modes:              machine_mode[] = [],
        theme:              device_theme = { fill: '#1f2937', stroke: '#60a5fa', text: '#93c5fd' },
        tags:               string[] = [],
        is_source:          boolean = false,
        is_sink:            boolean = false,
        config_signed_off:  boolean = false
    )
    {
        super(id, [], [], [], {
            name,
            width,
            height,
            power,
            tags,
            is_source,
            is_sink,
            config_signed_off,
            modes,
            basic_renderer: { label: name }
        });

        this.name              = name;
        this.width             = width;
        this.height            = height;
        this.power             = power;
        this.tags              = tags;
        this.is_source         = is_source;
        this.is_sink           = is_sink;
        this.config_signed_off = config_signed_off;
        this.modes             = modes;
        this.theme             = theme;

        this.shape        = this.get_shape();
        this.input_ports  = this.get_input_ports();
        this.output_ports = this.get_output_ports();
    }

    /**
     * Computes the 2x grid local offset cells for this device.
     */
    public get_shape(): vector[]
    {
        const shape: vector[] = [];
        for (let x = 0; x < this.width; x++)
        {
            for (let y = 0; y < this.height; y++)
            {
                shape.push([x * 2, y * 2, 0]);
            }
        }
        return shape;
    }

    /**
     * Converts a single port configuration to 2x grid border coordinates.
     */
    protected convert_port(p: port_config): vector
    {
        if (p.side === 'top')
        {
            return [p.offset * 2, 2 * this.height - 1, 0];
        }
        if (p.side === 'bottom')
        {
            return [p.offset * 2, -1, 0];
        }
        if (p.side === 'left')
        {
            return [-1, 2 * (this.height - 1 - p.offset), 0];
        }
        if (p.side === 'right')
        {
            return [2 * this.width - 1, 2 * (this.height - 1 - p.offset), 0];
        }
        throw new Error(`Unknown port side: ${p.side}`);
    }

    /**
     * Computes the 2x grid input port offsets for this device.
     */
    public get_input_ports(mode_id?: string): vector[]
    {
        const mode = (mode_id ? this.modes.find(m => m.id === mode_id) : this.modes[0]) || { input_ports: [] };
        return (mode.input_ports || []).map(p => this.convert_port(p));
    }

    /**
     * Computes the 2x grid output port offsets for this device.
     */
    public get_output_ports(mode_id?: string): vector[]
    {
        const mode = (mode_id ? this.modes.find(m => m.id === mode_id) : this.modes[0]) || { output_ports: [] };
        return (mode.output_ports || []).map(p => this.convert_port(p));
    }

    /**
     * Converts this OOP device into an engine device_definition blueprint.
     */
    public to_definition(): device_definition
    {
        return this;
    }

    /**
     * Draws this device on the canvas (polymorphic and overridable).
     */
    public draw
    (
        ctx:     CanvasRenderingContext2D,
        sx:      number,
        sy:      number,
        sw:      number,
        sh:      number,
        zoom:    number,
        device?: device,
        def?:    device_definition,
        camera?: camera_type
    ): void
    {
        ctx.fillStyle = this.theme.fill;
        ctx.fillRect(sx, sy, sw, sh);

        ctx.strokeStyle = this.theme.stroke;
        ctx.lineWidth = Math.max(1, zoom * 0.04);
        ctx.strokeRect(sx, sy, sw, sh);

        const label_text = device ? `#${device.uid}` : this.name;

        ctx.fillStyle = this.theme.text;
        ctx.font = `bold ${Math.max(8, zoom * 0.22)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label_text, sx + sw / 2, sy + sh / 2);

        if (device && def)
        {
            draw_ports(ctx, device, def, camera);
        }
    }
}
