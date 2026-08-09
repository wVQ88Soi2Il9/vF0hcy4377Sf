import './style.css'
import { create_pack_registry, load_pack } from './core/pack_manager'
import { load_all_packs } from './packs/loader'

function init()
{
    const app = document.getElementById('app')
    
    // Initialize pack registry
    const registry = create_pack_registry()
    const packs = load_all_packs()
    
    packs.forEach(p => load_pack(registry, p))

    if (app)
    {
        app.innerHTML = `
            <h1>vF0hcy4377Sf - Core Initialized</h1>
            <p>Loaded Packs: ${packs.map(p => p.id).join(', ')}</p>
            <p>Loaded Devices: ${registry.device_definitions.size}</p>
        `
    }
    console.log('App initialized (Vanilla TS)', { registry })
}

init()
