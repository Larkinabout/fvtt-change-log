import { MODULE } from './constants.js'
import { registerSettings } from './settings.js'
import { Utils } from './utils.js'
import { ChangeLog } from './change-log.js'

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

Hooks.on('chat-tabs.init', () => {
    const data = {
        key: 'change-log',
        label: 'Change Log',
        hint: game.i18n.localize('changeLog.chatTabs.hint')
    }
    game.chatTabs.register(data)
})

Hooks.on('getChatLogEntryContext', async (html, menuItems) => {
    const menuItem = {
        name: 'Undo Change',
        icon: '<i class="fas fa-rotate-left"></i>',
        condition: li => {
            const message = game.messages.get(li.data('messageId'))
            const val = message.getFlag('change-log', 'val')
            return val !== null && val !== undefined
        },
        callback: li => {
            undo(li.data('messageId'))
        }
    }

    menuItems.push(menuItem)
})

Hooks.on('createItem', async (item, options, userId) => {
    await game.changeLog.getCreateItem({ item, options, userId })
})

Hooks.on('deleteItem', async (item, options, userId) => {
    await game.changeLog.getDeleteItem({ item, options, userId })
})

Hooks.on('preCreateCombatant', async (combatant, data, options, userId) => {
    await game.changeLog.getPreCreateCombatant({ combatant, data, options, userId })
})

Hooks.on('preDeleteActiveEffect', async (activeEffect, data, userId) => {
    await game.changeLog.getDeleteData('activeEffect', { doc: activeEffect, data, userId })
})

Hooks.on('preUpdateActiveEffect', async (activeEffect, data, options, userId) => {
    await game.changeLog.getPreUpdateData('activeEffect', { doc: activeEffect, data, options, userId })
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

async function undo (chatMessageId) {
    const chatMessage = game.messages.get(chatMessageId)
    const { tokenId, actorId, id, key, type, val } = chatMessage?.flags['change-log']

    if (!id || val === null) return

    const token = (tokenId) ? game.scenes.map(scene => scene.tokens.find(token => token.id === tokenId)).filter(token => !!token)[0] : null
    const actor = (token) ? token.actor : (actorId) ? game.actors.get(actorId) : null

    let doc
    switch (type) {
    case 'actor':
        doc = actor
        break
    case 'item':
        doc = (actor) ? actor?.items.get(id) : game.items.get(id)
        break
    case 'token':
        doc = token
        break
    }

    if (doc) await doc.update({ [key]: val })
}
