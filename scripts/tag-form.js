import { DELIMITER, MODULE, TEMPLATE } from './constants.js'
import { PROPERTIES } from './properties.js'
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
        const tags = TagForm.tagify.value.map(tag => tag.id)
        const tagsString = tags.join(DELIMITER)
        await Utils.setSetting(setting, tagsString)
        game.changeLog.getProperties()
    }
}

/**
     * Prepare dialog hook
     * @private
     * @param {object} tags The tags
     */
Hooks.on('renderTagForm', (app, html, options) => {
    const tags = {}
    const tagsString = (app.constructor.name === 'GmTagForm') ? Utils.getSetting('gmOnlyProperties') : Utils.getSetting('everyoneProperties')
    const tagsArray = tagsString.split(DELIMITER)
    tags.selected = tagsArray.map(id => { return { id, value: Utils.getChangeProperty(id) } })
    tags.available = PROPERTIES.map(id => { return { id, value: Utils.getChangeProperty(id) } })

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
        dropdownLabelElement.innerHTML = game.i18n.localize('changeLog.tagForm.availableProperties')
        TagForm.tagify.DOM.scope.parentNode.appendChild(dropdownLabelElement)
        TagForm.tagify.DOM.scope.parentNode.appendChild(TagForm.tagify.DOM.dropdown)
    }
})

export class GmTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.gm.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.gm.description')
        }
    }

    async _updateObject () {
        super.updateObject('gmOnlyProperties')
    }
}

export class EveryoneTagForm extends TagForm {
    static get defaultOptions () {
        return mergeObject(super.defaultOptions, {
            title: game.i18n.localize('changeLog.tagForm.everyone.title')
        })
    }

    getData (options) {
        return {
            description: game.i18n.localize('changeLog.tagForm.everyone.description')
        }
    }

    async _updateObject () {
        super.updateObject('everyoneProperties')
    }
}
