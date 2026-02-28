import { DELIMITER, TEMPLATE } from "./constants.mjs";
import { DERIVED_PROPERTIES } from "./system-handler.mjs";
import { Utils } from "./utils.mjs";

export class ChangeLog {
  constructor() {
    this.derivedPropertiesMap = new Map();
    this.messageBuffer = new Map();
    this.flushTimer = null;
  }

  /* -------------------------------------------- */

  /**
   * Initialize the ChangeLog by loading templates and settings.
   * @returns {Promise<void>}
   */
  async init() {
    await Promise.all([
      foundry.applications.handlebars.loadTemplates([TEMPLATE.CHAT_CARD, TEMPLATE.TAG_FORM]),
      this.getEveryoneActorTypes(),
      this.getEveryoneProperties(),
      this.getGmActorTypes(),
      this.getGmProperties(),
      this.getPlayerProperties(),
      this.getCompactMode(),
      this.getLogDestination(),
      this.getShowEquation(),
      this.getShowRecipients(),
      this.getShowSender()
    ]);
  }

  /* -------------------------------------------- */

  /**
   * Load actor types visible to everyone from settings.
   * @returns {Promise<void>}
   */
  async getEveryoneActorTypes() {
    this.everyoneActorTypes = new Set(await Utils.getSetting("everyoneActorTypes")?.split(DELIMITER) ?? []);
  }

  /* -------------------------------------------- */

  /**
   * Load properties visible to everyone from settings.
   * @returns {Promise<void>}
   */
  async getEveryoneProperties() {
    this.everyoneProperties = new Set(await Utils.getSetting("everyoneProperties")?.split(DELIMITER) ?? []);
  }

  /* -------------------------------------------- */

  /**
   * Load GM actor types from settings.
   * @returns {Promise<void>}
   */
  async getGmActorTypes() {
    this.gmActorTypes = new Set(await Utils.getSetting("gmActorTypes")?.split(DELIMITER) ?? []);
  }

  /* -------------------------------------------- */

  /**
   * Load GM properties from settings.
   * @returns {Promise<void>}
   */
  async getGmProperties() {
    this.gmProperties = new Set(await Utils.getSetting("gmProperties")?.split(DELIMITER) ?? []);
  }

  /* -------------------------------------------- */

  /**
   * Load player properties from settings.
   * @returns {Promise<void>}
   */
  async getPlayerProperties() {
    this.playerProperties = new Set(await Utils.getSetting("playerProperties")?.split(DELIMITER) ?? []);
  }

  /* -------------------------------------------- */

  /**
   * Load compactMode setting.
   * @returns {Promise<void>}
   */
  async getCompactMode() {
    this.compactMode = await Utils.getSetting("compactMode");
  }

  /* -------------------------------------------- */

  /**
   * Load logDestination setting.
   * @returns {Promise<void>}
   */
  async getLogDestination() {
    this.logDestination = await Utils.getSetting("logDestination");
    this.journalEntries = new Map();
    this.journalPages = new Map();
  }

  /* -------------------------------------------- */

  /**
   * Load showEquation setting.
   * @returns {Promise<void>}
   */
  async getShowEquation() {
    this.showEquation = await Utils.getSetting("showEquation");
  }

  /* -------------------------------------------- */

  /**
   * Load showRecipients setting.
   * @returns {Promise<void>}
   */
  async getShowRecipients() {
    this.showRecipients = await Utils.getSetting("showRecipients");
  }

  /* -------------------------------------------- */

  /**
   * Load showSender setting.
   * @returns {Promise<void>}
   */
  async getShowSender() {
    this.showSender = await Utils.getSetting("showSender");
  }

  /* -------------------------------------------- */

  /**
   * Handle item creation event for the change log.
   * @param {object} createItemData
   * @returns {Promise<void>}
   */
  async getCreateItem(createItemData) {
    const { item, userId } = createItemData;

    if ( game.userId !== userId ) return;

    const actor = game.actors.get(item?.parent?.id);

    if ( !actor ) return;

    const token = actor?.token || null;
    const documentType = "actor";
    const key = "itemCreated";
    const modifiedByName = game.users.get(userId)?.name;

    const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor?.type, key);

    if ( !isEveryone && !isGm && !isPlayer ) return;

    const templateData = {
      tokenId: token?.id || null,
      actorId: actor?.id || null,
      documentId: actor.id,
      document1Name: actor.name,
      document2Name: item.name,
      documentType,
      key,
      modifiedByName,
      oldValue: null,
      newValue: true
    };

    const whisperData = {
      actor,
      isEveryone,
      isGm,
      isPlayer
    };

    this.#queueChange("itemCreated", templateData, whisperData);
  }

  /* -------------------------------------------- */

  /**
   * Handle item deletion event for the change log.
   * @param {object} deleteItemData
   * @returns {Promise<void>}
   */
  async getDeleteItem(deleteItemData) {
    const { item, userId } = deleteItemData;

    if ( game.userId !== userId ) return;

    const actor = game.actors.get(item?.parent?.id);

    if ( !actor ) return;

    const token = actor?.token || null;
    const documentType = "actor";
    const key = "itemDeleted";
    const modifiedByName = game.users.get(userId)?.name;

    const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor?.type, key);

    if ( !isEveryone && !isGm && !isPlayer ) return;

    const templateData = {
      tokenId: token?.id || null,
      actorId: actor?.id || null,
      documentId: actor.id,
      document1Name: actor.name,
      document2Name: item.name,
      documentType,
      key,
      modifiedByName,
      oldValue: null,
      newValue: true
    };

    const whisperData = {
      actor,
      isEveryone,
      isGm,
      isPlayer
    };

    this.#queueChange("itemDeleted", templateData, whisperData, item);
  }

  /* -------------------------------------------- */

  /**
   * Handle pre-create combatant event for the change log.
   * @param {object} preCreateCombatantData
   * @returns {Promise<void>}
   */
  async getPreCreateCombatant(preCreateCombatantData) {
    const { combatant, userId } = preCreateCombatantData;

    if ( game.userId !== userId ) return;

    const actor = game.actors.get(combatant.actorId);
    const token = actor?.token || null;
    const documentType = "actor";
    const key = "inCombat";
    const modifiedByName = game.users.get(userId)?.name;

    const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor?.type, key);

    if ( !isEveryone && !isGm && !isPlayer ) return;

    const templateData = {
      tokenId: token?.id || null,
      actorId: actor?.id || null,
      documentId: actor.id,
      document1Name: actor.name,
      document2Name: null,
      documentType,
      key,
      modifiedByName,
      oldValue: actor.inCombat,
      newValue: true
    };

    const whisperData = {
      actor,
      isEveryone,
      isGm,
      isPlayer
    };

    this.#queueChange("preCreateCombatant", templateData, whisperData);
  }

  /* -------------------------------------------- */

  /**
   * Handle pre-update event for the change log.
   * @param {string} documentType
   * @param {object} preUpdateData
   * @returns {Promise<void>}
   */
  async getPreUpdateData(documentType, preUpdateData) {
    const { doc, data, userId } = preUpdateData;

    if ( game.userId !== userId ) return;

    const parentDocument = (documentType !== "actor" && doc.parent?.documentName === "Actor")
      ? doc.parent
      : null;
    const actor = parentDocument || ((documentType === "actor") ? doc : ((documentType === "token") ? (doc?.actor || null) : null));
    const token = (documentType === "token") ? doc : (actor?.token || null);

    const derivedProperties = DERIVED_PROPERTIES.map(derivedProperty => {
      const docType = Utils.getPropertyDocumentType(derivedProperty);
      const key = Utils.getPropertyKey(derivedProperty);
      const obj = (docType === "actor") ? actor : doc;
      const oldValue = Utils.getValueByDotNotation(obj, key);
      return { property: derivedProperty, docType, key, oldValue };
    });

    if ( derivedProperties.length ) {
      if ( !this.derivedPropertiesMap.has(doc.id) ) {
        this.derivedPropertiesMap.set(doc.id, derivedProperties);
      } else {
        this.derivedPropertiesMap.get(doc.id).push(...derivedProperties);
      }
    }

    const flattenedObjects = await foundry.utils.flattenObject(data);
    const objects = this.#flattenArrays(flattenedObjects, doc);
    const modifiedByName = game.users.get(userId)?.name;

    for (const key of Object.keys(objects)) {
      const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor?.type, key);

      if ( !isEveryone && !isGm && !isPlayer ) continue;

      const oldValue = Utils.getValueByDotNotation(doc, key);
      const newValue = Utils.getValueByDotNotation(data, key);

      if ( !this.#isValidChange({ oldValue, newValue }) ) continue;

      const { sign, adjustmentValue } = this.#getAdjustment(oldValue, newValue);

      const templateData = {
        tokenId: token?.id || null,
        actorId: actor?.id || null,
        documentId: doc.id,
        document1Name: (parentDocument) ? parentDocument.name : doc.name,
        document2Name: (parentDocument) ? doc.name : null,
        documentType,
        key,
        modifiedByName,
        oldValue,
        newValue,
        sign,
        adjustmentValue
      };

      const whisperData = {
        actor,
        isEveryone,
        isGm,
        isPlayer
      };

      this.#queueChange("preUpdate", templateData, whisperData);
    }
  }

  /* -------------------------------------------- */

  /**
   * Handle update event for the change log.
   * @param {string} documentType
   * @param {object} updateData
   * @returns {Promise<void>}
   */
  async getUpdateData(documentType, updateData) {
    const { doc, userId } = updateData;

    if ( game.userId !== userId ) return;

    const derivedProperties = this.derivedPropertiesMap.get(doc.id) || [];

    if ( !derivedProperties.length ) return;

    const parentDocument = (documentType !== "actor" && doc.parent?.documentName === "Actor")
      ? doc.parent
      : null;
    const actor = parentDocument || ((documentType === "actor") ? doc : null);
    const token = actor?.token || null;

    const modifiedByName = game.users.get(userId)?.name;

    for (const derivedProperty of derivedProperties) {
      const { docType: propertyDocumentType, key, oldValue } = derivedProperty;
      const obj = (propertyDocumentType === "actor") ? actor : doc;
      const newValue = Utils.getValueByDotNotation(obj, key);

      if ( !this.#isValidChange({ oldValue, newValue }) ) continue;

      const { isEveryone, isGm, isPlayer } = this.#getAudience(propertyDocumentType, actor?.type, key);

      if ( !isEveryone && !isGm && !isPlayer ) continue;

      const { sign, adjustmentValue } = this.#getAdjustment(oldValue, newValue);

      const templateData = {
        tokenId: token?.id || null,
        actorId: actor?.id || null,
        documentId: doc.id,
        document1Name: (propertyDocumentType === "actor" && parentDocument) ? parentDocument.name : doc.name,
        document2Name: (propertyDocumentType !== "actor" && parentDocument) ? doc.name : null,
        documentType: propertyDocumentType,
        key,
        modifiedByName,
        oldValue,
        newValue,
        sign,
        adjustmentValue
      };

      const whisperData = {
        actor,
        isEveryone,
        isGm,
        isPlayer
      };

      this.#queueChange("update", templateData, whisperData);
    }

    this.derivedPropertiesMap.delete(doc.id);
  }

  /* -------------------------------------------- */

  /**
   * Handle delete event for the change log.
   * @param {string} documentType
   * @param {object} deleteData
   * @returns {Promise<void>}
   */
  async getDeleteData(documentType, deleteData) {
    const { doc, userId } = deleteData;

    if ( game.userId !== userId ) return;

    const key = "deleted";
    const parentDocument = (documentType !== "actor" && doc.parent?.documentName === "Actor") ? doc.parent : null;
    const actor = parentDocument || ((documentType === "actor") ? doc : null);
    const token = actor.token || null;

    const { isEveryone, isGm, isPlayer } = this.#getAudience(documentType, actor?.type, key);

    if ( !isEveryone && !isGm && !isPlayer ) return;

    const templateData = {
      tokenId: token?.id || null,
      actorId: actor?.id || null,
      documentId: doc.id,
      document1Name: (parentDocument) ? parentDocument.name : doc.name,
      document2Name: (parentDocument) ? doc.name : null,
      documentType,
      key,
      modifiedByName: game.users.get(userId)?.name,
      oldValue: null,
      newValue: true
    };

    const whisperData = {
      actor,
      isEveryone,
      isGm,
      isPlayer
    };

    this.#queueChange("delete", templateData, whisperData);
  }

  /* -------------------------------------------- */

  /**
   * Flattens array and set properties in an object for change tracking.
   * @param {object} obj
   * @param {object} doc
   * @returns {object}
   */
  #flattenArrays(obj, doc) {
    for (const [key, value] of Object.entries(obj)) {
      if ( Array.isArray(value) ) {
        for (const arrayValue of value) {
          if ( typeof arrayValue === "string" ) {
            obj[`${key}.${arrayValue}`] = true;
          }
        }

        // Get array/set properties from the document to identify ones removed
        const docValue = Array.from(foundry.utils.getProperty(doc, key) ?? []);
        for (const arrayValue of docValue) {
          if ( typeof arrayValue === "string" ) {
            if ( !obj[`${key}.${arrayValue}`] ) {
              obj[`${key}.${arrayValue}`] = false;
            }
          }
        }
      }
    }

    return obj;
  }

  /* -------------------------------------------- */

  /**
   * Get adjustment sign and value for numeric changes.
   * @param {*} oldValue
   * @param {*} newValue
   * @returns {{sign: string|null, adjustmentValue: number|null}}
   */
  #getAdjustment(oldValue, newValue) {
    if ( !this.showEquation ) return { sign: null, adjustmentValue: null };
    const difference = (Number.isInteger(oldValue) && Number.isInteger(newValue)) ? oldValue - newValue : null;
    const sign = (Number.isInteger(difference)) ? (difference < 0) ? "fa-plus" : "fa-minus" : null;
    const adjustmentValue = (Number.isInteger(difference)) ? Math.abs(difference) : null;
    return { sign, adjustmentValue };
  }

  /* -------------------------------------------- */

  /**
   * Determine the audience for a change based on document and property.
   * @param {string} documentType
   * @param {string} actorType
   * @param {string} key
   * @returns {{isEveryone: boolean, isGm: boolean, isPlayer: boolean}}
   */
  #getAudience(documentType, actorType, key) {
    const property = `${documentType}.${key}`;
    return {
      isEveryone: (this.everyoneActorTypes.has(actorType) && this.everyoneProperties.has(property)),
      isGm: (this.gmActorTypes.has(actorType) && this.gmProperties.has(property)),
      isPlayer: this.playerProperties.has(property)
    };
  }

  /* -------------------------------------------- */

  /**
   * Get all GM user IDs.
   * @returns {string[]}
   */
  #getGms() {
    return game.users.filter(user => user.isGM).map(user => user.id);
  }

  /* -------------------------------------------- */

  /**
   * Get all owner user IDs for an actor (excluding GMs).
   * @param {Actor} actor
   * @returns {string[]}
   */
  #getOwners(actor) {
    return Object.entries(actor.ownership)
      .filter(([userId, ownershipLevel]) => !game.users.get(userId)?.isGM && ownershipLevel === 3)
      .map(([userId, _]) => userId);
  }

  /* -------------------------------------------- */

  /**
   * Build an HTML snippet from a group of changes for journal logging.
   * @param {object} group
   * @returns {string}
   */
  #buildJournalHtml(group) {
    const { document1Name, modifiedByName, changes } = group;
    const time = new Date().toLocaleTimeString("en-GB");
    const sanitize = str => String(str ?? "").replace(/<i ([^>]*)><\/i>/g, "<span $1>\u200b</span>").replace(/<(?!\/?span\b)[^>]*>/g, "");
    const arrow = '<span class="fa fa-arrow-right">\u200b</span>';

    let html = `<p><strong>${time}</strong> ${document1Name} <em>(modified by ${modifiedByName})</em></p>\n<ul>\n`;
    for ( const change of changes ) {
      const prefix = change.document2Name ? `${change.document2Name} · ` : "";
      const name = sanitize(change.propertyName);
      if ( change.oldValue !== null ) {
        html += `<li>${prefix}${name}: ${sanitize(change.oldValue)} ${arrow} ${sanitize(change.newValue)}</li>\n`;
      } else {
        html += `<li>${prefix}${name}: ${sanitize(change.newValue)}</li>\n`;
      }
    }
    html += "</ul>\n";
    return html;
  }

  /* -------------------------------------------- */

  /**
   * Log a group of changes to the appropriate journal entries based on audience.
   * If the current user is not a GM, emit via socket for the GM to handle.
   * @param {object} group
   * @returns {Promise<void>}
   */
  async #logToJournal(group) {
    const html = this.#buildJournalHtml(group);
    const { isEveryone, isGm, isPlayer, owners } = group;

    const targets = [];
    if ( isEveryone ) targets.push({ journalName: "Change Log", ownership: { default: 3 } });
    if ( isGm ) targets.push({ journalName: "Change Log (GM)", ownership: { default: 0 } });
    if ( isPlayer ) {
      for ( const ownerId of owners ) {
        const playerName = game.users.get(ownerId)?.name;
        if ( playerName ) targets.push({ journalName: `Change Log (${playerName})`, ownership: { default: 0, [ownerId]: 3 } });
      }
    }

    for ( const { journalName, ownership } of targets ) {
      if ( game.user.isGM ) {
        await ChangeLog.writeToJournal(journalName, html, ownership);
      } else {
        game.socket.emit("module.change-log", { action: "logToJournal", journalName, html, ownership });
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Write an HTML snippet to a named journal entry.
   * Finds or creates the journal and today's page, then appends the HTML.
   * @param {string} journalName The journal name.
   * @param {string} html The HTML to append.
   * @param {object} [ownership] Ownership data used when creating a new journal entry.
   * @returns {Promise<void>}
   */
  static async writeToJournal(journalName, html, ownership = {}) {
    const changeLog = game.changeLog;

    // Find or create the journal entry
    let journalEntry = changeLog.journalEntries.get(journalName);
    if ( !journalEntry ) {
      journalEntry = game.journal.getName(journalName)
        ?? await JournalEntry.create({ name: journalName, ownership });
      changeLog.journalEntries.set(journalName, journalEntry);
    }

    // Find or create today's page
    const today = new Date().toLocaleDateString("en-CA");
    const pageKey = `${journalName}|${today}`;
    let page = changeLog.journalPages.get(pageKey);
    if ( !page ) {
      page = journalEntry.pages.find(p => p.name === today)
        ?? await journalEntry.createEmbeddedDocuments("JournalEntryPage", [
          { name: today, type: "text", text: { content: "" } }
        ]).then(pages => pages[0]);
      changeLog.journalPages.set(pageKey, page);
    }

    // Append to existing page content
    const existing = page.text.content ?? "";
    await page.update({ "text.content": existing + html });
  }

  /* -------------------------------------------- */

  /**
   * Determine if a change is valid for logging.
   * @param {{oldValue: *, newValue: *}} value
   * @returns {boolean}
   */
  #isValidChange(value) {
    if ( value.oldValue === value.newValue ) return false;
    if ( [0, null].includes(value.oldValue) && [0, null].includes(value.newValue) ) return false;
    return true;
  }

  /* -------------------------------------------- */

  /**
   * Return a unique array.
   * @param {Array} a
   * @returns {Array}
   */
  #uniqueArray(a) {
    return [...new Set(a)];
  }

  /* -------------------------------------------- */

  /**
   * Queue a change for batched chat message creation.
   * @param {string} changeType
   * @param {object} templateData
   * @param {object} whisperData
   * @param {object} [entity=null] Optional entity data to include in the message flags.
   */
  #queueChange(changeType, templateData, whisperData, entity = null) {
    const {
      tokenId, actorId, documentId, document1Name, document2Name, documentType,
      key, oldValue, newValue, sign, adjustmentValue, modifiedByName
    } = templateData;
    const { actor, isEveryone, isGm, isPlayer } = whisperData;

    if ( !this.#isValidChange({ oldValue, newValue }) ) return;

    const owners = this.#getOwners(actor);
    const gms = this.#getGms();

    let whisper = null;
    if ( !isEveryone ) {
      whisper = [];
      if ( isGm ) whisper.push(...gms);
      if ( isPlayer ) whisper.push(...owners);
    }
    if ( whisper ) {
      whisper = this.#uniqueArray(whisper);
    }

    const bufferKey = `${document1Name}|${JSON.stringify(whisper)}`;

    if ( !this.messageBuffer.has(bufferKey) ) {
      this.messageBuffer.set(bufferKey, {
        document1Name,
        modifiedByName,
        whisper,
        isEveryone,
        isGm,
        isPlayer,
        owners,
        changes: []
      });
    }

    const eventKeys = ["itemCreated", "itemDeleted", "deleted", "inCombat"];
    const isEvent = eventKeys.includes(key);

    const group = this.messageBuffer.get(bufferKey);
    group.changes.push({
      document2Name,
      propertyName: Utils.getPropertyName(`${documentType}.${key}`),
      oldValue: isEvent ? null : Utils.getPropertyValue(oldValue),
      newValue: Utils.getPropertyValue(newValue),
      sign: sign || "fa-arrow-right",
      adjustmentValue,
      actorId,
      tokenId,
      id: documentId,
      key,
      type: documentType,
      val: (changeType === "preUpdate") ? oldValue : null,
      entityData: entity || null
    });

    if ( this.flushTimer ) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => this.#flushBuffer(), 250);
  }

  /* -------------------------------------------- */

  /**
   * Flush the message buffer, creating grouped ChatMessages and/or journal entries.
   * @returns {Promise<void>}
   */
  async #flushBuffer() {
    this.flushTimer = null;
    const buffer = new Map(this.messageBuffer);
    this.messageBuffer.clear();
    const logToChat = this.logDestination === "chat" || this.logDestination === "both";
    const logToJournal = this.logDestination === "journal" || this.logDestination === "both";

    for ( const [, group] of buffer ) {
      const { document1Name, modifiedByName, whisper, changes } = group;

      if ( logToChat ) {
        const templateChanges = changes.map(change => ({
          document2Name: change.document2Name,
          propertyName: change.propertyName,
          oldValue: change.oldValue,
          newValue: change.newValue,
          sign: change.sign,
          adjustmentValue: change.adjustmentValue
        }));

        const content = await foundry.applications.handlebars.renderTemplate(
          TEMPLATE.CHAT_CARD,
          {
            document1Name,
            tooltip: `<div>${game.i18n.localize("changeLog.modifiedBy")}: ${modifiedByName}</div>`,
            compactMode: this.compactMode,
            changes: templateChanges
          }
        );

        const flagChanges = changes.map(change => {
          const flagChange = {
            actorId: change.actorId,
            tokenId: change.tokenId,
            id: change.id,
            key: change.key,
            type: change.type,
            val: change.val
          };
          if ( change.entityData ) flagChange.entityData = change.entityData;
          return flagChange;
        });

        const flags = {
          "change-log": {
            changes: flagChanges
          },
          "chat-tabs": {
            module: "change-log"
          }
        };

        const speaker = { alias: "Change Log" };

        await ChatMessage.create({ content, speaker, whisper, flags });
      }

      if ( logToJournal ) {
        await this.#logToJournal(group);
      }
    }
  }
}
