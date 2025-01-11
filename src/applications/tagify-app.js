import { DELIMITER, TEMPLATE } from '../main/constants.js'
import { ACTOR_TYPES, PROPERTIES } from '../main/system-handler.js'
import { Utils } from '../main/utils.js'
import DragSort from '@yaireo/dragsort'
import Tagify from '@yaireo/tagify'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

export class TagifyApp extends HandlebarsApplicationMixin(ApplicationV2) {
    constructor () {
        super()
        this.tagify = null
        this.dragSort = null
    }

    /* -------------------------------------------- */

    static DEFAULT_OPTIONS = {
        actions: {
            selectAllTags: TagifyApp.selectAllTags,
            unselectAllTags: TagifyApp.unselectAllTags
        },
        classes: ['change-log-tagify-app'],
        form: {
            closeOnSubmit: true,
            handler: TagifyApp.submit
        },
        id: 'change-log-tagify-app',
        position: {
            width: 600,
            height: 680
        },
        tag: 'form',
        window: {
            minimizable: true,
            resizable: true
        }
    }

    static PARTS = {
        form: {
            template: TEMPLATE.TAG_FORM
        }
    }

    /* -------------------------------------------- */

    async _prepareContext () {}

    /* -------------------------------------------- */

    /**
     * When the 'Unselect All' button is clicked, unselect all tags
     */
    static unselectAllTags () {
        TagifyApp.tagify.removeAllTags()
    }

    /* -------------------------------------------- */

    /**
     * When the 'Select All' button is clicked, select all tags
     */
    static selectAllTags () {
        TagifyApp.tagify.addTags(TagifyApp.tagify.whitelist, true, true)
    }

    /* -------------------------------------------- */

    /** @override */
    _onKeyDown (event) {
    // Close dialog
        if (event.key === 'Escape' && !event.target.className.includes('tagify')) {
            event.preventDefault()
            event.stopPropagation()
            return this.close()
        }

        // Confirm default choice
        if (
            event.key === 'Enter' &&
            this.data.default &&
            !event.target.className.includes('tagify')
        ) {
            event.preventDefault()
            event.stopPropagation()
            const defaultChoice = this.data.buttons[this.data.default]
            return this.submit(defaultChoice)
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle form submission
     * @param {object} event    The event
     * @param {object} form     The form
     * @param {object} formData The form data
     */
    static async submit (event, form, formData) {
        const tags = TagifyApp.tagify.value.map(tag => tag.id ?? tag.value)
        const tagsString = tags.join(DELIMITER)
        await Utils.setSetting(this.settingKey, tagsString)
    }
}

/* -------------------------------------------- */

/**
 * Prepare dialog hook
 * @private
 * @param {object} tags The tags
 */
Hooks.on('renderTagifyApp', (app, html, options) => {
    const tags = {}
    let tagsString = null
    let availableLabel = null
    let availableTags = []
    switch (app.constructor.name) {
    case 'EveryoneActorTypesTagifyApp':
        tagsString = Utils.getSetting('everyoneActorTypes')
        availableLabel = game.i18n.localize('changeLog.tagifyApp.everyoneActorTypes.label.available')
        availableTags = ACTOR_TYPES
        break
    case 'EveryonePropertiesTagifyApp':
        tagsString = Utils.getSetting('everyoneProperties')
        availableLabel = game.i18n.localize('changeLog.tagifyApp.everyoneProperties.label.available')
        availableTags = PROPERTIES
        break
    case 'GmActorTypesTagifyApp':
        tagsString = Utils.getSetting('gmActorTypes')
        availableLabel = game.i18n.localize('changeLog.tagifyApp.gmActorTypes.label.available')
        availableTags = ACTOR_TYPES
        break
    case 'GmPropertiesTagifyApp':
        tagsString = Utils.getSetting('gmProperties')
        availableLabel = game.i18n.localize('changeLog.tagifyApp.gmProperties.label.available')
        availableTags = PROPERTIES
        break
    case 'PlayerPropertiesTagifyApp':
        tagsString = Utils.getSetting('playerProperties')
        availableLabel = game.i18n.localize('changeLog.tagifyApp.playerProperties.label.available')
        availableTags = PROPERTIES
        break
    default:
        return
    }
    const selectedTags = (tagsString) ? tagsString.split(DELIMITER) : []
    tags.selected = (selectedTags) ? selectedTags.map(id => { return { id, value: Utils.getPropertyName(id) } }) : null
    tags.available = (availableTags) ? availableTags.map(id => { return { id, value: Utils.getPropertyName(id) } }) : null

    const tagInput = html.querySelector('input[class="change-log-tagify"]')

    if (tagInput) {
        const options = {
            delimiters: DELIMITER,
            maxTags: 'Infinity',
            dropdown: {
                position: 'manual',
                maxItems: Infinity, // <- maximum allowed rendered suggestions
                classname: 'change-log-tags-dropdown', // <- custom classname for this dropdown, so it could be targeted
                enabled: 0 // <- show suggestions on focus
            },
            templates: {
                dropdownItemNoMatch () {
                    return '<div class=\'empty\'>Nothing Found</div>'
                }
            }
        }

        if (tags.available) options.whitelist = tags.available

        TagifyApp.tagify = new Tagify(tagInput, options)

        if (tags.selected) TagifyApp.tagify.addTags(tags.selected)

        TagifyApp.dragSort = new DragSort(TagifyApp.tagify.DOM.scope, {
            selector: `.${TagifyApp.tagify.settings.classNames.tag}`,
            callbacks: { dragEnd: onDragEnd }
        })

        /**
         * On drag end
         */
        function onDragEnd () {
            TagifyApp.tagify.updateValueByDOMTags()
        }

        const tagifyInput = html.querySelector('.tagify__input')
        if (tagifyInput) {
            tagifyInput.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault()
                    TagifyApp.tagify.addTags(TagifyApp.tagify.state.inputText, !0)
                }
            })
        }

        TagifyApp.tagify.dropdown.show()
        const dropdownLabelElement = document.createElement('div')
        dropdownLabelElement.classList.add('change-log-form-label')
        dropdownLabelElement.innerHTML = availableLabel
        TagifyApp.tagify.DOM.scope.parentNode.appendChild(dropdownLabelElement)
        TagifyApp.tagify.DOM.scope.parentNode.appendChild(TagifyApp.tagify.DOM.dropdown)
    }
})

/* -------------------------------------------- */

export class EveryoneActorTypesTagifyApp extends TagifyApp {
    constructor () {
        super()
        this.settingKey = 'everyoneActorTypes'
    }

    static DEFAULT_OPTIONS = {
        window: {
            title: 'changeLog.tagifyApp.everyoneActorTypes.title'
        }
    }

    async _prepareContext () {
        return {
            description: game.i18n.localize('changeLog.tagifyApp.everyoneActorTypes.description'),
            label: {
                clear: game.i18n.localize('changeLog.tagifyApp.everyoneActorTypes.label.clear'),
                selectAll: game.i18n.localize('changeLog.tagifyApp.everyoneActorTypes.label.selectAll'),
                selected: game.i18n.localize('changeLog.tagifyApp.everyoneActorTypes.label.selected')
            }
        }
    }
}

/* -------------------------------------------- */

export class EveryonePropertiesTagifyApp extends TagifyApp {
    constructor () {
        super()
        this.settingKey = 'everyoneProperties'
    }

    static DEFAULT_OPTIONS = {
        window: {
            title: 'changeLog.tagifyApp.everyoneProperties.title'
        }
    }

    async _prepareContext () {
        return {
            description: game.i18n.localize('changeLog.tagifyApp.everyoneProperties.description'),
            label: {
                selected: game.i18n.localize('changeLog.tagifyApp.everyoneProperties.label.selected')
            }
        }
    }
}

/* -------------------------------------------- */

export class GmActorTypesTagifyApp extends TagifyApp {
    constructor () {
        super()
        this.settingKey = 'gmActorTypes'
    }

    static DEFAULT_OPTIONS = {
        window: {
            title: 'changeLog.tagifyApp.gmActorTypes.title'
        }

    }

    async _prepareContext () {
        return {
            description: game.i18n.localize('changeLog.tagifyApp.gmActorTypes.description'),
            label: {
                selected: game.i18n.localize('changeLog.tagifyApp.gmActorTypes.label.selected')
            }
        }
    }
}

/* -------------------------------------------- */

export class GmPropertiesTagifyApp extends TagifyApp {
    constructor () {
        super()
        this.settingKey = 'gmProperties'
    }

    static DEFAULT_OPTIONS = {
        window: {
            title: 'changeLog.tagifyApp.gmProperties.title'
        }
    }

    async _prepareContext () {
        return {
            description: game.i18n.localize('changeLog.tagifyApp.gmProperties.description'),
            label: {
                selected: game.i18n.localize('changeLog.tagifyApp.gmProperties.label.selected')
            }
        }
    }
}

/* -------------------------------------------- */

export class PlayerPropertiesTagifyApp extends TagifyApp {
    constructor () {
        super()
        this.settingKey = 'playerProperties'
    }

    static DEFAULT_OPTIONS = {
        window: {
            title: 'changeLog.tagifyApp.playerProperties.title'
        }
    }

    async _prepareContext () {
        return {
            description: game.i18n.localize('changeLog.tagifyApp.playerProperties.description'),
            label: {
                selected: game.i18n.localize('changeLog.tagifyApp.playerProperties.label.selected')
            }
        }
    }
}
