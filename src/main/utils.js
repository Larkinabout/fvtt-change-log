import { BOOLEAN_ICON, EMPTY_ICON, MODULE } from './constants.js'

/**
 * Console logger
 */
export class Logger {
    static info (message, notify = false) {
        if (notify) ui.notifications.info(`${MODULE.NAME} | ${message}`)
        else console.log(`${MODULE.NAME} Info | ${message}`)
    }

    static error (message, notify = false) {
        if (notify) ui.notifications.error(`${MODULE.NAME} | ${message}`)
        else console.error(`${MODULE.NAME} Error | ${message}`)
    }

    static debug (message, data) {
        const isDebug = false
        if (isDebug) {
            if (!data) {
                console.log(`${MODULE.NAME} Debug | ${message}`)
                return
            }
            const dataClone = Utils.deepClone(data)
            console.log(`${MODULE.NAME} Debug | ${message}`, dataClone)
        }
    }
}

export class Utils {
    static getPropertyValue (value) {
        if ([true, false].includes(value)) return BOOLEAN_ICON[value]
        if (value === null || value === undefined) return EMPTY_ICON
        if (typeof value === 'number' && value - Math.floor(value) !== 0) return Math.round(value * 10) / 10
        return value
    }

    static getPropertyName (key) {
        let label
        label = game.i18n.localize(`changeLog.${game.system.id}.${key}`)
        if (label.startsWith('changeLog')) {
            label = game.i18n.localize(`changeLog.${game.system.id}.${key}.value`)
        }
        return (!label.startsWith('changeLog')) ? label : key
    }

    static getPropertyDocumentType (property) {
        return property.split('.')[0]
    }

    static getPropertyKey (property) {
        return property.split('.').slice(1).join('.')
    }

    static getValueByDotNotation (obj, str) {
        str = str.replace(/\[(\w+)\]/g, '.$1') // convert indexes to properties
        str = str.replace(/^\./, '') // strip a leading dot
        const arr = str.split('.')
        for (let i = 0, n = arr.length; i < n; ++i) {
            const property = arr[i]
            if (obj && property in obj) {
                obj = obj[property]
            } else {
                return
            }
        }
        return obj
    }

    /**
     * Foundry VTT's deepClone function wrapped here to avoid code error highlighting due to missing definition.
     * @public
     * @param {*} original
     * @param {*} options
     */
    static deepClone (original, options) {
        // eslint-disable-next-line no-undef
        return deepClone(original, options)
    }

    /**
     * Get active tab
     * @returns {string} The active tab
     */
    static getActiveTab () {
        if (ui.sidebar) {
            return ui.sidebar.activeTab
        } else {
            return null
        }
    }

    /**
     * Get html element by ID
     * @param {string} elementId The element ID
     * @returns {object}         The html element
     */
    static getElementById (elementId) {
        return document.querySelector(`#${elementId}`)
    }

    /**
     * Get html element by selector
     * @param {string} selector The selector
     * @returns {object}        The html element
     */
    static getElementBySelector (selector) {
        return document.querySelector(selector)
    }

    /**
     * Get setting value
     * @public
     * @param {string} key               The setting key
     * @param {string=null} defaultValue The setting default value
     * @returns {*}                      The setting value
     */
    static getSetting (key, defaultValue = null) {
        let value = defaultValue ?? null
        try {
            value = game.settings.get(MODULE.ID, key)
        } catch {
            Logger.debug(`Setting '${key}' not found`)
        }
        return value
    }

    /**
     * Set setting value
     * @public
     * @param {string} key   The setting key
     * @param {string} value The setting value
     */
    static async setSetting (key, value) {
        if (game.settings.settings.get(`${MODULE.ID}.${key}`)) {
            await game.settings.set(MODULE.ID, key, value)
            Logger.debug(`Setting '${key}' set to '${value}'`)
        } else {
            Logger.debug(`Setting '${key}' not found`)
        }
    }
}
