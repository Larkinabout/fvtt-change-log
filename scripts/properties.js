import { ACTOR_TYPES as DND5E_ACTOR_TYPES, PROPERTIES as DND5E_PROPERTIES } from './properties/dnd5e/properties.js'
import { ACTOR_TYPES as SWADE_ACTOR_TYPES, PROPERTIES as SWADE_PROPERTIES } from './properties/swade/properties.js'

export let ACTOR_TYPES
export let PROPERTIES = null

Hooks.on('init', () => {
    ACTOR_TYPES = getActorTypes()
    PROPERTIES = getProperties()

    function getActorTypes () {
        switch (game.system.id) {
        case 'dnd5e':
            return DND5E_ACTOR_TYPES
        case 'swade':
            return SWADE_ACTOR_TYPES
        }
    }

    function getProperties () {
        switch (game.system.id) {
        case 'dnd5e':
            return DND5E_PROPERTIES
        case 'swade':
            return SWADE_PROPERTIES
        }
    }
})
