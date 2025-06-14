export const ACTOR_TYPES = [
  "character",
  "npc",
  "vehicle",
  "group"
];

/* -------------------------------------------- */

export const PROPERTIES = [
  "activeEffect.deleted",
  "activeEffect.disabled",
  "actor.flags.dnd5e.diamondSoul",
  "actor.flags.dnd5e.elvenAccuracy",
  "actor.flags.dnd5e.enhancedDualWielding",
  "actor.flags.dnd5e.halflingLucky",
  "actor.flags.dnd5e.initiativeAlert",
  "actor.flags.dnd5e.initiativeAdv",
  "actor.flags.dnd5e.jackOfAllTrades",
  "actor.flags.dnd5e.observantFeat",
  "actor.flags.dnd5e.powerfulBuild",
  "actor.flags.dnd5e.reliableTalent",
  "actor.flags.dnd5e.remarkableAthlete",
  "actor.flags.dnd5e.tavernBrawlerFeat",
  "actor.flags.dnd5e.weaponCriticalThreshold",
  "actor.flags.dnd5e.spellCriticalThreshold",
  "actor.flags.dnd5e.meleeCriticalDamageDice",
  "actor.inCombat",
  "actor.itemCreated",
  "actor.itemDeleted",
  "actor.name",
  "actor.system.abilities.cha.bonuses.check",
  "actor.system.abilities.cha.bonuses.save",
  "actor.system.abilities.cha.checkBonus",
  "actor.system.abilities.cha.max",
  "actor.system.abilities.cha.saveBonus",
  "actor.system.abilities.cha.proficient",
  "actor.system.abilities.cha.value",
  "actor.system.abilities.con.bonuses.check",
  "actor.system.abilities.con.bonuses.save",
  "actor.system.abilities.con.checkBonus",
  "actor.system.abilities.con.max",
  "actor.system.abilities.con.saveBonus",
  "actor.system.abilities.con.proficient",
  "actor.system.abilities.con.value",
  "actor.system.abilities.dex.bonuses.check",
  "actor.system.abilities.dex.bonuses.save",
  "actor.system.abilities.dex.checkBonus",
  "actor.system.abilities.dex.max",
  "actor.system.abilities.dex.saveBonus",
  "actor.system.abilities.dex.proficient",
  "actor.system.abilities.dex.value",
  "actor.system.abilities.hon.bonuses.check",
  "actor.system.abilities.hon.bonuses.save",
  "actor.system.abilities.hon.checkBonus",
  "actor.system.abilities.hon.max",
  "actor.system.abilities.hon.saveBonus",
  "actor.system.abilities.hon.proficient",
  "actor.system.abilities.hon.value",
  "actor.system.abilities.int.bonuses.check",
  "actor.system.abilities.int.bonuses.save",
  "actor.system.abilities.int.checkBonus",
  "actor.system.abilities.int.max",
  "actor.system.abilities.int.saveBonus",
  "actor.system.abilities.int.proficient",
  "actor.system.abilities.int.value",
  "actor.system.abilities.san.bonuses.check",
  "actor.system.abilities.san.bonuses.save",
  "actor.system.abilities.san.checkBonus",
  "actor.system.abilities.san.max",
  "actor.system.abilities.san.saveBonus",
  "actor.system.abilities.san.proficient",
  "actor.system.abilities.san.value",
  "actor.system.abilities.str.bonuses.check",
  "actor.system.abilities.str.bonuses.save",
  "actor.system.abilities.str.checkBonus",
  "actor.system.abilities.str.max",
  "actor.system.abilities.str.saveBonus",
  "actor.system.abilities.str.proficient",
  "actor.system.abilities.str.value",
  "actor.system.abilities.wis.bonuses.check",
  "actor.system.abilities.wis.bonuses.save",
  "actor.system.abilities.wis.checkBonus",
  "actor.system.abilities.wis.max",
  "actor.system.abilities.wis.saveBonus",
  "actor.system.abilities.wis.proficient",
  "actor.system.abilities.wis.value",
  "actor.system.attributes.ac.calc",
  "actor.system.attributes.ac.cover",
  "actor.system.attributes.ac.flat",
  "actor.system.attributes.ac.shield",
  "actor.system.attunement.max",
  "actor.system.attunement.value",
  "actor.system.attributes.death.success",
  "actor.system.attributes.death.failure",
  "actor.system.attributes.encumbrance.value",
  "actor.system.attributes.encumbrance.max",
  "actor.system.attributes.encumbrance.pct",
  "actor.system.attributes.encumbrance.encumbered",
  "actor.system.attributes.exhaustion",
  "actor.system.attributes.hd",
  "actor.system.attributes.hp.bonuses.level",
  "actor.system.attributes.hp.bonuses.overall",
  "actor.system.attributes.hp.max",
  "actor.system.attributes.hp.temp",
  "actor.system.attributes.hp.tempmax",
  "actor.system.attributes.hp.value",
  "actor.system.attributes.init.ability",
  "actor.system.attributes.init.bonus",
  "actor.system.attributes.init.mod",
  "actor.system.attributes.inspiration",
  "actor.system.attributes.movement.burrow",
  "actor.system.attributes.movement.climb",
  "actor.system.attributes.movement.fly",
  "actor.system.attributes.movement.hover",
  "actor.system.attributes.movement.swim",
  "actor.system.attributes.movement.units",
  "actor.system.attributes.movement.walk",
  "actor.system.attributes.prof",
  "actor.system.attributes.senses.blindsight",
  "actor.system.attributes.senses.darkvision",
  "actor.system.attributes.senses.special",
  "actor.system.attributes.senses.tremorsense",
  "actor.system.attributes.senses.truesight",
  "actor.system.attributes.senses.units",
  "actor.system.attributes.spellcasting",
  "actor.system.attributes.spelldc",
  "actor.system.attributes.spellmod",
  "actor.system.bastion.description",
  "actor.system.bastion.name",
  "actor.system.bonuses.abilities.check",
  "actor.system.bonuses.abilities.save",
  "actor.system.bonuses.abilities.skill",
  "actor.system.bonuses.msak.attack",
  "actor.system.bonuses.msak.damage",
  "actor.system.bonuses.mwak.attack",
  "actor.system.bonuses.mwak.damage",
  "actor.system.bonuses.rsak.attack",
  "actor.system.bonuses.rsak.damage",
  "actor.system.bonuses.rwak.attack",
  "actor.system.bonuses.rwak.damage",
  "actor.system.bonuses.spell.dc",
  "actor.system.currency.cp",
  "actor.system.currency.ep",
  "actor.system.currency.gp",
  "actor.system.currency.pp",
  "actor.system.currency.sp",
  "actor.system.details.age",
  "actor.system.details.alignment",
  "actor.system.details.appearance",
  "actor.system.details.biography.value",
  "actor.system.details.bond",
  "actor.system.details.eyes",
  "actor.system.details.faith",
  "actor.system.details.flaw",
  "actor.system.details.gender",
  "actor.system.details.hair",
  "actor.system.details.height",
  "actor.system.details.ideal",
  "actor.system.details.level",
  "actor.system.details.originalClass",
  "actor.system.details.race",
  "actor.system.details.skin",
  "actor.system.details.trait",
  "actor.system.details.type.custom",
  "actor.system.details.type.subtype",
  "actor.system.details.type.value",
  "actor.system.details.weight",
  "actor.system.details.xp.value",
  "actor.system.details.xp.max",
  "actor.system.resources.lair.value",
  "actor.system.resources.lair.initiative",
  "actor.system.resources.legact.value",
  "actor.system.resources.legact.max",
  "actor.system.resources.legres.value",
  "actor.system.resources.legres.max",
  "actor.system.resources.primary.max",
  "actor.system.resources.primary.value",
  "actor.system.resources.secondary.max",
  "actor.system.resources.secondary.value",
  "actor.system.resources.tertiary.max",
  "actor.system.resources.tertiary.value",
  "actor.system.skills.acr.ability",
  "actor.system.skills.acr.bonus",
  "actor.system.skills.acr.bonuses.check",
  "actor.system.skills.acr.bonuses.passive",
  "actor.system.skills.acr.value",
  "actor.system.skills.ani.ability",
  "actor.system.skills.ani.bonus",
  "actor.system.skills.ani.bonuses.check",
  "actor.system.skills.ani.bonuses.passive",
  "actor.system.skills.ani.value",
  "actor.system.skills.arc.ability",
  "actor.system.skills.arc.bonus",
  "actor.system.skills.arc.bonuses.check",
  "actor.system.skills.arc.bonuses.passive",
  "actor.system.skills.arc.value",
  "actor.system.skills.ath.ability",
  "actor.system.skills.ath.bonus",
  "actor.system.skills.ath.bonuses.check",
  "actor.system.skills.ath.bonuses.passive",
  "actor.system.skills.ath.value",
  "actor.system.skills.dec.ability",
  "actor.system.skills.dec.bonus",
  "actor.system.skills.dec.bonuses.check",
  "actor.system.skills.dec.bonuses.passive",
  "actor.system.skills.dec.value",
  "actor.system.skills.his.ability",
  "actor.system.skills.his.bonus",
  "actor.system.skills.his.bonuses.check",
  "actor.system.skills.his.bonuses.passive",
  "actor.system.skills.his.value",
  "actor.system.skills.ins.ability",
  "actor.system.skills.ins.bonus",
  "actor.system.skills.ins.bonuses.check",
  "actor.system.skills.ins.bonuses.passive",
  "actor.system.skills.ins.value",
  "actor.system.skills.inv.ability",
  "actor.system.skills.inv.bonus",
  "actor.system.skills.inv.bonuses.check",
  "actor.system.skills.inv.bonuses.passive",
  "actor.system.skills.inv.value",
  "actor.system.skills.itm.ability",
  "actor.system.skills.itm.bonus",
  "actor.system.skills.itm.bonuses.check",
  "actor.system.skills.itm.bonuses.passive",
  "actor.system.skills.itm.value",
  "actor.system.skills.med.ability",
  "actor.system.skills.med.bonus",
  "actor.system.skills.med.bonuses.check",
  "actor.system.skills.med.bonuses.passive",
  "actor.system.skills.med.value",
  "actor.system.skills.nat.ability",
  "actor.system.skills.nat.bonus",
  "actor.system.skills.nat.bonuses.check",
  "actor.system.skills.nat.bonuses.passive",
  "actor.system.skills.nat.value",
  "actor.system.skills.per.ability",
  "actor.system.skills.per.bonus",
  "actor.system.skills.per.bonuses.check",
  "actor.system.skills.per.bonuses.passive",
  "actor.system.skills.per.value",
  "actor.system.skills.prc.ability",
  "actor.system.skills.prc.bonus",
  "actor.system.skills.prc.bonuses.check",
  "actor.system.skills.prc.bonuses.passive",
  "actor.system.skills.prc.value",
  "actor.system.skills.prf.ability",
  "actor.system.skills.prf.bonus",
  "actor.system.skills.prf.bonuses.check",
  "actor.system.skills.prf.bonuses.passive",
  "actor.system.skills.prf.value",
  "actor.system.skills.rel.ability",
  "actor.system.skills.rel.bonus",
  "actor.system.skills.rel.bonuses.check",
  "actor.system.skills.rel.bonuses.passive",
  "actor.system.skills.rel.value",
  "actor.system.skills.slt.ability",
  "actor.system.skills.slt.bonus",
  "actor.system.skills.slt.bonuses.check",
  "actor.system.skills.slt.bonuses.passive",
  "actor.system.skills.slt.value",
  "actor.system.skills.ste.ability",
  "actor.system.skills.ste.bonus",
  "actor.system.skills.ste.bonuses.check",
  "actor.system.skills.ste.bonuses.passive",
  "actor.system.skills.ste.value",
  "actor.system.skills.sur.ability",
  "actor.system.skills.sur.bonus",
  "actor.system.skills.sur.bonuses.check",
  "actor.system.skills.sur.bonuses.passive",
  "actor.system.skills.sur.value",
  "actor.system.spells.pact.level",
  "actor.system.spells.pact.max",
  "actor.system.spells.pact.slotAvailable",
  "actor.system.spells.pact.slotsAvailable",
  "actor.system.spells.pact.value",
  "actor.system.spells.spell1.value",
  "actor.system.spells.spell1.max",
  "actor.system.spells.spell2.value",
  "actor.system.spells.spell2.max",
  "actor.system.spells.spell3.value",
  "actor.system.spells.spell3.max",
  "actor.system.spells.spell4.value",
  "actor.system.spells.spell4.max",
  "actor.system.spells.spell5.value",
  "actor.system.spells.spell5.max",
  "actor.system.spells.spell6.value",
  "actor.system.spells.spell6.max",
  "actor.system.spells.spell7.value",
  "actor.system.spells.spell7.max",
  "actor.system.spells.spell8.value",
  "actor.system.spells.spell8.max",
  "actor.system.spells.spell9.value",
  "actor.system.spells.spell9.max",
  "actor.system.traits.size",
  "actor.system.tools.art.ability",
  "actor.system.tools.art.bonus",
  "actor.system.tools.art.bonuses.check",
  "actor.system.tools.art.value",
  "actor.system.tools.disg.ability",
  "actor.system.tools.disg.bonus",
  "actor.system.tools.disg.bonuses.check",
  "actor.system.tools.disg.value",
  "actor.system.tools.forg.ability",
  "actor.system.tools.forg.bonus",
  "actor.system.tools.forg.bonuses.check",
  "actor.system.tools.forg.value",
  "actor.system.tools.game.ability",
  "actor.system.tools.game.bonus",
  "actor.system.tools.game.bonuses.check",
  "actor.system.tools.game.value",
  "actor.system.tools.herb.ability",
  "actor.system.tools.herb.bonus",
  "actor.system.tools.herb.bonuses.check",
  "actor.system.tools.herb.value",
  "actor.system.tools.music.ability",
  "actor.system.tools.music.bonus",
  "actor.system.tools.music.bonuses.check",
  "actor.system.tools.music.value",
  "actor.system.tools.navg.ability",
  "actor.system.tools.navg.bonus",
  "actor.system.tools.navg.bonuses.check",
  "actor.system.tools.navg.value",
  "actor.system.tools.pois.ability",
  "actor.system.tools.pois.bonus",
  "actor.system.tools.pois.bonuses.check",
  "actor.system.tools.pois.value",
  "actor.system.tools.thief.ability",
  "actor.system.tools.thief.bonus",
  "actor.system.tools.thief.bonuses.check",
  "actor.system.tools.thief.value",
  "actor.system.tools.vehicle.ability",
  "actor.system.tools.vehicle.bonus",
  "actor.system.tools.vehicle.bonuses.check",
  "actor.system.tools.vehicle.value",
  "item.name",
  "item.system.attuned",
  "item.system.attunement",
  "item.system.capacity.type",
  "item.system.capacity.value",
  "item.system.currency.pp",
  "item.system.currency.gp",
  "item.system.currency.ep",
  "item.system.currency.sp",
  "item.system.currency.cp",
  "item.system.damage.base.bonus",
  "item.system.damage.base.denomination",
  "item.system.damage.base.number",
  "item.system.damage.custom.enabled",
  "item.system.damage.custom.formula",
  "item.system.description.value",
  "item.system.description.chat",
  "item.system.description.unidentified",
  "item.system.equipped",
  "item.system.hitDiceUsed",
  "item.system.identified",
  "item.system.level",
  "item.system.mastery",
  "item.system.preparation.prepared",
  "item.system.price.denomination",
  "item.system.price.value",
  "item.system.proficient",
  "item.system.properties.ada",
  "item.system.properties.amm",
  "item.system.properties.concentration",
  "item.system.properties.fin",
  "item.system.properties.fir",
  "item.system.properties.foc",
  "item.system.properties.hvy",
  "item.system.properties.lgt",
  "item.system.properties.lod",
  "item.system.properties.material",
  "item.system.properties.mgc",
  "item.system.properties.rch",
  "item.system.properties.rel",
  "item.system.properties.ret",
  "item.system.properties.ritual",
  "item.system.properties.sil",
  "item.system.properties.somatic",
  "item.system.properties.spc",
  "item.system.properties.thr",
  "item.system.properties.two",
  "item.system.properties.ver",
  "item.system.properties.vocal",
  "item.system.quantity",
  "item.system.range.long",
  "item.system.range.reach",
  "item.system.range.units",
  "item.system.range.value",
  "item.system.rarity",
  "item.system.school",
  "item.system.type.value",
  "item.system.uses.max",
  "item.system.uses.spent",
  "item.system.uses.value",
  "item.system.weight.value",
  "item.system.weight.units",
  "token.actorLink",
  "token.disposition",
  "token.elevation",
  "token.light.angle",
  "token.light.bright",
  "token.light.color",
  "token.light.dim",
  "token.lockRotation",
  "token.name",
  "token.rotation",
  "token.sort",
  "token.sight.angle",
  "token.sight.attenuation",
  "token.sight.brightness",
  "token.sight.color",
  "token.sight.contrast",
  "token.sight.enabled",
  "token.sight.range",
  "token.sight.saturation",
  "token.sight.visionMode"
];

/* -------------------------------------------- */

export const DERIVED_PROPERTIES = [
  "actor.system.attributes.encumbrance.value",
  "actor.system.attributes.encumbrance.max",
  "actor.system.attributes.encumbrance.pct",
  "actor.system.attributes.encumbrance.encumbered",
  "actor.system.spells.pact.max"
];
