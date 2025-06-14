import { BOOLEAN_ICON, EMPTY_ICON, MODULE } from "./constants.mjs";

/**
 * Console logger
 */
export class Logger {
  /**
   * Log an info message to the console or as a notification.
   * @param {string} message The message to log.
   * @param {boolean} [notify=false] Whether to show as notification.
   */
  static info(message, notify = false) {
    if ( notify ) ui.notifications.info(`${MODULE.NAME} | ${message}`);
    else console.log(`${MODULE.NAME} Info | ${message}`);
  }

  /* -------------------------------------------- */

  /**
   * Log an error message to the console or as a notification.
   * @param {string} message The message to log.
   * @param {boolean} [notify=false] Whether to show as notification.
   */
  static error(message, notify = false) {
    if ( notify ) ui.notifications.error(`${MODULE.NAME} | ${message}`);
    else console.error(`${MODULE.NAME} Error | ${message}`);
  }

  /* -------------------------------------------- */

  /**
   * Log a debug message to the console if debug is enabled.
   * @param {string} message The message to log.
   * @param {*} [data] Optional data to log.
   */
  static debug(message, data) {
    const isDebug = false;
    if ( isDebug ) {
      if ( !data ) {
        console.log(`${MODULE.NAME} Debug | ${message}`);
        return;
      }
      const dataClone = Utils.deepClone(data);
      console.log(`${MODULE.NAME} Debug | ${message}`, dataClone);
    }
  }
}

/* -------------------------------------------- */

/**
 * Utility functions for the module.
 */
export class Utils {
  /**
   * Get a display value for a property, including icons for booleans and empty values.
   * @param {*} value
   * @returns {*}
   */
  static getPropertyValue(value) {
    if ( [true, false].includes(value) ) return BOOLEAN_ICON[value];
    if ( value === null || value === undefined ) return EMPTY_ICON;
    if ( typeof value === "number" && value - Math.floor(value) !== 0 ) return Math.round(value * 10) / 10;
    return value;
  }

  /* -------------------------------------------- */

  /**
   * Get the localized property name for a key.
   * @param {string} key
   * @returns {string}
   */
  static getPropertyName(key) {
    let label;
    label = game.i18n.localize(`changeLog.${game.system.id}.${key}`);
    if ( label.startsWith("changeLog") ) {
      label = game.i18n.localize(`changeLog.${game.system.id}.${key}.value`);
    }
    return (!label.startsWith("changeLog")) ? label : key;
  }

  /* -------------------------------------------- */

  /**
   * Get the document type from a property string.
   * @param {string} property
   * @returns {string}
   */
  static getPropertyDocumentType(property) {
    return property.split(".")[0];
  }

  /* -------------------------------------------- */

  /**
   * Get the property key (without document type) from a property string.
   * @param {string} property
   * @returns {string}
   */
  static getPropertyKey(property) {
    return property.split(".").slice(1).join(".");
  }

  /* -------------------------------------------- */

  /**
   * Get the type of a property by dot notation.
   * @param {object} object
   * @param {string} key
   * @returns {string|undefined}
   */
  static getTypeByDotNotation(object, key) {
    if ( !key || !object ) return undefined;
    if ( key in object ) return object[key];
    let target = object;
    for (const p of key.split(".")) {
      if ( !target || (typeof target !== "object") ) return undefined;
      if ( p in target ) target = target[p];
      else if ( Array.isArray(target) ) return "array";
      else if ( target instanceof Set ) return "set";
      else return undefined;
    }
    return typeof target;
  }

  /* -------------------------------------------- */

  /**
   * Get the value of a property by dot notation.
   * @param {object} object
   * @param {string} key
   * @returns {*}
   */
  static getValueByDotNotation(object, key) {
    if ( !key || !object ) return undefined;
    if ( key in object ) return object[key];
    let target = object;
    for (const p of key.split(".")) {
      if ( !target || (typeof target !== "object") ) return undefined;
      if ( p in target ) target = target[p];
      else if ( Array.isArray(target) ) return target.includes(p);
      else if ( target instanceof Set ) return target.has(p);
      else return undefined;
    }
    return target;
  }

  /* -------------------------------------------- */

  /**
   * Foundry VTT's deepClone function wrapped here to avoid code error highlighting due to missing definition.
   * @public
   * @param {*} original
   * @param {*} options
   * @returns {*}
   */
  static deepClone(original, options) {
    return deepClone(original, options);
  }

  /* -------------------------------------------- */

  /**
   * Get active tab
   * @returns {string|null} The active tab
   */
  static getActiveTab() {
    if ( ui.sidebar ) {
      return ui.sidebar.activeTab;
    } else {
      return null;
    }
  }

  /* -------------------------------------------- */

  /**
   * Get html element by ID
   * @param {string} elementId The element ID
   * @returns {HTMLElement|null} The html element
   */
  static getElementById(elementId) {
    return document.querySelector(`#${elementId}`);
  }

  /* -------------------------------------------- */

  /**
   * Get html element by selector
   * @param {string} selector The selector
   * @returns {HTMLElement|null} The html element
   */
  static getElementBySelector(selector) {
    return document.querySelector(selector);
  }

  /* -------------------------------------------- */

  /**
   * Get setting value
   * @public
   * @param {string} key               The setting key
   * @param {*} [defaultValue=null]    The setting default value
   * @returns {*}                      The setting value
   */
  static getSetting(key, defaultValue = null) {
    let value = defaultValue ?? null;
    try {
      value = game.settings.get(MODULE.ID, key);
    } catch {
      Logger.debug(`Setting '${key}' not found`);
    }
    return value;
  }

  /* -------------------------------------------- */

  /**
   * Set setting value
   * @public
   * @param {string} key   The setting key
   * @param {*} value      The setting value
   * @returns {Promise<void>}
   */
  static async setSetting(key, value) {
    if ( game.settings.settings.get(`${MODULE.ID}.${key}`) ) {
      await game.settings.set(MODULE.ID, key, value);
      Logger.debug(`Setting '${key}' set to '${value}'`);
    } else {
      Logger.debug(`Setting '${key}' not found`);
    }
  }
}
