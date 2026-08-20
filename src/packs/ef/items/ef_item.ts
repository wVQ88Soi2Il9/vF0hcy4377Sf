import type { item_definition } from '@/core/types';

export type item_form = 'solid' | 'liquid' | 'gas';
export type item_category = 'material' | 'product';

export interface ef_item_options
{
    id:        string;
    name:      string;
    form:      item_form;
    category?: item_category;
}

/**
 * Base OOP Item class for Endfield materials and products.
 */
export class ef_item
{
    public readonly id:       string;
    public readonly name:     string;
    public readonly form:     item_form;
    public readonly category: item_category;

    constructor(options: ef_item_options)
    {
        this.id       = options.id;
        this.name     = options.name;
        this.form     = options.form;
        this.category = options.category ?? 'product';
    }

    public to_definition(): item_definition
    {
        return {
            id: this.id,
            other_info:
            {
                name:     this.name,
                form:     this.form,
                category: this.category
            }
        };
    }
}

export class ef_material extends ef_item
{
    constructor(id: string, name: string, form: item_form)
    {
        super({ id, name, form, category: 'material' });
    }
}

export class ef_product extends ef_item
{
    constructor(id: string, name: string, form: item_form)
    {
        super({ id, name, form, category: 'product' });
    }
}
