import { DELIMITER, MODULE, TEMPLATE } from './constants.js'
import { ACTOR_TYPES, PROPERTIES } from './properties.js'
import { Utils } from './utils.js'

export class TagForm extends FormApplication {
    tagify = null
    dragSort = null

    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            classes: ['change-log-tag-form'],
            template: TEMPLATE.TAG_FORM,
            id: 'change-log-tag-form',
            height: 600,
            width: 600,
            minimizable: true,
            popout: true,
            resizable: true,
            closeOnSubmit: true
        })
    }

    getData (options) {
        // return this.content
    }

    /**
     * Activate listeners
     * @public
     * @param {object} html The HTML element
     */
    activateListeners (html) {
        super.activateListeners(html)
        const cancel = html.find('#change-log-cancel')
        cancel.on('click', this.close.bind(this))
    }

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

    /**
     * Handle form submission
     * @param {object} event    The event
     * @param {object} formData The form data
     */
    async updateObject (setting) {
        const tags = TagForm.tagify.value.map(tag => tag.id ?? tag.value)
        const tagsString = tags.join(DELIMITER)
        await Utils.setSetting(setting, tagsString)
    }
}

/**
     * Prepare dialog hook
     * @private
     * @param {object} tags The tags
     */
Hooks.on('renderTagForm', (app, html, options) => {
    const tags = {}
    let tagsString = null
    let availableLabel = null
    let availableTags = []
    switch (app.constructor.name) {
    case 'EveryoneActorTypesTagForm':
        tagsString = Utils.getSetting('everyoneActorTypes')
        availableLabel = game.i18n.localize('changeLog.tagForm.everyoneActorTypes.label.available')
        availableTags = ACTOR_TYPES
        break
    case 'EveryonePropertiesTagForm':
        tagsString = Utils.getSetting('everyoneProperties')
        availableLabel = game.i18n.localize('changeLog.tagForm.everyoneProperties.label.available')
        availableTags = PROPERTIES
        break
    case 'GmActorTypesTagForm':
        tagsString = Utils.getSetting('gmActorTypes')
        availableLabel = game.i18n.localize('changeLog.tagForm.gmActorTypes.label.available')
        availableTags = ACTOR_TYPES
        break
    case 'GmPropertiesTagForm':
        tagsString = Utils.getSetting('gmProperties')
        availableLabel = game.i18n.localize('changeLog.tagForm.gmProperties.label.available')
        availableTags = PROPERTIES
        break
    case 'PlayerPropertiesTagForm':
        tagsString = Utils.getSetting('playerProperties')
        availableLabel = game.i18n.localize('changeLog.tagForm.playerProperties.label.available')
        availableTags = PROPERTIES
        break
    default:
        return
    }
    const selectedTags = (tagsString) ? tagsString.split(DELIMITER) : []
    tags.selected = (selectedTags) ? selectedTags.map(id => { return { id, value: Utils.getChangeProperty(id) } }) : null
    tags.available = (availableTags) ? availableTags.map(id => { return { id, value: Utils.getChangeProperty(id) } }) : null

    const $tagFilter = html.find('input[class="change-log-taginput"]')

    if ($tagFilter.length > 0) {
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

        TagForm.tagify = new Tagify($tagFilter[0], options)

        TagForm.dragSort = new DragSort(TagForm.tagify.DOM.scope, {
            selector: '.' + TagForm.tagify.settings.classNames.tag,
            callbacks: { dragEnd: onDragEnd }
        })

        function onDragEnd (elm) {
            TagForm.tagify.updateValueByDOMTags()
        }

        if (tags.selected) TagForm.tagify.addTags(tags.selected)

        // "remove all tags" button event listener
        const clearBtn = html.find('#change-log-clear-tags')
        clearBtn.on('click', TagForm.tagify.removeAllTags.bind(TagForm.tagify))

        TagForm.tagify.dropdown.show() // load the list
        const dropdownLabelElement = document.createElement('div')
        dropdownLabelElement.classList.add('change-log-form-label')
        dropdownLabelElement.innerHTML = availableLabel
        TagForm.tagify.DOM.scope.parentNode.appendChild(dropdownLabelElement)
        TagForm.tagify.DOM.scope.parentNode.appendChild(TagForm.tagify.DOM.dropdown)
    }
})

export class EveryoneActorTypesTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.everyoneActorTypes.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.everyoneActorTypes.description'),
            label: {
                clear: game.i18n.localize('changeLog.tagForm.everyoneActorTypes.label.clear'),
                selected: game.i18n.localize('changeLog.tagForm.everyoneActorTypes.label.selected')
            }
        }
    }

    async _updateObject () {
        super.updateObject('everyoneActorTypes')
    }
}

export class EveryonePropertiesTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.everyoneProperties.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.everyoneProperties.description'),
            label: {
                clear: game.i18n.localize('changeLog.tagForm.everyoneProperties.label.clear'),
                selected: game.i18n.localize('changeLog.tagForm.everyoneProperties.label.selected')
            }
        }
    }

    async _updateObject () {
        super.updateObject('everyoneProperties')
    }
}

export class GmActorTypesTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.gmActorTypes.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.gmActorTypes.description'),
            label: {
                clear: game.i18n.localize('changeLog.tagForm.gmActorTypes.label.clear'),
                selected: game.i18n.localize('changeLog.tagForm.gmActorTypes.label.selected')
            }
        }
    }

    async _updateObject () {
        super.updateObject('gmActorTypes')
    }
}

export class GmPropertiesTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.gmProperties.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.gmProperties.description'),
            label: {
                clear: game.i18n.localize('changeLog.tagForm.gmProperties.label.clear'),
                selected: game.i18n.localize('changeLog.tagForm.gmProperties.label.selected')
            }
        }
    }

    async _updateObject () {
        super.updateObject('gmProperties')
    }
}

export class PlayerPropertiesTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.playerProperties.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.playerProperties.description'),
            label: {
                clear: game.i18n.localize('changeLog.tagForm.playerProperties.label.clear'),
                selected: game.i18n.localize('changeLog.tagForm.playerProperties.label.selected')
            }
        }
    }

    async _updateObject () {
        super.updateObject('playerProperties')
    }
}
