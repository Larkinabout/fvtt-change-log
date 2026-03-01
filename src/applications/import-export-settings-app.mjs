import { MODULE, TEMPLATE } from "../main/constants.mjs";
import { Logger, Utils } from "../main/utils.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const SETTING_KEYS = [
  "logDestination",
  "compactMode",
  "showEquation",
  "showSender",
  "showRecipients",
  "gmProperties",
  "gmActorTypes",
  "everyoneProperties",
  "everyoneActorTypes",
  "playerProperties"
];

export class ImportExportSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    actions: {
      exportSettings: ImportExportSettingsApp.exportSettings,
      importSettings: ImportExportSettingsApp.importSettings
    },
    classes: ["change-log-import-export-settings"],
    id: "change-log-import-export-settings",
    window: {
      title: "changeLog.importExportSettings.title",
      minimizable: false,
      resizable: false
    }
  };

  static PARTS = {
    form: {
      template: TEMPLATE.SETTINGS_EXPORT
    }
  };

  /* -------------------------------------------- */

  async _prepareContext() {
    return {};
  }

  /* -------------------------------------------- */

  /**
   * Export all module settings to a JSON file
   */
  static exportSettings() {
    const settings = {};
    for ( const key of SETTING_KEYS ) {
      settings[key] = Utils.getSetting(key);
    }
    const data = { module: MODULE.ID, settings };
    foundry.utils.saveDataToFile(JSON.stringify(data, null, 2), "text/json", "change-log-settings.json");
  }

  /* -------------------------------------------- */

  /**
   * Import module settings from a JSON file via dialog
   * @returns {Promise<boolean>} Whether the import succeeded
   */
  static async importSettings() {
    const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE.IMPORT_DIALOG);
    return foundry.applications.api.DialogV2.confirm({
      window: {
        title: game.i18n.localize("changeLog.importExportSettings.import")
      },
      content,
      modal: true,
      position: { width: 400 },
      yes: {
        icon: "fas fa-file-import",
        label: game.i18n.localize("changeLog.importExportSettings.import"),
        callback: async (event, button, dialog) => {
          const form = dialog.element.querySelector("form");
          if ( !form.data.files.length ) {
            Logger.error(game.i18n.localize("changeLog.importExportSettings.importDialog.noFile"), true);
            return false;
          }
          return processImport(form.data.files[0]);
        }
      },
      no: {
        icon: "fas fa-times",
        label: game.i18n.localize("changeLog.cancel")
      }
    });
  }
}

/* -------------------------------------------- */

/**
 * Process the import file
 * @param {File} file The file to import
 * @returns {Promise<boolean>} Whether the import succeeded
 */
async function processImport(file) {
  const json = await foundry.utils.readTextFromFile(file);
  let data;
  try {
    data = JSON.parse(json);
  } catch {
    Logger.error("Invalid JSON file", true);
    return false;
  }
  if ( data.module !== MODULE.ID ) {
    Logger.error("Invalid settings file", true);
    return false;
  }
  for ( const [key, value] of Object.entries(data.settings) ) {
    if ( SETTING_KEYS.includes(key) ) {
      await Utils.setSetting(key, value);
    }
  }
  Logger.info(game.i18n.localize("changeLog.importExportSettings.importComplete"), true);
  return true;
}
