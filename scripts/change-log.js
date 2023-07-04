import { BOOLEAN_ICON, DELIMITER, TEMPLATE } from './constants.js'
import { registerSettings } from './settings.js'
import { Utils } from './utils.js'

Hooks.on('init', () => {
    registerSettings()
    game.changeLog = new ChangeLog()
    game.changeLog.init()
})

Hooks.on('preUpdateActiveEffect', async (activeEffect, data, options, userId) => {
    await game.changeLog.getPreUpdateData('activeEffect', { document: activeEffect, data, options, userId })
})

Hooks.on('updateActiveEffect', async (activeEffect, data, options, userId) => {
    await game.changeLog.getUpdateData('activeEffect', { document: activeEffect, data, options, userId })
})

Hooks.on('deleteActiveEffect', async (activeEffect, data, userId) => {
    await game.changeLog.getDeleteData('activeEffect', { document: activeEffect, data, userId })
})

Hooks.on('preUpdateActor', async (actor, data, options, userId) => {
    await game.changeLog.getPreUpdateData('actor', { document: actor, data, options, userId })
})

Hooks.on('updateActor', async (actor, data, options, userId) => {
    await game.changeLog.getUpdateData('actor', { document: actor, data, options, userId })
})

Hooks.on('preUpdateItem', async (item, data, options, userId) => {
    await game.changeLog.getPreUpdateData('item', { document: item, data, options, userId })
})

Hooks.on('updateItem', async (item, data, options, userId) => {
    await game.changeLog.getUpdateData('item', { document: item, data, options, userId })
})

export class ChangeLog {
    constructor () {
        this.changes = new Map()
    }

    async init () {
        await loadTemplates([TEMPLATE.CHAT_CARD])
        this.getProperties()
    }

    getProperties () {
        this.gmProperties = new Map()
        this.everyoneProperties = new Map()
        this.#getProperties('gmOnlyProperties')
        this.#getProperties('everyoneProperties')
    }

    async #getProperties (setting) {
        const properties = Utils.getSetting(setting)?.split(DELIMITER)
        const propertiesMap = new Map()
        for (const property of properties) {
            const arr = property.split('.')
            const type = arr[0]
            const dot = arr.slice(1).join('.')
            if (propertiesMap.has(type)) {
                propertiesMap.get(type).push(dot)
            } else {
                propertiesMap.set(type, [dot])
            }
        }

        if (setting === 'gmOnlyProperties') {
            this.gmProperties = propertiesMap
        } else {
            this.everyoneProperties = propertiesMap
        }
    }

    async getPreUpdateData (documentType, preUpdateData) {
        const { document, data, options } = preUpdateData
        const gmProperties = this.gmProperties.get(documentType) ?? []
        const everyoneProperties = this.everyoneProperties.get(documentType) ?? []
        if (!gmProperties.length && !everyoneProperties.length) return

        const changeId = data._id
        const parentDocument = (['activeEffect', 'item'].includes(documentType) && document.parent?.documentName === 'Actor') ? document.parent : null
        const document1Name = (parentDocument) ? parentDocument.name : document.name
        const document2Name = (parentDocument) ? document.name : null
        const changeData = {}
        let isGmOnly = true
        let hasData = false

        // eslint-disable-next-line no-undef
        const flattenedObjects = await flattenObject(data)

        for (const key of Object.keys(flattenedObjects)) {
            if (everyoneProperties.includes(key) || gmProperties.includes(key)) {
                changeData[key] = {
                    oldValue: Utils.getValueByDotNotation(document, key),
                    newValue: null
                }
                hasData = true
            }
            if (everyoneProperties.includes(key)) {
                isGmOnly = false
            }
        }

        if (hasData && !this.changes.has(changeId)) {
            this.changes.set(changeId, { document1Name, document2Name, isGmOnly, lastModifiedByName: null, data: changeData })
        }
    }

    async getUpdateData (documentType, updateData) {
        const { document, data, options } = updateData
        const changeId = data._id
        const changeData = this.changes.get(changeId)

        if (!changeData) return

        let hasData = false

        // eslint-disable-next-line no-undef
        const flattenedObjects = await flattenObject(data)

        for (const [key, value] of Object.entries(flattenedObjects)) {
            if (key === '_stats.lastModifiedBy') {
                changeData.modifiedByName = game.users.get(flattenedObjects[key])?.name
                continue
            }

            if (Object.hasOwn(changeData.data, key)) {
                changeData.data[key].newValue = value
                hasData = true
            }
        }

        if (!hasData) return

        for (const [key, value] of Object.entries(changeData.data)) {
            if (this.isNotValidChange(value)) continue

            const hbsData = {
                document1Name: changeData.document1Name,
                document2Name: changeData.document2Name,
                property: Utils.getChangeProperty(`${documentType}.${key}`),
                oldValue: Utils.getChangeValue(value.oldValue),
                newValue: Utils.getChangeValue(value.newValue),
                tooltip: `<div>${game.i18n.localize('changeLog.modifiedBy')}: ${changeData.modifiedByName}</div>`
            }
            const content = await renderTemplate(TEMPLATE.CHAT_CARD, hbsData)
            const whisper = (changeData.isGmOnly) ? game.users.filter(user => user.isGM).map(user => user.id) : null

            await ChatMessage.create({
                content,
                whisper
            })

            this.changes.delete(changeId)
        }
    }

    async getDeleteData (documentType, deleteData) {
        const { document, userId } = deleteData
        const gmProperties = this.gmProperties.get(documentType) ?? []
        const everyoneProperties = this.everyoneProperties.get(documentType) ?? []
        const key = 'deleted'
        const parentDocument = (['activeEffect', 'item'].includes(documentType) && document.parent?.documentName === 'Actor') ? document.parent : null
        const document1Name = (parentDocument) ? parentDocument.name : document.name
        const document2Name = (parentDocument) ? document.name : null
        const modifiedByName = game.users.get(userId)?.name
        let isGmOnly = true

        if (!everyoneProperties.includes(key) && !gmProperties.includes(key)) return
        if (everyoneProperties.includes(key)) { isGmOnly = false }

        const hbsData = {
            document1Name,
            document2Name,
            property: Utils.getChangeProperty(`${documentType}.${key}`),
            oldValue: null,
            newValue: Utils.getChangeValue(true),
            tooltip: `<div>${game.i18n.localize('changeLog.modifiedBy')}: ${modifiedByName}</div>`
        }
        const content = await renderTemplate(TEMPLATE.CHAT_CARD, hbsData)
        const whisper = (isGmOnly) ? game.users.filter(user => user.isGM).map(user => user.id) : null

        await ChatMessage.create({
            content,
            whisper
        })
    }

    isNotValidChange (value) {
        if (value.oldValue === value.newValue) return true
        if ([0, null].includes(value.oldValue) && [0, null].includes(value.newValue)) return true
        return false
    }
}
