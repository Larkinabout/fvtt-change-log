import { DELIMITER, MODULE } from "./constants.mjs";
import { Logger, Utils } from "./utils.mjs";

const SETTING = {
  MODULE_VERSION: "migrationVersion",
  DND5E_VERSION: "dnd5eSystemVersion"
};

/* -------------------------------------------- */

/**
 * Register migration tracking settings.
 */
export function register() {
  game.settings.register(MODULE.ID, SETTING.MODULE_VERSION, {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });

  game.settings.register(MODULE.ID, SETTING.DND5E_VERSION, {
    scope: "world",
    config: false,
    type: String,
    default: ""
  });
}

/* -------------------------------------------- */

/**
 * Run migrations based on module and system versions.
 * @returns {Promise<void>}
 */
export async function migrate() {
  if ( !game.user.isGM ) return;

  const moduleVersion = game.modules.get(MODULE.ID)?.version ?? "";
  const storedModuleVersion = Utils.getSetting(SETTING.MODULE_VERSION) ?? "";

  let isSuccess = true;

  if ( game.system.id === "dnd5e" ) {
    isSuccess &&= await migrateDnd5e();
  }

  if ( !isSuccess ) return;

  if ( moduleVersion && moduleVersion !== storedModuleVersion ) {
    await Utils.setSetting(SETTING.MODULE_VERSION, moduleVersion);
  }
}

/* -------------------------------------------- */

/**
 * Run dnd5e-specific migrations.
 * @returns {Promise<boolean>} Whether all migrations were successful.
 */
async function migrateDnd5e() {
  const dnd5eVersion = game.system.version ?? "";
  if ( !dnd5eVersion ) return true;

  const storedDnd5eVersion = Utils.getSetting(SETTING.DND5E_VERSION) ?? "";

  const shouldRun = version => {
    if ( foundry.utils.isNewerVersion(version, dnd5eVersion) ) return false;
    return !storedDnd5eVersion || foundry.utils.isNewerVersion(version, storedDnd5eVersion);
  };

  let isSuccess = true;

  // Migrate senses
  if ( shouldRun("5.3.0") ) {
    isSuccess &&= await migrateDnd5eSensesPaths();
  }

  if ( isSuccess && dnd5eVersion !== storedDnd5eVersion ) {
    await Utils.setSetting(SETTING.DND5E_VERSION, dnd5eVersion);
  }

  return isSuccess;
}

/* -------------------------------------------- */

const DND5E_SENSES_RENAMES = {
  "actor.system.attributes.senses.darkvision": "actor.system.attributes.senses.ranges.darkvision",
  "actor.system.attributes.senses.blindsight": "actor.system.attributes.senses.ranges.blindsight",
  "actor.system.attributes.senses.tremorsense": "actor.system.attributes.senses.ranges.tremorsense",
  "actor.system.attributes.senses.truesight": "actor.system.attributes.senses.ranges.truesight"
};

/* -------------------------------------------- */

/**
 * Rewrite stored properties changed in dnd5e 5.3.0.
 * @returns {Promise<boolean>} Whether the migration was successful.
 */
async function migrateDnd5eSensesPaths() {
  try {
    const keys = ["everyoneProperties", "gmProperties", "playerProperties"];
    for ( const key of keys ) {
      const value = Utils.getSetting(key);
      if ( !value ) continue;

      const parts = value.split(DELIMITER);
      let changed = false;
      const updated = parts.map(part => {
        const renamed = DND5E_SENSES_RENAMES[part];
        if ( renamed && !parts.includes(renamed) ) {
          changed = true;
          return renamed;
        }
        if ( renamed ) {
          changed = true;
          return null;
        }
        return part;
      }).filter(part => part !== null);

      if ( changed ) {
        await Utils.setSetting(key, updated.join(DELIMITER));
        Logger.info(`Migrated dnd5e senses paths in '${key}' to senses.ranges.*`);
      }
    }
    return true;
  } catch ( err ) {
    Logger.error(`Failed to migrate dnd5e senses paths: ${err.message}`);
    return false;
  }
}
