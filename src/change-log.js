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
    await game.changeLog.getPreUpdateData('activeEffect', { doc: activeEffect, data, options, userId })
})

Hooks.on('preDeleteActiveEffect', async (activeEffect, data, userId) => {
    await game.changeLog.getDeleteData('activeEffect', { doc: activeEffect, data, userId })
})

Hooks.on('preUpdateActor', async (actor, data, options, userId) => {
    await game.changeLog.getPreUpdateData('actor', { doc: actor, data, options, userId })
})

Hooks.on('preUpdateItem', async (item, data, options, userId) => {
    await game.changeLog.getPreUpdateData('item', { doc: item, data, options, userId })
})

Hooks.on('preUpdateToken', async (token, data, options, userId) => {
    await game.changeLog.getPreUpdateData('token', { doc: token, data, options, userId })
})

Hooks.on('updateActor', async (actor, data, options, userId) => {
    if (game.userId !== data._stats?.lastModifiedBy) return
    await game.changeLog.getUpdateData('actor', { doc: actor, data, options, userId })
})

Hooks.on('updateItem', async (item, data, options, userId) => {
    if (game.userId !== data._stats?.lastModifiedBy) return
    await game.changeLog.getUpdateData('item', { doc: item, data, options, userId })
})

Hooks.on('renderChatMessage', async (chatMessage, html) => {
    if (!chatMessage.getFlag('change-log', 'key')) return
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
        const token = (actor) ? (actor.token ?? null) : null
        const documentType = 'actor'
        const key = 'inCombat'
        const modifiedByName = game.users.get(userId)?.name

        const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

        if (!isEveryone && !isGm && !isPlayer) return

        const templateData = {
            tokenId: token?.id ?? null,
            actorId: actor.id ?? null,
            id: actor.id,
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
        const { doc, data, userId } = preUpdateData

        const parentDocument = (documentType !== 'actor' && doc.parent?.documentName === 'Actor')
            ? doc.parent
            : null
        const actor = parentDocument ?? ((documentType === 'actor') ? doc : ((documentType === 'token') ? (doc?.actor ?? null) : null))
        const token = (documentType === 'token') ? doc : ((actor) ? (actor.token ?? null) : null)

        const derivedProperties = DERIVED_PROPERTIES.map(derivedProperty => {
            const obj = (derivedProperty.split('.')[0] === 'actor') ? actor : doc
            const oldValue = Utils.getValueByDotNotation(obj, Utils.getPropertyKey(derivedProperty))
            return { property: derivedProperty, oldValue }
        })

        if (derivedProperties.length) {
            if (!this.derivedPropertiesMap.has(doc.id)) {
                this.derivedPropertiesMap.set(doc.id, derivedProperties)
            } else {
                this.derivedPropertiesMap.get(doc.id).push(...derivedProperties)
            }
        }

        // eslint-disable-next-line no-undef
        const flattenedObjects = await flattenObject(data)

        const modifiedByName = game.users.get(userId)?.name

        for (const key of Object.keys(flattenedObjects)) {
            const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

            if (!isEveryone && !isGm && !isPlayer) continue

            const templateData = {
                tokenId: token?.id ?? null,
                actorId: actor?.id ?? null,
                documentId: doc.id,
                document1Name: (parentDocument) ? parentDocument.name : doc.name,
                document2Name: (parentDocument) ? doc.name : null,
                documentType,
                key,
                modifiedByName,
                oldValue: Utils.getValueByDotNotation(doc, key),
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
        const { doc, userId } = updateData
        const derivedProperties = this.derivedPropertiesMap.get(doc.id) ?? []

        if (!derivedProperties.length) return

        const parentDocument = (documentType !== 'actor' && document.parent?.documentName === 'Actor')
            ? doc.parent
            : null
        const actor = parentDocument ?? ((documentType === 'actor') ? doc : null)
        const token = (actor) ? (actor.token ?? null) : null

        const modifiedByName = game.users.get(userId)?.name

        for (const derivedProperty of derivedProperties) {
            const { property, oldValue } = derivedProperty

            const key = Utils.getPropertyKey(property)
            const propertyDocumentType = Utils.getPropertyDocumentType(property)
            const obj = (propertyDocumentType === 'actor') ? actor : doc
            const newValue = Utils.getValueByDotNotation(obj, key)

            const { isEveryone, isGm, isPlayer } = this.#getAudience(propertyDocumentType, actor.type, key)

            if (!isEveryone && !isGm && !isPlayer) continue

            const templateData = {
                tokenId: token?.id ?? null,
                actorId: actor?.id ?? null,
                documentId: doc.id,
                document1Name: (propertyDocumentType === 'actor' && parentDocument) ? parentDocument.name : doc.name,
                document2Name: (propertyDocumentType !== 'actor' && parentDocument) ? doc.name : null,
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

        this.derivedPropertiesMap.delete(doc.id)
    }

    async getDeleteData (documentType, deleteData) {
        const { doc, userId } = deleteData
        const key = 'deleted'
        const parentDocument = (documentType !== 'actor' && doc.parent?.documentName === 'Actor') ? doc.parent : null
        const actor = parentDocument ?? ((documentType === 'actor') ? doc : null)
        const token = (actor) ? (actor.token ?? null) : null

        const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

        if (!isEveryone && !isGm && !isPlayer) return

        const templateData = {
            tokenId: token?.id ?? null,
            actorId: actor?.id ?? null,
            documentId: doc.id,
            document1Name: (parentDocument) ? parentDocument.name : doc.name,
            document2Name: (parentDocument) ? doc.name : null,
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
        const { tokenId, actorId, documentId, document1Name, document2Name, documentType, key, oldValue, newValue, modifiedByName } = templateData
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
                    id: documentId,
                    key,
                    type: documentType,
                    val: (changeType === 'preUpdate') ? oldValue : null
                }
            }
        flags['change-log'].tokenId = tokenId
        flags['change-log'].actorId = actorId

        await ChatMessage.create({ content, speaker, whisper, flags })
    }
}

async function undo (chatMessageId) {
    const chatMessage = game.messages.get(chatMessageId)
    const tokenId = chatMessage?.getFlag('change-log', 'tokenId')
    const actorId = chatMessage?.getFlag('change-log', 'actorId')
    const id = chatMessage?.getFlag('change-log', 'id')
    const key = chatMessage?.getFlag('change-log', 'key')
    const type = chatMessage?.getFlag('change-log', 'type')
    const val = chatMessage?.getFlag('change-log', 'val')

    if (!id || val === null) return

    const token = (tokenId) ? game.scenes.map(scene => scene.tokens.find(token => token.id === tokenId)).filter(token => !!token)[0] : null
    const actor = (token) ? token.actor : (actorId) ? game.actors.get(actorId) : null

    let doc
    switch (type) {
    case 'actor':
        doc = actor
        break
    case 'item':
        if (actor) {
            doc = actor?.items.get(id)
        } else {
            doc = game.items.get(id)
        }
        break
    case 'token':
        doc = token
    }

    if (doc) await doc.update({ [key]: val })
}
