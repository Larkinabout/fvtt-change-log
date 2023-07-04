import { MODULE } from './constants.js'
import { GmTagForm, EveryoneTagForm } from './tag-form.js'

export const registerSettings = function () {
    game.settings.registerMenu(MODULE.ID, 'gmOnlyTagForm', {
        name: game.i18n.localize('changeLog.settings.gmOnlyTagForm.name'),
        label: game.i18n.localize('changeLog.settings.gmOnlyTagForm.label'),
        hint: game.i18n.localize('changeLog.settings.gmOnlyTagForm.hint'),
        icon: 'fas fa-ballot-check',
        type: GmTagForm,
        restricted: true,
        scope: 'world'
    })

    game.settings.registerMenu(MODULE.ID, 'everyoneTagForm', {
        name: game.i18n.localize('changeLog.settings.everyoneTagForm.name'),
        label: game.i18n.localize('changeLog.settings.everyoneTagForm.label'),
        hint: game.i18n.localize('changeLog.settings.everyoneTagForm.hint'),
        icon: 'fas fa-ballot-check',
        type: EveryoneTagForm,
        restricted: true,
        scope: 'world'
    })

    game.settings.register(MODULE.ID, 'gmOnlyProperties', {
        name: 'GM-Only Properties',
        scope: 'world',
        config: false,
        type: String,
        default: ''
    })

    game.settings.register(MODULE.ID, 'everyoneProperties', {
        name: 'Everyone Properties',
        scope: 'world',
        config: false,
        type: String,
        default: ''
    })
}
