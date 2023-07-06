import { DELIMITER, TEMPLATE } from './constants.js'
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

Hooks.on('preDeleteActiveEffect', async (activeEffect, data, userId) => {
    await game.changeLog.getDeleteData('activeEffect', { document: activeEffect, data, userId })
})

Hooks.on('preUpdateActor', async (actor, data, options, userId) => {
    await game.changeLog.getPreUpdateData('actor', { document: actor, data, options, userId })
})

Hooks.on('preUpdateItem', async (item, data, options, userId) => {
    await game.changeLog.getPreUpdateData('item', { document: item, data, options, userId })
})

Hooks.on('renderChatMessage', async (chatMessage, html) => {
    if (!chatMessage.flags.changeLog) return
    if (chatMessage.whisper.length && !chatMessage.whisper.includes(game.user.id)) { html.css('display', 'none') }
    if (!game.changeLog.showRecipients) { html.find('.whisper-to')?.remove() }
})

export class ChangeLog {
    async init () {
        Promise.all([
            loadTemplates([TEMPLATE.CHAT_CARD]),
            this.getEveryoneActorTypes(),
            this.getEveryoneProperties(),
            this.getGmActorTypes(),
            this.getGmProperties(),
            this.getPlayerProperties(),
            this.getShowRecipients()
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

    async getPreUpdateData (documentType, preUpdateData) {
        const { document, data, options, userId } = preUpdateData

        const parentDocument = (documentType !== 'actor' && document.parent?.documentName === 'Actor')
            ? document.parent
            : null
        const actor = parentDocument ?? document

        // eslint-disable-next-line no-undef
        const flattenedObjects = await flattenObject(data)

        const modifiedByName = game.users.get(userId)?.name

        for (const key of Object.keys(flattenedObjects)) {
            const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

            if (!isEveryone && !isGm && !isPlayer) continue

            const templateData = {
                document1Name: (parentDocument) ? parentDocument.name : document.name,
                document2Name: (parentDocument) ? document.name : null,
                propertyKey: `${documentType}.${key}`,
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

            this.#createChatMessage(templateData, whisperData)
        }
    }

    async getDeleteData (documentType, deleteData) {
        const { document, userId } = deleteData
        const key = 'deleted'
        const parentDocument = (documentType !== 'actor' && document.parent?.documentName === 'Actor') ? document.parent : null
        const actor = parentDocument ?? document

        const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor.type, key)

        if (!isEveryone && !isGm && !isPlayer) return

        const templateData = {
            document1Name: (parentDocument) ? parentDocument.name : document.name,
            document2Name: (parentDocument) ? document.name : null,
            propertyKey: `${documentType}.${key}`,
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

        this.#createChatMessage(templateData, whisperData)
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

    async #createChatMessage (templateData, whisperData) {
        const { document1Name, document2Name, propertyKey, oldValue, newValue, modifiedByName } = templateData
        const { actor, isEveryone, isGm, isPlayer } = whisperData

        if (this.#isNotValidChange({ oldValue, newValue })) return

        const content = await renderTemplate(
            TEMPLATE.CHAT_CARD,
            {
                document1Name,
                document2Name,
                property: Utils.getChangeProperty(propertyKey),
                oldValue: Utils.getChangeValue(oldValue),
                newValue: Utils.getChangeValue(newValue),
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

        await ChatMessage.create({ content, speaker, whisper, flags: { changeLog: true } })
    }
}
