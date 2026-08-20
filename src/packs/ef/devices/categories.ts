import { ef_device, type machine_mode } from './ef_device';

export class ef_production_machine extends ef_device
{
    constructor(id: string, name: string, width: number, height: number, power: number = -1, modes: machine_mode[] = [])
    {
        super(id, name, width, height, power, modes, { fill: '#064e3b', stroke: '#10b981', text: '#34d399' }, ['基礎生產']);
    }
}

export class ef_synthesis_machine extends ef_device
{
    constructor(id: string, name: string, width: number, height: number, power: number = -1, modes: machine_mode[] = [])
    {
        super(id, name, width, height, power, modes, { fill: '#1e1b4b', stroke: '#818cf8', text: '#a5b4fc' }, ['合成製造']);
    }
}

export class ef_logistics_device extends ef_device
{
    constructor(id: string, name: string, width: number, height: number, power: number = -1, modes: machine_mode[] = [])
    {
        super(id, name, width, height, power, modes, { fill: '#1e293b', stroke: '#f59e0b', text: '#fbbf24' }, ['物流設備']);
    }
}

export class ef_storage_device extends ef_device
{
    constructor(id: string, name: string, width: number, height: number, power: number = -1, modes: machine_mode[] = [])
    {
        super(id, name, width, height, power, modes, { fill: '#18232c', stroke: '#94a3b8', text: '#cbd5e1' }, ['倉庫存取']);
    }
}

export class ef_power_device extends ef_device
{
    constructor(id: string, name: string, width: number, height: number, power: number = -1, modes: machine_mode[] = [])
    {
        super(id, name, width, height, power, modes, { fill: '#451a03', stroke: '#eab308', text: '#fde047' }, ['電力']);
    }
}
