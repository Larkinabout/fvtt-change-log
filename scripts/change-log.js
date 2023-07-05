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

Hooks.on('deleteActiveEffect', async (activeEffect, data, userId) => {
    await game.changeLog.getDeleteData('activeEffect', { document: activeEffect, data, userId })
})

Hooks.on('preUpdateActor', async (actor, data, options, userId) => {
    await game.changeLog.getPreUpdateData('actor', { document: actor, data, options, userId })
})

Hooks.on('preUpdateItem', async (item, data, options, userId) => {
    await game.changeLog.getPreUpdateData('item', { document: item, data, options, userId })
})

export class ChangeLog {
    async init () {
        await loadTemplates([TEMPLATE.CHAT_CARD])
        this.getActorTypes()
        this.getProperties()
    }

    getActorTypes () {
        this.everyoneActorTypes = Utils.getSetting('everyoneActorTypes')
        this.gmActorTypes = Utils.getSetting('gmActorTypes')
    }

    async getProperties () {
        this.everyoneProperties = await this.#getProperties('everyoneProperties')
        this.gmProperties = await this.#getProperties('gmProperties')
        this.playerProperties = await this.#getProperties('playerProperties')
    }

    async #getProperties (setting) {
        const properties = Utils.getSetting(setting)?.split(DELIMITER) ?? ''
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

        return propertiesMap
    }

    async getPreUpdateData (documentType, preUpdateData) {
        const { document, data, options } = preUpdateData

        const everyoneProperties = this.everyoneProperties.get(documentType) ?? []
        const gmProperties = this.gmProperties.get(documentType) ?? []
        const playerProperties = this.playerProperties.get(documentType) ?? []

        if (!everyoneProperties.length && !gmProperties.length && !playerProperties.length) return

        const parentDocument = (['activeEffect', 'item'].includes(documentType) && document.parent?.documentName === 'Actor')
            ? document.parent
            : null
        const actor = parentDocument ?? document
        const actorType = actor.type
        const owners = Object.entries(actor.ownership)
            .filter(([userId, ownershipLevel]) => !game.users.get(userId)?.isGM && ownershipLevel === 3)
            .map(([userId, _]) => userId)
        const gms = game.users.filter(user => user.isGM).map(user => user.id)
        const document1Name = parentDocument?.name ?? document?.name
        const document2Name = (parentDocument) ? document.name : null

        // eslint-disable-next-line no-undef
        const flattenedObjects = await flattenObject(data)

        const modifiedByName = game.users.get(flattenedObjects['_stats.lastModifiedBy'])?.name

        for (const key of Object.keys(flattenedObjects)) {
            const isEveryone = (this.everyoneActorTypes.includes(actorType) && everyoneProperties.includes(key))
            const isGm = (this.gmActorTypes.includes(actorType) && gmProperties.includes(key))
            const isPlayer = playerProperties.includes(key)

            if (!isEveryone && !isGm && !isPlayer) continue

            const oldValue = Utils.getValueByDotNotation(document, key)
            const newValue = Utils.getValueByDotNotation(data, key)

            if (this.isNotValidChange({ oldValue, newValue })) continue

            const hbsData = {
                document1Name,
                document2Name,
                property: Utils.getChangeProperty(`${documentType}.${key}`),
                oldValue: Utils.getChangeValue(oldValue),
                newValue: Utils.getChangeValue(newValue),
                tooltip: `<div>${game.i18n.localize('changeLog.modifiedBy')}: ${modifiedByName}</div>`
            }
            const content = await renderTemplate(TEMPLATE.CHAT_CARD, hbsData)

            let whisper = null
            if (!isEveryone) {
                whisper = []
                if (isGm) whisper.push(...gms)
                if (isPlayer) whisper.push(...owners)
            }

            await ChatMessage.create({
                content,
                whisper
            })
        }
    }

    async getDeleteData (documentType, deleteData) {
        const { document, userId } = deleteData
        const gmProperties = this.gmProperties.get(documentType) ?? []
        const everyoneProperties = this.everyoneProperties.get(documentType) ?? []
        const key = 'deleted'
        const parentDocument = (['activeEffect', 'item'].includes(documentType) && document.parent?.documentName === 'Actor') ? document.parent : null
        const actorType = (parentDocument) ? parentDocument.type : document.type
        const document1Name = (parentDocument) ? parentDocument.name : document.name
        const document2Name = (parentDocument) ? document.name : null
        const modifiedByName = game.users.get(userId)?.name
        let isGmOnly = true

        const isEveryone = (this.everyoneActorTypes.includes(actorType) && everyoneProperties.includes(key))
        const isGm = (this.gmActorTypes.includes(actorType) && gmProperties.includes(key))
        if (!isEveryone && !isGm) return
        if (isEveryone) { isGmOnly = false }

        const hbsData = {
            document1Name,
            document2Name,
            property: Utils.getChangeProperty(`${documentType}.${key}`),
            oldValue: null,
            newValue: Utils.getChangeValue(true),
            tooltip: `<div>${game.i18n.localize('changeLog.modifiedBy')}: ${modifiedByName}</div>`
        }
        const content = await renderTemplate(TEMPLATE.CHAT_CARD, hbsData)
        const whisper = (isGmOnly) ? game.users.filter(user => user.isGmOnly).map(user => user.id) : null

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
