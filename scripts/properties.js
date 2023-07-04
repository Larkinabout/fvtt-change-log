import { PROPERTIES as dnd5e } from './properties/dnd5e/properties.js'

export let PROPERTIES = null

Hooks.on('init', () => {
    PROPERTIES = getSystemProperties()

    function getSystemProperties () {
        switch (game.system.id) {
        case 'dnd5e':
            return dnd5e
        }
    }
})
