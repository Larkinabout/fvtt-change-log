import { DELIMITER, MODULE, TEMPLATE } from './constants.js'
import { DERIVED_PROPERTIES } from './system-handler.js'
import { registerSettings } from './settings.js'
import { Utils } from './utils.js'

Hooks.on('init', () => {
    registerSettings()
    game.changeLog = new ChangeLog()
    game.changeLog.init()

    const module = game.modules.get(MODULE.ID)
    module.api = {
        undo,
        Utils
    }
})

Hooks.on('getChatLogEntryContext', async (html, menuItems) => {
    const menuItem = {
        name: 'Undo Change',
        icon: '<i class="fas fa-rotate-left"></i>',
        condition: li => {
            const message = game.messages.get(li.data('messageId'))
            return message.getFlag('change-log', 'val') !== null
        },
        callback: li => {
            undo(li.data('messageId'))
        }
    }

    menuItems.push(menuItem)
})

Hooks.on('preCreateCombatant', async (combatant, data, options, userId) => {
    await game.changeLog.getPreCreateCombatant({ combatant, data, options, userId })
})

Hooks.on('preUpdateActiveEffect', async (activeEffect, data, options, userId) => {
    await game.changeLog.getPreUpdateData('activeEffect', { document: activeEffect, data, options, userId })
})

Hooks.on('preDeleteActiveEffect', async (activeEffect, data, userId) => {
    await game.changeLog.getDeleteData('activeEffect', { document: activeEffect, data, userId })
})

Hooks.on('preUpdateActor', async (actor, data, options, userId) => {
    await game.changeLog.getPreUpdateData('actor', { document: actor, data, options, userId })
})

Hooks.on('preUpdateItem', async (item, data, options, userId) => {
    await game.changeLog.getPreUpdateData('item', { document: item, data, options, userId })
})

Hooks.on('updateActor', async (actor, data, options, userId) => {
    if (game.userId !== data._stats?.lastModifiedBy) return
    await game.changeLog.getUpdateData('actor', { document: actor, data, options, userId })
})

Hooks.on('updateItem', async (item, data, options, userId) => {
    if (game.userId !== data._stats?.lastModifiedBy) return
    await game.changeLog.getUpdateData('item', { document: item, data, options, userId })
})

Hooks.on('renderChatMessage', async (chatMessage, html) => {
    if (!chatMessage.getFlag('change-log', 'id1')) return
    if (chatMessage.whisper.length && !chatMessage.whisper.includes(game.user.id)) { html.css('display', 'none') }
    if (!game.changeLog.showRecipients) { html.find('.whisper-to')?.remove() }
    if (!game.changeLog.showSender) {
        html.find('.message-sender')?.remove()
        html.css('position', 'relative')
        html.find('.message-header')?.css({ position: 'absolute', right: '6px' })
    }
})

export class ChangeLog {
    constructor () {
        this.derivedPropertiesMap = new Map()
    }

    async init () {
        Promise.all([
            loadTemplates([TEMPLATE.CHAT_CARD, TEMPLATE.TAG_FORM]),
            this.getEveryoneActorTypes(),
            this.getEveryoneProperties(),
            this.getGmActorTypes(),
            this.getGmProperties(),
            this.getPlayerProperties(),
            this.getShowRecipients(),
            this.getShowSender()
        ])
    }

    async getEveryoneActorTypes () {
        this.everyoneActorTypes = await Utils.getSetting('everyoneActorTypes')?.split(DELIMITER) ?? []
    }

    async getEveryoneProperties () {
        this.everyoneProperties = await Utils.getSetting('everyoneProperties')?.split(DELIMITER) ?? []
    }

    async getGmActorTypes () {
        this.gmActorTypes = await Utils.getSetting('gmActorTypes')?.split(DELIMITER) ?? []
    }

    async getGmProperties () {
        this.gmProperties = await Utils.getSetting('gmProperties')?.split(DELIMITER) ?? []
    }

    async getPlayerProperties () {
        this.playerProperties = await Utils.getSetting('playerProperties')?.split(DELIMITER) ?? []
    }

    async getShowRecipients () {
        this.showRecipients = await Utils.getSetting('showRecipients')
    }

    async getShowSender () {
        this.showSender = await Utils.getSetting('showSender')
    }

    async getPreCreateCombatant (preCreateCombatantData) {
        const { combatant, userId } = preCreateCombatantData

        const actor = game.actors.get(combatant.actorId)
        const documentType = 'actor'
        const key = 'inCombat'
        const modifiedByName = game.users.get(userId)?.name

        const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

        if (!isEveryone && !isGm && !isPlayer) return

        const templateData = {
            document1Id: document.id,
            document2Id: null,
            document1Name: actor.name,
            document2Name: null,
            documentType,
            key,
            modifiedByName,
            oldValue: actor.inCombat,
            newValue: true
        }

        const whisperData = {
            actor,
            isEveryone,
            isGm,
            isPlayer
        }

        this.#createChatMessage('preCreateCombatant', templateData, whisperData)
    }

    async getPreUpdateData (documentType, preUpdateData) {
        const { document, data, userId } = preUpdateData

        const parentDocument = (documentType !== 'actor' && document.parent?.documentName === 'Actor')
            ? document.parent
            : null
        const actor = parentDocument ?? document

        const derivedProperties = DERIVED_PROPERTIES.map(derivedProperty => {
            const obj = (derivedProperty.split('.')[0] === 'actor') ? actor : document
            const oldValue = Utils.getValueByDotNotation(obj, Utils.getPropertyKey(derivedProperty))
            return { property: derivedProperty, oldValue }
        })

        if (derivedProperties.length) {
            if (!this.derivedPropertiesMap.has(document.id)) {
                this.derivedPropertiesMap.set(document.id, derivedProperties)
            } else {
                this.derivedPropertiesMap.get(document.id).push(...derivedProperties)
            }
        }

        // eslint-disable-next-line no-undef
        const flattenedObjects = await flattenObject(data)

        const modifiedByName = game.users.get(userId)?.name

        for (const key of Object.keys(flattenedObjects)) {
            const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

            if (!isEveryone && !isGm && !isPlayer) continue

            const templateData = {
                document1Id: (parentDocument) ? parentDocument.id : document.id,
                document2Id: (parentDocument) ? document.name : null,
                document1Name: (parentDocument) ? parentDocument.name : document.name,
                document2Name: (parentDocument) ? document.name : null,
                documentType,
                key,
                modifiedByName,
                oldValue: Utils.getValueByDotNotation(document, key),
                newValue: Utils.getValueByDotNotation(data, key)
            }

            const whisperData = {
                actor,
                isEveryone,
                isGm,
                isPlayer
            }

            this.#createChatMessage('preUpdate', templateData, whisperData)
        }
    }

    async getUpdateData (documentType, updateData) {
        const { document, userId } = updateData
        const derivedProperties = this.derivedPropertiesMap.get(document.id) ?? []

        if (!derivedProperties.length) return

        const parentDocument = (documentType !== 'actor' && document.parent?.documentName === 'Actor')
            ? document.parent
            : null
        const actor = parentDocument ?? document

        const modifiedByName = game.users.get(userId)?.name

        for (const derivedProperty of derivedProperties) {
            const { property, oldValue } = derivedProperty

            const key = Utils.getPropertyKey(property)
            const propertyDocumentType = Utils.getPropertyDocumentType(property)
            const obj = (propertyDocumentType === 'actor') ? actor : document
            const newValue = Utils.getValueByDotNotation(obj, key)

            const { isEveryone, isGm, isPlayer } = this.#getAudience(propertyDocumentType, actor.type, key)

            if (!isEveryone && !isGm && !isPlayer) continue

            const templateData = {
                document1Id: (propertyDocumentType === 'actor' && parentDocument) ? parentDocument.id : document.id,
                document2Id: (propertyDocumentType !== 'actor' && parentDocument) ? document.id : null,
                document1Name: (propertyDocumentType === 'actor' && parentDocument) ? parentDocument.name : document.name,
                document2Name: (propertyDocumentType !== 'actor' && parentDocument) ? document.name : null,
                documentType: propertyDocumentType,
                key,
                modifiedByName,
                oldValue,
                newValue
            }

            const whisperData = {
                actor,
                isEveryone,
                isGm,
                isPlayer
            }

            this.#createChatMessage('update', templateData, whisperData)
        }

        this.derivedPropertiesMap.delete(document.id)
    }

    async getDeleteData (documentType, deleteData) {
        const { document, userId } = deleteData
        const key = 'deleted'
        const parentDocument = (documentType !== 'actor' && document.parent?.documentName === 'Actor') ? document.parent : null
        const actor = parentDocument ?? document

        const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

        if (!isEveryone && !isGm && !isPlayer) return

        const templateData = {
            document1Id: (parentDocument) ? parentDocument.id : document.id,
            document2Id: (parentDocument) ? document.id : null,
            document1Name: (parentDocument) ? parentDocument.name : document.name,
            document2Name: (parentDocument) ? document.name : null,
            documentType,
            key,
            modifiedByName: game.users.get(userId)?.name,
            oldValue: null,
            newValue: true
        }

        const whisperData = {
            actor,
            isEveryone,
            isGm,
            isPlayer
        }

        this.#createChatMessage('delete', templateData, whisperData)
    }

    #getAudience (documentType, actorType, key) {
        return {
            isEveryone: (this.everyoneActorTypes.includes(actorType) && this.everyoneProperties.includes(`${documentType}.${key}`)),
            isGm: (this.gmActorTypes.includes(actorType) && this.gmProperties.includes(`${documentType}.${key}`)),
            isPlayer: this.playerProperties.includes(`${documentType}.${key}`)
        }
    }

    #getGms () {
        return game.users.filter(user => user.isGM).map(user => user.id)
    }

    #getOwners (actor) {
        return Object.entries(actor.ownership)
            .filter(([userId, ownershipLevel]) => !game.users.get(userId)?.isGM && ownershipLevel === 3)
            .map(([userId, _]) => userId)
    }

    #isNotValidChange (value) {
        if (value.oldValue === value.newValue) return true
        if ([0, null].includes(value.oldValue) && [0, null].includes(value.newValue)) return true
        return false
    }

    async #createChatMessage (changeType, templateData, whisperData) {
        const { document1Id, document2Id, document1Name, document2Name, documentType, key, oldValue, newValue, modifiedByName } = templateData
        const { actor, isEveryone, isGm, isPlayer } = whisperData

        if (this.#isNotValidChange({ oldValue, newValue })) return

        const content = await renderTemplate(
            TEMPLATE.CHAT_CARD,
            {
                document1Name,
                document2Name,
                propertyName: Utils.getPropertyName(`${documentType}.${key}`),
                oldValue: Utils.getPropertyValue(oldValue),
                newValue: Utils.getPropertyValue(newValue),
                tooltip: `<div>${game.i18n.localize('changeLog.modifiedBy')}: ${modifiedByName}</div>`
            }
        )

        const owners = this.#getOwners(actor)
        const gms = this.#getGms()

        const speaker = { alias: 'Change Log' }

        let whisper = null
        if (!isEveryone) {
            whisper = []
            if (isGm) whisper.push(...gms)
            if (isPlayer) whisper.push(...owners)
        }

        const flags =
            {
                'change-log': {
                    id1: document1Id,
                    id2: document2Id,
                    key,
                    type: documentType,
                    val: (changeType === 'preUpdate') ? oldValue : null
                }
            }

        await ChatMessage.create({ content, speaker, whisper, flags })
    }
}

async function undo (chatMessageId) {
    const chatMessage = game.messages.get(chatMessageId)
    const id1 = chatMessage?.getFlag('change-log', 'id1')
    const id2 = chatMessage?.getFlag('change-log', 'id2')
    const key = chatMessage?.getFlag('change-log', 'key')
    const type = chatMessage?.getFlag('change-log', 'type')
    const val = chatMessage?.getFlag('change-log', 'val')

    if (!id1 || val === null) return

    let doc
    switch (type) {
    case 'actor':
        doc = game.actors.get(id1)
        break
    case 'item':
        if (id2) {
            doc = game.actors.get(id1).items.get(id2)
        } else {
            doc = game.items.get(id1)
        }
    }

    if (doc) await doc.update({ [key]: val })
}
