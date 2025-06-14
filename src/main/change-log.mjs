import { DELIMITER, TEMPLATE } from "./constants.mjs";
import { DERIVED_PROPERTIES } from "./system-handler.mjs";
import { Utils } from "./utils.mjs";

export class ChangeLog {
  constructor() {
    this.derivedPropertiesMap = new Map();
  }

  /* -------------------------------------------- */

  /**
   * Initialize the ChangeLog by loading templates and settings.
   * @returns {Promise<void>}
   */
  async init() {
    Promise.all([
      loadTemplates([TEMPLATE.CHAT_CARD, TEMPLATE.TAG_FORM]),
      this.getEveryoneActorTypes(),
      this.getEveryoneProperties(),
      this.getGmActorTypes(),
      this.getGmProperties(),
      this.getPlayerProperties(),
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
    this.everyoneActorTypes = await Utils.getSetting("everyoneActorTypes")?.split(DELIMITER) ?? [];
  }

  /* -------------------------------------------- */

  /**
   * Load properties visible to everyone from settings.
   * @returns {Promise<void>}
   */
  async getEveryoneProperties() {
    this.everyoneProperties = await Utils.getSetting("everyoneProperties")?.split(DELIMITER) ?? [];
  }

  /* -------------------------------------------- */

  /**
   * Load GM actor types from settings.
   * @returns {Promise<void>}
   */
  async getGmActorTypes() {
    this.gmActorTypes = await Utils.getSetting("gmActorTypes")?.split(DELIMITER) ?? [];
  }

  /* -------------------------------------------- */

  /**
   * Load GM properties from settings.
   * @returns {Promise<void>}
   */
  async getGmProperties() {
    this.gmProperties = await Utils.getSetting("gmProperties")?.split(DELIMITER) ?? [];
  }

  /* -------------------------------------------- */

  /**
   * Load player properties from settings.
   * @returns {Promise<void>}
   */
  async getPlayerProperties() {
    this.playerProperties = await Utils.getSetting("playerProperties")?.split(DELIMITER) ?? [];
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
      id: actor.id,
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

    this.#createChatMessage("itemCreated", templateData, whisperData);
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
      id: actor.id,
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

    this.#createChatMessage("itemDeleted", templateData, whisperData);
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
      id: actor.id,
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

    this.#createChatMessage("preCreateCombatant", templateData, whisperData);
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
      const obj = (derivedProperty.split(".")[0] === "actor") ? actor : doc;
      const oldValue = Utils.getValueByDotNotation(obj, Utils.getPropertyKey(derivedProperty));
      return { property: derivedProperty, oldValue };
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

      this.#createChatMessage("preUpdate", templateData, whisperData);
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
      const { property, oldValue } = derivedProperty;

      const key = Utils.getPropertyKey(property);
      const propertyDocumentType = Utils.getPropertyDocumentType(property);
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

      this.#createChatMessage("update", templateData, whisperData);
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

    this.#createChatMessage("delete", templateData, whisperData);
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
    return {
      isEveryone: (this.everyoneActorTypes.includes(actorType) && this.everyoneProperties.includes(`${documentType}.${key}`)),
      isGm: (this.gmActorTypes.includes(actorType) && this.gmProperties.includes(`${documentType}.${key}`)),
      isPlayer: this.playerProperties.includes(`${documentType}.${key}`)
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
    return a.filter(function(item, pos) {
      return a.indexOf(item) === pos;
    });
  }

  /* -------------------------------------------- */

  /**
   * Create a chat message for a change.
   * @param {string} changeType
   * @param {object} templateData
   * @param {object} whisperData
   * @returns {Promise<void>}
   */
  async #createChatMessage(changeType, templateData, whisperData) {
    const {
      tokenId, actorId, documentId, document1Name, document2Name, documentType,
      key, oldValue, newValue, sign, adjustmentValue, modifiedByName
    } = templateData;
    const { actor, isEveryone, isGm, isPlayer } = whisperData;

    if ( !this.#isValidChange({ oldValue, newValue }) ) return;

    const content = await renderTemplate(
      TEMPLATE.CHAT_CARD,
      {
        document1Name,
        document2Name,
        propertyName: Utils.getPropertyName(`${documentType}.${key}`),
        oldValue: Utils.getPropertyValue(oldValue),
        newValue: Utils.getPropertyValue(newValue),
        sign: sign || "fa-arrow-right",
        adjustmentValue,
        tooltip: `<div>${game.i18n.localize("changeLog.modifiedBy")}: ${modifiedByName}</div>`
      }
    );

    const owners = this.#getOwners(actor);
    const gms = this.#getGms();

    const speaker = { alias: "Change Log" };

    let whisper = null;
    if ( !isEveryone ) {
      whisper = [];
      if ( isGm ) whisper.push(...gms);
      if ( isPlayer ) whisper.push(...owners);
    }
    if ( whisper ) {
      whisper = this.#uniqueArray(whisper);
    }

    const flags =
            {
              "change-log": {
                id: documentId,
                key,
                type: documentType,
                val: (changeType === "preUpdate") ? oldValue : null
              },
              "chat-tabs": {
                module: "change-log"
              }
            };
    flags["change-log"].tokenId = tokenId;
    flags["change-log"].actorId = actorId;

    await ChatMessage.create({ content, speaker, whisper, flags });
  }
}
