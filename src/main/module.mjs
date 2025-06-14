import { MODULE } from "./constants.mjs";
import { registerSettings } from "./settings.mjs";
import { Utils } from "./utils.mjs";
import { ChangeLog } from "./change-log.mjs";

/**
 * Initialize the module, register settings, and expose API.
 */
Hooks.on("init", () => {
  registerSettings();
  game.changeLog = new ChangeLog();
  game.changeLog.init();

  const module = game.modules.get(MODULE.ID);
  module.api = {
    undo,
    Utils
  };
});

/* -------------------------------------------- */

/**
 * Register the Change Log tab in chat-tabs.
 */
Hooks.on("chat-tabs.init", () => {
  const data = {
    key: "change-log",
    label: "Change Log",
    hint: game.i18n.localize("changeLog.chatTabs.hint")
  };
  game.chatTabs.register(data);
});

/* -------------------------------------------- */

/**
 * Add "Undo Change" context menu item to chat log entries.
 * @param {HTML} html The chat log HTML.
 * @param {Array} menuItems The context menu items.
 */
Hooks.on("getChatMessageContextOptions", async (html, menuItems) => {
  const menuItem = {
    name: "Undo Change",
    icon: '<i class="fa-solid fa-rotate-left"></i>',
    condition: li => {
      if ( !li.dataset.messageId ) return false;
      const message = game.messages.get(li.dataset.messageId);
      const val = message.getFlag("change-log", "val");
      return val !== null && val !== undefined;
    },
    callback: li => {
      undo(li.dataset.messageId);
    }
  };

  menuItems.push(menuItem);
});

/* -------------------------------------------- */

/**
 * Handle item creation for change log.
 * @param {Item} item
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("createItem", async (item, options, userId) => {
  await game.changeLog.getCreateItem({ item, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle item deletion for change log.
 * @param {Item} item
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("deleteItem", async (item, options, userId) => {
  await game.changeLog.getDeleteItem({ item, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle pre-creation of combatant for change log.
 * @param {Combatant} combatant
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("preCreateCombatant", async (combatant, data, options, userId) => {
  await game.changeLog.getPreCreateCombatant({ combatant, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle pre-deletion of active effect for change log.
 * @param {ActiveEffect} activeEffect
 * @param {object} data
 * @param {string} userId
 */
Hooks.on("preDeleteActiveEffect", async (activeEffect, data, userId) => {
  await game.changeLog.getDeleteData("activeEffect", { doc: activeEffect, data, userId });
});

/* -------------------------------------------- */

/**
 * Handle pre-update of active effect for change log.
 * @param {ActiveEffect} activeEffect
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("preUpdateActiveEffect", async (activeEffect, data, options, userId) => {
  await game.changeLog.getPreUpdateData("activeEffect", { doc: activeEffect, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle pre-update of actor for change log.
 * @param {Actor} actor
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("preUpdateActor", async (actor, data, options, userId) => {
  await game.changeLog.getPreUpdateData("actor", { doc: actor, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle pre-update of item for change log.
 * @param {Item} item
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("preUpdateItem", async (item, data, options, userId) => {
  await game.changeLog.getPreUpdateData("item", { doc: item, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle pre-update of token for change log.
 * @param {Token} token
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("preUpdateToken", async (token, data, options, userId) => {
  await game.changeLog.getPreUpdateData("token", { doc: token, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle actor update for change log.
 * @param {Actor} actor
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("updateActor", async (actor, data, options, userId) => {
  if ( game.userId !== data._stats?.lastModifiedBy ) return;
  await game.changeLog.getUpdateData("actor", { doc: actor, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Handle item update for change log.
 * @param {Item} item
 * @param {object} data
 * @param {object} options
 * @param {string} userId
 */
Hooks.on("updateItem", async (item, data, options, userId) => {
  if ( game.userId !== data._stats?.lastModifiedBy ) return;
  await game.changeLog.getUpdateData("item", { doc: item, data, options, userId });
});

/* -------------------------------------------- */

/**
 * Render chat message for change log, hiding or modifying elements as needed.
 * @param {ChatMessage} chatMessage
 * @param {JQuery} html
 */
Hooks.on("renderChatMessageHTML", async (chatMessage, html, options) => {
  if ( !chatMessage.getFlag("change-log", "key") ) return;
  if ( chatMessage.whisper.length && !chatMessage.whisper.includes(game.user.id) ) { html.css("display", "none"); }
  if ( !game.changeLog.showRecipients ) { html.querySelector(".whisper-to")?.remove(); }
  if ( !game.changeLog.showSender ) {
    html.querySelector(".message-sender")?.remove();
    html.style.position = "relative";
    const messageHeader = html.querySelector(".message-header");
    if ( messageHeader ) {
      messageHeader.style.position = "absolute";
      messageHeader.style.right = "6px";
    }
  }
});

/* -------------------------------------------- */

/**
 * Render DnD5e chat message for change log, hiding recipients if needed.
 * @param {ChatMessage} chatMessage
 * @param {HTMLElement} html
 */
Hooks.on("dnd5e.renderChatMessage", async (chatMessage, html) => {
  if ( !chatMessage.getFlag("change-log", "key") ) return;
  if ( !game.changeLog.showRecipients ) { html.querySelector("span.subtitle")?.remove(); }
});

/* -------------------------------------------- */

/**
 * Undo a change based on a chat message ID.
 * @param {string} chatMessageId The ID of the chat message to undo.
 * @returns {Promise<void>}
 */
async function undo(chatMessageId) {
  const chatMessage = game.messages.get(chatMessageId);
  if ( !chatMessage || !chatMessage.flags || !chatMessage.flags["change-log"] ) return;
  const { tokenId, actorId, id, key, type, val } = chatMessage.flags["change-log"];

  if ( !id || val === null ) return;

  const token = (tokenId)
    ? game.scenes.map(scene => scene.tokens.find(token => token.id === tokenId)).filter(token => !!token)[0]
    : null;
  const actor = (token) ? token.actor : (actorId) ? game.actors.get(actorId) : null;

  let doc;
  switch (type) {
    case "actor":
      doc = actor;
      break;
    case "item":
      doc = (actor) ? actor?.items.get(id) : game.items.get(id);
      break;
    case "token":
      doc = token;
      break;
  }

  if ( !doc ) return;

  let updateKey = key;
  let updateValue = val;
  const dataType = Utils.getTypeByDotNotation(doc, key);

  if ( dataType === "array" || dataType === "set" ) {
    const arrayValue = key.split(".").pop();
    updateKey = key.split(".").slice(0, -1).join(".");
    const arr = Array.from(Utils.getValueByDotNotation(doc, updateKey));
    if ( val ) {
      arr.push(arrayValue);
    } else {
      const index = arr.findIndex(a => a === arrayValue);
      arr.splice(index, 1);
    }
    updateValue = arr;
  }

  await doc.update({ [updateKey]: updateValue });
}
