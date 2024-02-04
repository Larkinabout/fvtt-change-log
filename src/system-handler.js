import { ACTOR_TYPES as ARCHMAGE_ACTOR_TYPES, DERIVED_PROPERTIES as ARCHMAGE_DERIVED_PROPERTIES, PROPERTIES as ARCHMAGE_PROPERTIES } from './properties/archmage/properties.js'
import { ACTOR_TYPES as CYPHERSYSTEM_ACTOR_TYPES, DERIVED_PROPERTIES as CYPHERSYSTEM_DERIVED_PROPERTIES, PROPERTIES as CYPHERSYSTEM_PROPERTIES } from './properties/cyphersystem/properties.js'
import { ACTOR_TYPES as DND5E_ACTOR_TYPES, DERIVED_PROPERTIES as DND5E_DERIVED_PROPERTIES, PROPERTIES as DND5E_PROPERTIES } from './properties/dnd5e/properties.js'
import { ACTOR_TYPES as OSE_ACTOR_TYPES, DERIVED_PROPERTIES as OSE_DERIVED_PROPERTIES, PROPERTIES as OSE_PROPERTIES } from './properties/ose/properties.js'
import { ACTOR_TYPES as SWADE_ACTOR_TYPES, DERIVED_PROPERTIES as SWADE_DERIVED_PROPERTIES, PROPERTIES as SWADE_PROPERTIES } from './properties/swade/properties.js'

export let ACTOR_TYPES
export let DERIVED_PROPERTIES
export let PROPERTIES

Hooks.on('init', () => {
    ACTOR_TYPES = getActorTypes()
    DERIVED_PROPERTIES = getDerivedProperties()
    PROPERTIES = getProperties()
    setFonts()

    function getActorTypes () {
        switch (game.system.id) {
        case 'archmage':
            return ARCHMAGE_ACTOR_TYPES
        case 'cyphersystem':
            return CYPHERSYSTEM_ACTOR_TYPES
        case 'dnd5e':
            return DND5E_ACTOR_TYPES
        case 'ose':
            return OSE_ACTOR_TYPES
        case 'swade':
            return SWADE_ACTOR_TYPES
        default:
            return []
        }
    }

    function getDerivedProperties () {
        switch (game.system.id) {
        case 'archmage':
            return ARCHMAGE_DERIVED_PROPERTIES
        case 'cyphersystem':
            return CYPHERSYSTEM_DERIVED_PROPERTIES
        case 'dnd5e':
            return DND5E_DERIVED_PROPERTIES
        case 'ose':
            return OSE_DERIVED_PROPERTIES
        case 'swade':
            return SWADE_DERIVED_PROPERTIES
        default:
            return []
        }
    }

    function getProperties () {
        switch (game.system.id) {
        case 'archmage':
            return ARCHMAGE_PROPERTIES
        case 'cyphersystem':
            return CYPHERSYSTEM_PROPERTIES
        case 'dnd5e':
            return DND5E_PROPERTIES
        case 'ose':
            return OSE_PROPERTIES
        case 'swade':
            return SWADE_PROPERTIES
        default:
            return []
        }
    }

    function setFonts () {
        const fonts = {
            archmage: '"mason-serif","Nodesto","Signika","Palatino Linotype",serif',
            cyphersystem: '"mason-serif","Nodesto","Signika","Palatino Linotype",serif',
            dnd5e: 'var(--dnd5e-font-roboto-slab)',
            ose: null,
            swade: '"Roboto Slab","Signika",serif'
        }

        if (!fonts[game.system.id]) return

        document.documentElement.style.setProperty('--font-system-primary', fonts[game.system.id])
    }
})
